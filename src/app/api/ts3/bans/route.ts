import { NextResponse } from "next/server";
import { getBanList } from "@/lib/ts3/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const bans = await getBanList();
    return NextResponse.json({ bans });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch bans", details: String(err) },
      { status: 503 }
    );
  }
}
