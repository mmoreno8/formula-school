import type { ReactNode } from "react";
import { IconCheck, IconKey, IconLightbulb } from "@/components/ui/icons";

export type Tone = "correct" | "hint" | "reveal" | "syntax";

const TONES: Record<Tone, { box: string; Icon: typeof IconCheck }> = {
  // Correct reuses mint on purpose: the same green that means "you are here"
  // also means "you got it". BRIEF.md section 9.
  correct: { box: "bg-mint text-green-2", Icon: IconCheck },
  hint: { box: "bg-hint-bg text-hint-fg", Icon: IconLightbulb },
  reveal: { box: "bg-reveal-bg text-reveal-fg", Icon: IconKey },
  syntax: { box: "bg-hint-bg text-hint-fg", Icon: IconLightbulb },
};

interface Props {
  tone: Tone;
  title: string;
  children?: ReactNode;
}

export function Feedback({ tone, title, children }: Props) {
  const { box, Icon } = TONES[tone];
  return (
    <div className={`mt-4 rounded-[9px] px-4 py-3 text-sm leading-relaxed ${box}`}>
      <p className="flex items-center gap-2 font-semibold">
        <Icon className="h-4 w-4 shrink-0" />
        {title}
      </p>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}
