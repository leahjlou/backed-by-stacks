import { sql } from "@vercel/postgres";
import {
  Campaign,
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
import { Cl, callReadOnlyFunction, cvToJSON } from "@stacks/transactions";

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
    SET Description = ${campaign.description}, URL = ${campaign.url}, Image = ${campaign.image}, BlockHeightExpiration = ${campaign.blockHeightExpiration}, FundingGoal = ${campaign.fundingGoal}, TotalRaised = ${campaign.totalRaised}, DateUpdated = to_timestamp(${campaign.dateUpdated} / 1000.0)
    WHERE ID = ${campaignId}
    RETURNING *
  `;

  const updatedCampaign = result.rows[0];
  return Response.json(updatedCampaign);
}

// GET /api/campaigns/{id}
// Get campaign details
export async function GET(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  const campaignId = params.campaignId;

  const getCampaignFn: ContractFunctionName = "get-campaign";
  const getCampaignFundingFn: ContractFunctionName =
    "get-campaign-funding-totals";

  // Get campaign info from blockchain
  const getCampaignResponse = await callReadOnlyFunction({
    contractAddress: CONTRACT_DEPLOYER_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: getCampaignFn,
    functionArgs: [Cl.uint(campaignId)],
    network: STACKS_NETWORK,
    senderAddress: APPLICATION_ADDRESS,
  });
  const onChainHash =
    cvToJSON(getCampaignResponse)?.value?.value?.["data-hash"]?.value;
  if (!onChainHash) {
    return new Response("No campaign found on chain", {
      status: 404,
    });
  }

  // Get campaign funding info from blockchain
  const getCampaignFundingResponse = await callReadOnlyFunction({
    contractAddress: CONTRACT_DEPLOYER_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: getCampaignFundingFn,
    functionArgs: [Cl.uint(campaignId)],
    network: STACKS_NETWORK,
    senderAddress: APPLICATION_ADDRESS,
  });
  const campaignFunding = cvToJSON(getCampaignFundingResponse)?.value?.value;
  const fundingInfo = {
    amount: parseInt(campaignFunding?.["funding-total-amount"]?.value || "0"),
    numContributions: parseInt(
      campaignFunding?.["total-num-contributions"]?.value || "0"
    ),
    isCollected: campaignFunding?.["is-collected"]?.value,
  };

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

  const hash = getCampaignDataHash(campaign);
  console.log({ hash });

  return Response.json({
    campaign,
    fundingInfo,
    isDataValidatedOnChain: onChainHash === hash,
  });
}
