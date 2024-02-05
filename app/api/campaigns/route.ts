import { sql } from "@vercel/postgres";
import { Campaign, CampaignSchema, campaignDbToClient } from "../../models";

// GET /api/campaigns
// Get list of campaigns and their funding info
export async function GET() {
  // TODO: pagination
  const result = await sql`SELECT * FROM Campaigns`;

  // Get campaigns from database
  const campaigns: Campaign[] = result.rows.map(campaignDbToClient);

  return Response.json(campaigns);
}

// POST /api/campaigns
// Handle new campaign confirmed on-chain
export async function POST(request: Request) {
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

  // TODO: better validation & error handling. Most issues just throw and respond with 500.
  const result = await sql`
    INSERT INTO Campaigns(ChainTxID, ChainIsPending, ChainConfirmedId, Title, Owner, Description, URL, Image, BlockHeightExpiration, FundingGoal, TotalRaised, DateCreated, DateUpdated)
    VALUES (${campaign.chainTxId}, ${campaign.chainIsPending}, ${campaign.chainConfirmedId}, ${campaign.title}, ${campaign.owner}, ${campaign.description}, ${campaign.url}, ${campaign.image}, ${campaign.blockHeightExpiration}, ${campaign.fundingGoal}, ${campaign.totalRaised}, to_timestamp(${campaign.dateCreated} / 1000.0), to_timestamp(${campaign.dateUpdated} / 1000.0))
    RETURNING *
  `;
  const createdCampaign = result.rows[0];

  return Response.json(createdCampaign);
}
