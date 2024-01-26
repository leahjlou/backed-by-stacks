import { sql } from "@vercel/postgres";
import { Campaign, CampaignSchema } from "../../models";

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

// Get campaign details
// GET /api/campaigns/{id}

// Get campaign from chain
// Get campaign funding totals from chain
// Verify that the hash is valid
