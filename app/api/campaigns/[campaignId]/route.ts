import { sql } from "@vercel/postgres";
import {
  Campaign,
  CampaignDetailsResponse,
  CampaignSchema,
  campaignDbToClient,
  getCampaignDataHash,
} from "../../../models";
import {
  APPLICATION_ADDRESS,
  CONTRACT_DEPLOYER_ADDRESS,
  CONTRACT_NAME,
  ContractFunctionName,
  STACKS_NETWORK,
} from "../../../../utils/stacks-api";
import {
  Cl,
  callReadOnlyFunction,
  cvToJSON,
  ClarityType,
} from "@stacks/transactions";

// Handle campaign data updated
// PUT /api/campaigns/{id}
export async function PUT(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  const campaignId = params.campaignId;
  let campaign: Campaign;
  try {
    const body = await request.json();
    campaign = CampaignSchema.parse(body);
  } catch (err) {
    console.error(err);
    return new Response("Invalid campaign data", {
      status: 400,
    });
  }

  // TODO: improve validation & error handling. Most issues just throw and respond with 500.
  const result = await sql`
    UPDATE Campaigns
    SET Description = ${campaign.description}, isCollected = ${
    campaign.isCollected
  }, URL = ${campaign.url}, Image = ${
    campaign.image
  }, BlockHeightExpiration = ${campaign.blockHeightExpiration}, FundingGoal = ${
    campaign.fundingGoal
  }, TotalRaised = ${
    campaign.totalRaised
  }, DateUpdated = to_timestamp(${Date.now()} / 1000.0)
    WHERE ID = ${campaignId}
    RETURNING *
  `;

  const updatedCampaign = result.rows[0];
  return Response.json(updatedCampaign);
}

// GET /api/campaigns/{id}
// Get campaign details
export async function GET(
  _request: Request,
  { params }: { params: { campaignId: string } }
) {
  const campaignId = params.campaignId;

  // Get campaign from application database
  let campaign: Campaign;
  try {
    const result = await sql`SELECT * FROM Campaigns WHERE ID = ${campaignId};`;
    campaign = campaignDbToClient(result.rows[0]);
  } catch (err) {
    console.error(err);
    return new Response("Not found", {
      status: 404,
    });
  }

  // Get campaign info from blockchain
  let fundingInfo = null;
  let onChainHash;
  const campaignChainId = campaign.chainConfirmedId;
  if (campaignChainId) {
    const getCampaignFn: ContractFunctionName = "get-campaign";
    const getCampaignFundingFn: ContractFunctionName =
      "get-campaign-funding-totals";

    try {
      const getCampaignResponse = await callReadOnlyFunction({
        contractAddress: CONTRACT_DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: getCampaignFn,
        functionArgs: [Cl.uint(campaignChainId)],
        network: STACKS_NETWORK,
        senderAddress: APPLICATION_ADDRESS,
      });
      if (getCampaignResponse.type === ClarityType.ResponseErr) {
        throw new Error("Campaign not found on chain");
      }

      onChainHash =
        cvToJSON(getCampaignResponse)?.value?.value?.["data-hash"]?.value;

      // Get campaign funding info from blockchain
      const getCampaignFundingResponse = await callReadOnlyFunction({
        contractAddress: CONTRACT_DEPLOYER_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: getCampaignFundingFn,
        functionArgs: [Cl.uint(campaignChainId)],
        network: STACKS_NETWORK,
        senderAddress: APPLICATION_ADDRESS,
      });
      const campaignFunding = cvToJSON(getCampaignFundingResponse)?.value
        ?.value;
      fundingInfo = {
        amount: parseInt(
          campaignFunding?.["funding-total-amount"]?.value || "0"
        ),
        numContributions: parseInt(
          campaignFunding?.["total-num-contributions"]?.value || "0"
        ),
        isCollected: campaignFunding?.["is-collected"]?.value,
      };
    } catch (err) {
      console.error(err);
      console.log(
        "Campaign not found on chain, only returning data from application DB."
      );
    }
  }

  const hash = getCampaignDataHash(
    campaign.title,
    campaign.description,
    campaign.url,
    campaign.image
  );

  const response: CampaignDetailsResponse = {
    campaign,
    fundingInfo,
    isDataValidatedOnChain: onChainHash === hash,
  };
  return Response.json(response);
}
