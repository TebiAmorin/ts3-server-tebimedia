import { SignJWT, jwtVerify } from "jose";

const TOKEN_COOKIE = "ts3-auth";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET env var not set");
  return new TextEncoder().encode(secret);
}

export async function createToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export function validateCredentials(user: string, pass: string): boolean {
  return (
    user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASSWORD
  );
}

export { TOKEN_COOKIE, TOKEN_MAX_AGE };
