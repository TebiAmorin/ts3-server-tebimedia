import { NextRequest, NextResponse } from "next/server";
import {
  kickClient,
  banClient,
  unban,
  moveClient,
  sendGlobalMessage,
} from "@/lib/ts3/queries";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, clid, reason, duration, channelId, banId, message } = body;

  try {
    let result;

    switch (action) {
      case "kick":
        if (!clid) return NextResponse.json({ error: "clid required" }, { status: 400 });
        result = await kickClient(clid, reason || "Kicked by admin");
        break;

      case "ban":
        if (!clid) return NextResponse.json({ error: "clid required" }, { status: 400 });
        result = await banClient(clid, reason || "Banned by admin", duration || 0);
        break;

      case "unban":
        if (!banId) return NextResponse.json({ error: "banId required" }, { status: 400 });
        result = await unban(banId);
        break;

      case "move":
        if (!clid || !channelId)
          return NextResponse.json({ error: "clid and channelId required" }, { status: 400 });
        result = await moveClient(clid, channelId);
        break;

      case "message":
        if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });
        result = await sendGlobalMessage(message);
        break;

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Action failed", details: String(err) },
      { status: 500 }
    );
  }
}
