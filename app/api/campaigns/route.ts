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
// Handle new campaign created
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
    INSERT INTO Campaigns(ID, Title, Description, URL, Image, BlockHeightExpiration, FundingGoal, TotalRaised, DateCreated, DateUpdated)
    VALUES (${campaign.id}, ${campaign.title}, ${campaign.description}, ${campaign.url}, ${campaign.image}, ${campaign.blockHeightExpiration}, ${campaign.fundingGoal}, ${campaign.totalRaised}, to_timestamp(${campaign.dateCreated} / 1000.0), to_timestamp(${campaign.dateUpdated} / 1000.0))
    RETURNING *
  `;
  const createdCampaign = result.rows[0];

  return Response.json(createdCampaign);
}

// End any campaigns that have expired (webhook for chainhook event for new block)
// PUT /api/campaigns/close

// Check for any campaigns with BlockHeightExpiration >= the current block
// If TotalRaised >= FundingGoal, send funds to campaign owner
// If TotalRaised < FundingGoal, send refunds to all contributors

// TODO: this one could definitely be improved by running in a process outside of this request

// await fetch("http://localhost:3000/api/campaigns", {
//     "credentials": "omit",
//     "headers": {
//         "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
//         "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
//         "Accept-Language": "en-US,en;q=0.5",
//         "Upgrade-Insecure-Requests": "1",
//         "Sec-Fetch-Dest": "document",
//         "Sec-Fetch-Mode": "navigate",
//         "Sec-Fetch-Site": "same-origin",
//         "Pragma": "no-cache",
//         "Cache-Control": "no-cache"
//     },
//     "body": "{ \"id\": 2, \"title\": \"Ocean Exploration\", \"description\": \"Mission to go to the bottom of the ocean.\", \"blockHeightExpiration\": 433200, \"fundingGoal\": 4000000, \"totalRaised\": 0, \"dateCreated\": 1706304738864, \"dateUpdated\": 1706304738864 }",
//     "method": "POST",
//     "mode": "cors"
// });
