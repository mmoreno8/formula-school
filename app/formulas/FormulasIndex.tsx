"use client";

import { LESSONS } from "@/content";
import { useProgress } from "@/lib/useProgress";
import { FormulaCard } from "@/components/layout/FormulaCard";
import { PageHeader } from "@/components/layout/PageHeader";

export function FormulasIndex() {
  const progress = useProgress();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Formulas" }]}
        title="Formulas"
        description="Ten formulas, three exercises each. Start anywhere. Nothing is locked, and you keep what you finish."
      />
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {LESSONS.map((lesson) => (
          <FormulaCard
            key={lesson.id}
            lesson={lesson}
            progress={progress}
          />
        ))}
      </div>
    </>
  );
}
