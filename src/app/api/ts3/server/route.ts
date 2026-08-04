import { NextRequest, NextResponse } from "next/server";
import { serverStop, serverStart } from "@/lib/ts3/queries";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  try {
    let result;

    switch (action) {
      case "stop":
        result = await serverStop();
        break;
      case "start":
        result = await serverStart();
        break;
      case "restart":
        await serverStop();
        await new Promise((r) => setTimeout(r, 2000));
        result = await serverStart();
        break;
      default:
        return NextResponse.json({ error: "Unknown action (stop|start|restart)" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Server action failed", details: String(err) },
      { status: 500 }
    );
  }
}
