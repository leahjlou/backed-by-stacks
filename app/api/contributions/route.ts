import { sql } from "@vercel/postgres";
import { Contribution, ContributionSchema } from "../../models";

// POST /api/contributions
// Handle contribution made to campaign
export async function POST(request: Request) {
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
  let resultingContribution;

  //  If the given principal has made a previous contribution, sum the total in the existing db row
  const result = await sql`
    INSERT INTO Contributions(CampaignID, Principal, Amount, DateCreated, DateUpdated)
    VALUES (${contribution.campaignId}, ${contribution.principal}, ${contribution.amount}, to_timestamp(${contribution.dateCreated} / 1000.0), to_timestamp(${contribution.dateUpdated} / 1000.0))
    ON CONFLICT (CampaignID, Principal) DO UPDATE
      SET Amount = Contributions.Amount + EXCLUDED.Amount,
      DateUpdated = EXCLUDED.DateUpdated
    RETURNING *;
  `;

  // Add the contribution to the total for the campaign
  await sql`
    UPDATE Campaigns
    SET TotalRaised = Campaigns.TotalRaised + ${contribution.amount}
    WHERE ID = ${contribution.campaignId};
  `;

  resultingContribution = result.rows[0];

  return Response.json(resultingContribution);
}
