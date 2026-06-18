import { NextRequest, NextResponse } from "next/server";
import { ChatRequest, ChatResponse } from "@/types";

// ══════════════════════════════════════════════════════════════════
//  Chat API Route — Proxies requests to the backend agent
// ══════════════════════════════════════════════════════════════════
//
//  This route forwards messages from the chat UI to the backend
//  Express server (running on port 3001 by default).
//
//  You can extend this to:
//  - Add request validation
//  - Add rate limiting
//  - Implement streaming responses (see Next.js streaming docs)
// ══════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();

    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "message (string) is required" },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

    const backendRes = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!backendRes.ok) {
      throw new Error(`Backend returned HTTP ${backendRes.status}`);
    }

    const data: ChatResponse = await backendRes.json();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/chat] Error:", message);
    return NextResponse.json(
      { error: "Failed to reach backend agent", details: message },
      { status: 500 }
    );
  }
}
