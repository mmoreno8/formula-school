import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Formula School handles your learning progress.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink-3">Formula School</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">Privacy</h1>
      <p className="mt-3 text-ink-2">Last updated 6 September 2026</p>

      <div className="mt-9 space-y-7 text-[15px] leading-7 text-ink-2">
        <section>
          <h2 className="text-lg font-semibold text-ink">Learning without Google</h2>
          <p className="mt-2">
            Formula School works without an account. Your lesson progress is saved in your browser
            on your device and is not sent to Formula School.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">Optional Google progress saving</h2>
          <p className="mt-2">
            If you choose to save progress with Google, Formula School receives your Google account
            identifier, name, email address and profile picture. It stores those details with your
            completed exercises and lesson completion state so your progress can follow you across
            devices.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">What is not stored</h2>
          <p className="mt-2">
            Formula School does not store your exercise answers, SQL queries, formulas, attempts,
            scores or hint history. It does not sell personal information or use it for advertising.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">Stopping sync</h2>
          <p className="mt-2">
            You can choose Stop syncing in the sidebar at any time. Your device copy remains available
            so the lessons continue working without Google.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-ink">Contact</h2>
          <p className="mt-2">
            Privacy questions can be sent to manuelmorenoag@gmail.com.
          </p>
        </section>
      </div>
    </div>
  );
}
