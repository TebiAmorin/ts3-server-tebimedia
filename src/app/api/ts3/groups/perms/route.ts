import { NextRequest, NextResponse } from "next/server";
import {
  getGroupPermissions,
  addGroupPermission,
  removeGroupPermission,
} from "@/lib/ts3/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sgid = request.nextUrl.searchParams.get("sgid");
  if (!sgid) return NextResponse.json({ error: "sgid required" }, { status: 400 });

  try {
    const permissions = await getGroupPermissions(sgid);
    return NextResponse.json({ permissions });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch permissions", details: String(err) },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { sgid, permname, permvalue, permnegated, permskip } = await request.json();

  if (!sgid || !permname || permvalue === undefined) {
    return NextResponse.json(
      { error: "sgid, permname, and permvalue required" },
      { status: 400 }
    );
  }

  try {
    const result = await addGroupPermission(
      sgid,
      permname,
      Number(permvalue),
      Boolean(permnegated),
      Boolean(permskip)
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to add permission", details: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { sgid, permname } = await request.json();

  if (!sgid || !permname) {
    return NextResponse.json({ error: "sgid and permname required" }, { status: 400 });
  }

  try {
    const result = await removeGroupPermission(sgid, permname);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to remove permission", details: String(err) },
      { status: 500 }
    );
  }
}
