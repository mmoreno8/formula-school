import Link from "next/link";
import { IconChevron } from "@/components/ui/icons";

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
}

export function PageHeader({ crumbs, title, description, titleMono }: Props) {
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
      <h1
        className={`text-[31px] leading-tight font-semibold tracking-tight ${
          titleMono ? "font-mono" : ""
        }`}
      >
        {title}
      </h1>
      <p className="mt-2 max-w-[66ch] text-[15px] text-ink-2">{description}</p>
    </header>
  );
}
