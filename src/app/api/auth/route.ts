import { NextRequest, NextResponse } from "next/server";
import {
  validateCredentials,
  createToken,
  verifyToken,
  TOKEN_COOKIE,
  TOKEN_MAX_AGE,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  if (!validateCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createToken();
  const response = NextResponse.json({ success: true });

  response.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TOKEN_MAX_AGE,
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(TOKEN_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false });
  }
  const valid = await verifyToken(token);
  return NextResponse.json({ authenticated: valid });
}
