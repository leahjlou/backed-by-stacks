export async function GET() {
  return Response.json({});
}

// Handle contribution made to campaign
// If the given principal has made a previous contribution, the total is summed in the db
// POST /api/contributions