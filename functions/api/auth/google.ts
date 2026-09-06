import { sameOrigin, sessionCookie, verifyGoogleCredential } from "../_lib/auth";
import type { FunctionContext } from "../_lib/types";

export async function onRequestPost({ request, env }: FunctionContext): Promise<Response> {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const body = (await request.json()) as { credential?: unknown };
    if (typeof body.credential !== "string") return Response.json({ error: "Missing credential" }, { status: 400 });
    const user = await verifyGoogleCredential(body.credential, env.GOOGLE_CLIENT_ID);
    await env.DB.prepare(
      `INSERT INTO users (id, email, name, picture, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET email=excluded.email, name=excluded.name,
       picture=excluded.picture, updated_at=CURRENT_TIMESTAMP`,
    ).bind(user.id, user.email, user.name, user.picture ?? null).run();
    return Response.json({ user }, { headers: { "Set-Cookie": await sessionCookie(user, env.SESSION_SECRET) } });
  } catch {
    return Response.json({ error: "Google sign-in could not be verified" }, { status: 401 });
  }
}
