import { sql } from "@vercel/postgres";
import {
  Contribution,
  ContributionSchema,
  contributionDbToClient,
} from "../../../../../models";

// GET /api/campaigns/{campaignId}/contributions/{principal}
// Get contribution for user
export async function GET(
  request: Request,
  { params }: { params: { campaignId: string; principal: string } }
) {
  const campaignId = params.campaignId;
  const principal = params.principal;

  let contribution: Contribution | null;
  try {
    const result =
      await sql`SELECT * FROM Contributions WHERE CampaignID = ${campaignId} AND Principal = ${principal};`;
    contribution =
      result.rows.length > 0 ? contributionDbToClient(result.rows[0]) : null;
  } catch (err) {
    console.error(err);
    return new Response("Not found", {
      status: 404,
    });
  }

  return Response.json(contribution);
}

// Handle contribution data updated
// PUT /api/campaigns/{campaignId}/contributions/{principal}
export async function PUT(
  request: Request,
  { params }: { params: { campaignId: string; principal: string } }
) {
  const campaignId = params.campaignId;
  const principal = params.principal;

  let contribution: Contribution;
  try {
    const body = await request.json();
    contribution = ContributionSchema.parse(body);
  } catch (err) {
    console.error(err);
    return new Response("Invalid contribution data", {
      status: 400,
    });
  }

  // TODO: improve validation & error handling. Most issues just throw and respond with 500.
  const result = await sql`
    UPDATE Contributions
    SET Amount = ${contribution.amount}, IsRefunded = ${
    contribution.isRefunded
  }, DateUpdated = to_timestamp(${Date.now()} / 1000.0)
    WHERE CampaignId = ${campaignId} AND Principal = ${principal}
    RETURNING *
  `;

  const updatedContribution = result.rows[0];
  return Response.json(updatedContribution);
}
