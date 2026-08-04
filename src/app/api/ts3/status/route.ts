import { NextResponse } from "next/server";
import { getServerStatus, getConnectedClients, getChannels } from "@/lib/ts3/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [status, clients, channels] = await Promise.all([
      getServerStatus(),
      getConnectedClients(),
      getChannels(),
    ]);

    const clientsWithChannels = clients.map((c) => {
      const ch = channels.find((ch) => ch.cid === c.channelId);
      return { ...c, channelName: ch?.name ?? "Unknown" };
    });

    return NextResponse.json({
      server: status,
      clients: clientsWithChannels,
      channels,
      timestamp: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to connect to TS3", details: String(err) },
      { status: 503 }
    );
  }
}
