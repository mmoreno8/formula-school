import { clearSessionCookie, sameOrigin } from "../_lib/auth";
import type { FunctionContext } from "../_lib/types";

export function onRequestPost({ request }: FunctionContext): Response {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  return Response.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
}
