import { NextRequest, NextResponse } from "next/server";
import {
  addClientToGroup,
  removeClientFromGroup,
  getClientGroups,
  findClientDbByNickname,
} from "@/lib/ts3/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cldbid = request.nextUrl.searchParams.get("cldbid");
  const search = request.nextUrl.searchParams.get("search");

  if (search) {
    try {
      const results = await findClientDbByNickname(search);
      return NextResponse.json({ results });
    } catch (err) {
      return NextResponse.json(
        { error: "Failed to search clients", details: String(err) },
        { status: 503 }
      );
    }
  }

  if (!cldbid) return NextResponse.json({ error: "cldbid or search required" }, { status: 400 });

  try {
    const groups = await getClientGroups(cldbid);
    return NextResponse.json({ groups });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch client groups", details: String(err) },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { sgid, cldbid } = await request.json();

  if (!sgid || !cldbid) {
    return NextResponse.json({ error: "sgid and cldbid required" }, { status: 400 });
  }

  try {
    const result = await addClientToGroup(sgid, cldbid);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to assign group", details: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { sgid, cldbid } = await request.json();

  if (!sgid || !cldbid) {
    return NextResponse.json({ error: "sgid and cldbid required" }, { status: 400 });
  }

  try {
    const result = await removeClientFromGroup(sgid, cldbid);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to remove from group", details: String(err) },
      { status: 500 }
    );
  }
}
