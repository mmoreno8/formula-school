import { readSession } from "../_lib/auth";
import type { FunctionContext } from "../_lib/types";

export async function onRequestGet({ request, env }: FunctionContext): Promise<Response> {
  const user = await readSession(request, env);
  return user ? Response.json({ user }) : Response.json({ user: null }, { status: 401 });
}
