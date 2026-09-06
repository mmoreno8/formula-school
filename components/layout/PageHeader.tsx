import Link from "next/link";
import { IconChevron } from "@/components/ui/icons";
import { FocusToggle } from "@/components/layout/FocusToggle";

export interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  crumbs: Crumb[];
  title: string;
  /** The one line under the H1. Every page has one. BRIEF.md section 7. */
  description: string;
  titleMono?: boolean;
  /**
   * Offers the focus-mode toggle. Lesson pages only: they are the pages with
   * a rail to hide and a compact step strip to replace it with. Elsewhere the
   * button would hide the sidebar and put nothing in its place, which is a
   * control that only takes something away.
   */
  focusToggle?: boolean;
}

export function PageHeader({
  crumbs,
  title,
  description,
  titleMono,
  focusToggle,
}: Props) {
  return (
    <header className="mb-6">
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-3">
          {crumbs.map((c, i) => (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <IconChevron className="h-3 w-3" />}
              {c.href ? (
                <Link href={c.href} className="rounded hover:text-ink-2">
                  {c.label}
                </Link>
              ) : (
                <span aria-current="page">{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex items-start justify-between gap-4">
        <h1
          className={`text-[31px] leading-tight font-semibold tracking-tight ${
            titleMono ? "font-mono" : ""
          }`}
        >
          {title}
        </h1>
        {focusToggle && <FocusToggle />}
      </div>
      <p className="mt-2 max-w-[66ch] text-[15px] text-ink-2">{description}</p>
    </header>
  );
}
