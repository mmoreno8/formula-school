import type { FunctionContext } from "../_lib/types";

export function onRequestGet({ env }: FunctionContext): Response {
  return Response.json({ enabled: Boolean(env.GOOGLE_CLIENT_ID), clientId: env.GOOGLE_CLIENT_ID || null });
}
