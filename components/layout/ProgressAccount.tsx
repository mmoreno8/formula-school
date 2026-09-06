"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  mergeProgress,
  PROGRESS_EVENT,
  readProgress,
  type ProgressMap,
  writeProgress,
} from "@/lib/progress";

interface User {
  name: string;
  email: string;
  picture?: string;
}

interface GoogleAccounts {
  id: {
    initialize(options: { client_id: string; callback: (result: { credential: string }) => void }): void;
    renderButton(element: HTMLElement, options: Record<string, string>): void;
  };
}

declare global {
  interface Window { google?: { accounts: GoogleAccounts } }
}

async function save(progress: ProgressMap): Promise<void> {
  const response = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ progress }),
  });
  if (!response.ok) throw new Error("Progress sync failed");
}

export function ProgressAccount() {
  const button = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [note, setNote] = useState("Your progress is saved on this device.");

  const mergeCloud = useCallback(async () => {
    const response = await fetch("/api/progress");
    if (!response.ok) return;
    const body = (await response.json()) as { progress?: ProgressMap };
    const merged = mergeProgress(readProgress(), body.progress ?? {});
    writeProgress(merged);
    try {
      await save(merged);
      setNote("Progress saved across your devices.");
    } catch {
      setNote("Your progress is safe on this device. Cloud sync will retry after your next answer.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([fetch("/api/auth/config"), fetch("/api/auth/me")]).then(
      async ([configResponse, meResponse]) => {
        if (cancelled || !configResponse.ok) return;
        const config = (await configResponse.json()) as { enabled: boolean; clientId: string | null };
        setEnabled(config.enabled);
        if (meResponse.ok) {
          const me = (await meResponse.json()) as { user: User };
          setUser(me.user);
          await mergeCloud();
          return;
        }
        if (!config.enabled || !config.clientId) return;
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.onload = () => {
          if (!button.current || !window.google) return;
          window.google.accounts.id.initialize({
            client_id: config.clientId!,
            callback: async ({ credential }) => {
              const response = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential }),
              });
              if (!response.ok) { setNote("Google could not save your progress. Try again."); return; }
              const body = (await response.json()) as { user: User };
              setUser(body.user);
              await mergeCloud();
            },
          });
          window.google.accounts.id.renderButton(button.current, {
            type: "standard", theme: "outline", size: "medium", text: "continue_with",
          });
        };
        document.head.appendChild(script);
      },
    );
    return () => { cancelled = true; };
  }, [mergeCloud]);

  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sync = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void save(readProgress())
          .then(() => setNote("Progress saved across your devices."))
          .catch(() => setNote("Saved on this device. Cloud sync will retry after your next answer."));
      }, 500);
    };
    window.addEventListener(PROGRESS_EVENT, sync);
    return () => { clearTimeout(timer); window.removeEventListener(PROGRESS_EVENT, sync); };
  }, [user]);

  if (user) {
    return (
      <div className="mx-2 mt-3 rounded-[9px] border border-line bg-raise px-3 py-2.5 text-[12.5px] text-ink-3">
        <p className="font-medium text-ink">{user.name}</p>
        <p>{note}</p>
        <button
          type="button"
          className="mt-2 underline underline-offset-2"
          onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); setUser(null); location.reload(); }}
        >
          Stop syncing
        </button>
      </div>
    );
  }

  return (
    <div className="mx-2 mt-3 rounded-[9px] border border-line bg-raise px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-3">
      <p>{note}</p>
      {enabled ? (
        <>
          <p className="mt-1 mb-2">Use Google only if you want to keep it across devices.</p>
          <div ref={button} aria-label="Save my progress with Google" />
        </>
      ) : (
        <p className="mt-1">Google saving is being configured.</p>
      )}
    </div>
  );
}
