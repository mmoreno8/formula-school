import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "default" | "quiet";

const STYLES: Record<Variant, string> = {
  // The primary button is one of the four places green is allowed. BRIEF.md 9.
  primary:
    "bg-green text-on-green border border-green hover:opacity-90 disabled:opacity-50",
  default:
    "bg-card text-ink border border-line hover:bg-line-2 disabled:opacity-50",
  quiet:
    "bg-transparent text-ink-2 border border-transparent hover:bg-line-2 disabled:opacity-50",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "default", className = "", ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${STYLES[variant]} ${className}`}
    />
  );
}
