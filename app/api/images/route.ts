import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

// POST /api/images
// Upload an image
export async function POST(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  if (!filename || !request.body) {
    return new Response("Missing filename or body", {
      status: 400,
    });
  }

  const blob = await put(filename, request.body, {
    access: "public",
  });

  return NextResponse.json(blob);
}
