import { NextRequest, NextResponse } from "next/server";
import { getServerGroups, createServerGroup, deleteServerGroup } from "@/lib/ts3/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const groups = await getServerGroups();
    return NextResponse.json({ groups });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch groups", details: String(err) },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  try {
    const result = await createServerGroup(name.trim());
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create group", details: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { sgid } = await request.json();

  if (!sgid) {
    return NextResponse.json({ error: "sgid required" }, { status: 400 });
  }

  try {
    const result = await deleteServerGroup(sgid);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete group", details: String(err) },
      { status: 500 }
    );
  }
}
