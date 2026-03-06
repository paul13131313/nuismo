import { NextRequest, NextResponse } from "next/server";
import Ably from "ably";

export async function GET(req: NextRequest) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ABLY_API_KEY not set" }, { status: 500 });
  }

  const clientId = req.nextUrl.searchParams.get("clientId") || "anonymous";
  const client = new Ably.Rest(apiKey);
  const tokenRequest = await client.auth.createTokenRequest({
    clientId,
    capability: { "nuismo-room": ["publish", "subscribe", "presence"] },
  });

  return NextResponse.json(tokenRequest);
}
