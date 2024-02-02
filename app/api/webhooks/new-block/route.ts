import { sql } from "@vercel/postgres";
import { Campaign, campaignDbToClient } from "../../../models";
import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { TransactionsApi } from "@stacks/blockchain-api-client";
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
  callReadOnlyFunction,
  cvToJSON,
  hexToCV,
} from "@stacks/transactions";

// POST /api/webhooks/new-block
// New block was mined
// Check for confirmed campaigns and
// Handle new campaign confirmed on-ochain

const transactionsApi = new TransactionsApi(BLOCKCHAIN_API_CONFIG);

// TODO: update UI to show pending on chain and failed fundraisers
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

  return Response.json({});
}

// End any campaigns that have expired (webhook for chainhook event for new block)
// PUT /api/campaigns/close

// Check for any campaigns with BlockHeightExpiration >= the current block
// If TotalRaised >= FundingGoal, send funds to campaign owner
// If TotalRaised < FundingGoal, send refunds to all contributors

// TODO: this one could definitely be improved by running in a process outside of this request
