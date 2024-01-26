import { sql } from '@vercel/postgres';
import { Contribution, ContributionSchema } from "../models";

export async function GET() {
  return Response.json({});
}

// Handle contribution made to campaign
// If the given principal has made a previous contribution, the total is summed in the db
// POST /api/contributions
export async function POST(request: Request) {
  let contribution: Contribution;
  try {
    const body = await request.json();
    contribution = ContributionSchema.parse(body);
  } catch (err) {
    console.error(err);
    return new Response('Invalid contribution data', {
      status: 400
    });
  }

  const result = await sql`
    INSERT INTO Contributions(ID, Description, URL, Image, DateCreated, DateUpdated)
    VALUES (${contribution.id}, ${contribution.description}, ${contribution.url}, ${contribution.image}, to_timestamp(${contribution.dateCreated} / 1000.0), to_timestamp(${contribution.dateUpdated} / 1000.0))
    RETURNING *
  `;

  console.log({ result });

  return Response.json(result);
}
