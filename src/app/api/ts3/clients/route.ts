import { NextResponse } from "next/server";
import { getConnectedClients } from "@/lib/ts3/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const clients = await getConnectedClients();
    return NextResponse.json({ clients });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch clients", details: String(err) },
      { status: 503 }
    );
  }
}
