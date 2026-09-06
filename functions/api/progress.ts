import { readSession, sameOrigin } from "./_lib/auth";
import type { FunctionContext } from "./_lib/types";

const MAX_PROGRESS_BYTES = 64 * 1024;

interface StoredLessonProgress {
  done: string[];
  built: boolean;
  finished: boolean;
}

function cleanProgress(value: unknown): Record<string, StoredLessonProgress> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const clean: Record<string, StoredLessonProgress> = {};
  for (const [lessonId, raw] of Object.entries(value)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const item = raw as Record<string, unknown>;
    if (!Array.isArray(item.done) || item.done.some((id) => typeof id !== "string")) return null;
    clean[lessonId] = {
      done: [...new Set(item.done as string[])],
      built: item.built === true,
      finished: item.finished === true,
    };
  }
  return clean;
}

export async function onRequestGet({ request, env }: FunctionContext): Promise<Response> {
  const user = await readSession(request, env);
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const row = await env.DB.prepare("SELECT data FROM progress WHERE user_id = ?").bind(user.id).first<{ data: string }>();
  if (!row) return Response.json({ progress: {} });
  try {
    return Response.json({ progress: cleanProgress(JSON.parse(row.data)) ?? {} });
  } catch {
    return Response.json({ progress: {} });
  }
}

export async function onRequestPut({ request, env }: FunctionContext): Promise<Response> {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  const user = await readSession(request, env);
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_PROGRESS_BYTES) {
    return Response.json({ error: "Progress is too large" }, { status: 413 });
  }
  let body: { progress?: unknown };
  try { body = JSON.parse(text) as { progress?: unknown }; } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const progress = cleanProgress(body.progress);
  if (!progress) {
    return Response.json({ error: "Invalid progress" }, { status: 400 });
  }
  const data = JSON.stringify(progress);
  await env.DB.prepare(
    `INSERT INTO progress (user_id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, updated_at=CURRENT_TIMESTAMP`,
  ).bind(user.id, data).run();
  return Response.json({ ok: true });
}
