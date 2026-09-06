import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import type { AuthEnv } from "./types";

const GOOGLE_KEYS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);
const COOKIE = "formula_school_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

function key(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin === null || origin === new URL(request.url).origin;
}

export function clearSessionCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function sessionCookie(user: SessionUser, secret: string): Promise<string> {
  const token = await new SignJWT({ email: user.email, name: user.name, picture: user.picture })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key(secret));
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${THIRTY_DAYS}`;
}

export async function readSession(request: Request, env: AuthEnv): Promise<SessionUser | null> {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.split(/;\s*/).find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(env.SESSION_SECRET), {
      algorithms: ["HS256"],
    });
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.name !== "string") return null;
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: typeof payload.picture === "string" ? payload.picture : undefined,
    };
  } catch {
    return null;
  }
}

export async function verifyGoogleCredential(credential: string, clientId: string): Promise<SessionUser> {
  const { payload } = await jwtVerify(credential, GOOGLE_KEYS, {
    audience: clientId,
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    algorithms: ["RS256"],
  });
  if (!payload.sub || typeof payload.email !== "string" || typeof payload.name !== "string" || payload.email_verified !== true) {
    throw new Error("Google identity is incomplete");
  }
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}
