import { NextRequest, NextResponse } from "next/server";

// ══════════════════════════════════════════════════════════════════
//  History API Route — Proxies history requests to the backend
// ══════════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mobile = searchParams.get("mobile");

    if (!mobile) {
      return NextResponse.json(
        { error: "mobile parameter is required" },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

    const backendRes = await fetch(
      `${backendUrl}/api/history?mobile=${encodeURIComponent(mobile)}`,
      {
        method: "GET",
      }
    );

    if (!backendRes.ok) {
      throw new Error(`Backend returned HTTP ${backendRes.status}`);
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/history] Error:", message);
    return NextResponse.json(
      { error: "Failed to retrieve conversation history", details: message },
      { status: 500 }
    );
  }
}
