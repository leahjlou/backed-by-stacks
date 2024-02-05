import { sql } from "@vercel/postgres";
import {
  Campaign,
  Contribution,
  campaignDbToClient,
  contributionDbToClient,
} from "../../../models";
import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { BlocksApi, TransactionsApi } from "@stacks/blockchain-api-client";
import {
  TX_STATUS_SUCCEEDED,
  TX_STATUS_PENDING,
  CONTRACT_DEPLOYER_ADDRESS,
  CONTRACT_NAME,
  ContractFunctionName,
  STACKS_NETWORK,
  APPLICATION_ADDRESS,
  BLOCKCHAIN_API_CONFIG,
} from "../../../../utils/stacks-api";
import {
  Cl,
  ClarityType,
  callReadOnlyFunction,
  cvToJSON,
  hexToCV,
} from "@stacks/transactions";

// POST /api/webhooks/new-block
// New block was mined
// Synchronize application data with on-chain data, and handle closing of campaigns.

const transactionsApi = new TransactionsApi(BLOCKCHAIN_API_CONFIG);
const blocksApi = new BlocksApi(BLOCKCHAIN_API_CONFIG);

export async function POST(request: Request) {
  // Settle any pending campaigns
  const pendingCampaigns =
    await sql`SELECT * FROM Campaigns WHERE ChainIsPending = TRUE`;

  for (let i = 0; i < pendingCampaigns.rows.length; i++) {
    const row = pendingCampaigns.rows[i];
    const campaign: Campaign = campaignDbToClient(row);
    let tx;
    try {
      tx = await transactionsApi.getTransactionById({
        txId: campaign.chainTxId,
      });
    } catch (err) {
      console.error(err);
      console.log("Campaign transaction not found. Skipping.");
      continue;
    }

    const txStatus = "tx_status" in tx ? tx.tx_status : TX_STATUS_PENDING;

    // if transaction status is not pending
    if (txStatus !== TX_STATUS_PENDING) {
      const finishedTx: Transaction = tx as Transaction;

      if (txStatus === TX_STATUS_SUCCEEDED) {
        // The ID of the campaign confirmed on-chain
        const chainConfirmedId = cvToJSON(hexToCV(finishedTx.tx_result.hex))
          ?.value?.value;

        if (chainConfirmedId) {
          // Get campaign info from chain
          const getCampaignFn: ContractFunctionName = "get-campaign";
          let blockHeightExpiration;
          try {
            const getCampaignResponse = await callReadOnlyFunction({
              contractAddress: CONTRACT_DEPLOYER_ADDRESS,
              contractName: CONTRACT_NAME,
              functionName: getCampaignFn,
              functionArgs: [Cl.uint(chainConfirmedId)],
              network: STACKS_NETWORK,
              senderAddress: APPLICATION_ADDRESS,
            });

            // The application needs to have the same block height expiration as the chain, so it
            // must be retrieved here.
            // This could be simplified if the `add-campaign` function in the contract were changed
            // to accept the expiration block instead of the duration (# of blocks). Then the application
            // could determine the expiration block and send that to the contract, and both would always match.

            blockHeightExpiration =
              cvToJSON(getCampaignResponse)?.value?.value?.["end-block-height"]
                ?.value;
          } catch (error) {
            console.error(error);
            return new Response("Server error", {
              status: 500,
            });
          }

          // Update DB row to reflect latest campaign data from on-chain
          await sql`
            UPDATE Campaigns
            SET ChainIsPending = False, ChainConfirmedID = ${chainConfirmedId}, BlockHeightExpiration = ${blockHeightExpiration}
            WHERE ID = ${campaign.id}
          `;
        } else {
          console.log(
            `Transaction ${
              campaign.chainTxId
            } was found to be no longer pending, but no confirmed Campaign ID was received from the contract call. Received: ${cvToJSON(
              hexToCV(finishedTx.tx_result.hex)
            )} Skipping any data update.`
          );
        }
      } else {
        // The transaction failed on chain
        await sql`
          UPDATE Campaigns
          SET ChainIsPending = False
          WHERE ID = ${campaign.id}
        `;
      }
    }
  }

  // Close out any campaigns that have expired
  // Check for any campaigns with BlockHeightExpiration >= the current block
  const { results: blocks } = await blocksApi.getBlocks({ limit: 1 });
  const chainTip = blocks[0].height;
  const expiredCampaigns = await sql`SELECT * FROM Campaigns
      WHERE ChainConfirmedID IS NOT NULL
      AND IsCollected IS NOT TRUE
      AND BlockHeightExpiration <= ${chainTip}`;

  for (let i = 0; i < expiredCampaigns.rows.length; i++) {
    const row = expiredCampaigns.rows[i];
    const campaign: Campaign = campaignDbToClient(row);
    if (Number(campaign.totalRaised) >= campaign.fundingGoal) {
      // Call fund-campaign (campaign-id)
      const fundCampaignFn: ContractFunctionName = "fund-campaign";
      try {
        const fundCampaignResponse = await callReadOnlyFunction({
          contractAddress: CONTRACT_DEPLOYER_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: fundCampaignFn,
          functionArgs: [Cl.uint(campaign.chainConfirmedId || 0)],
          network: STACKS_NETWORK,
          senderAddress: APPLICATION_ADDRESS,
        });
        if (fundCampaignResponse.type === ClarityType.ResponseErr) {
          throw new Error("Error funding campaign");
        }

        await sql`UPDATE Campaigns SET IsCollected = TRUE WHERE ID = ${campaign.id}`;
      } catch (error) {
        console.error(error);
        // Move on to next campaign
      }
    } else {
      const contributions = await sql`SELECT * FROM Contributions
        WHERE CampaignId = ${campaign.id}
        AND IsRefunded IS NOT TRUE`;

      const refunds = contributions.rows.map(async (row) => {
        const contribution: Contribution = contributionDbToClient(row);
        // Call refund-contribution (campaign-id, contributor)
        const refundFn: ContractFunctionName = "refund-contribution";
        try {
          console.log({ campaign });
          console.log(campaign.chainConfirmedId);
          const refundResponse = await callReadOnlyFunction({
            contractAddress: CONTRACT_DEPLOYER_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: refundFn,
            functionArgs: [
              Cl.uint(campaign.chainConfirmedId || 0),
              Cl.principal(contribution.principal),
            ],
            network: STACKS_NETWORK,
            senderAddress: APPLICATION_ADDRESS,
          });
          // TODO: handle specific errors from contract function
          if (refundResponse.type === ClarityType.ResponseErr) {
            throw new Error(
              `Error refunding contribution: ${JSON.stringify(
                cvToJSON(refundResponse)
              )}`
            );
          }

          await sql`UPDATE Contributions SET IsRefunded = TRUE WHERE CampaignId = ${contribution.campaignId} AND Principal = ${contribution.principal}`;
        } catch (error) {
          console.error(error);
          // Don't abort; keep going to refund other contributions
        }
      });

      await Promise.all(refunds);
    }
  }

  // If TotalRaised >= FundingGoal, send funds to campaign owner
  // If TotalRaised < FundingGoal, send refunds to all contributors

  return Response.json({});
}
