import { NextRequest, NextResponse } from "next/server";
import { getServerLogs } from "@/lib/ts3/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const lines = parseInt(
    request.nextUrl.searchParams.get("lines") || "100"
  );

  try {
    const logs = await getServerLogs(lines);
    return NextResponse.json({ logs });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch logs", details: String(err) },
      { status: 503 }
    );
  }
}
