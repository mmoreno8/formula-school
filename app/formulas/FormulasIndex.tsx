"use client";

import { EXCEL_LESSONS } from "@/content";
import { useProgress } from "@/lib/useProgress";
import { LessonCard } from "@/components/layout/LessonCard";
import { PageHeader } from "@/components/layout/PageHeader";

export function FormulasIndex() {
  const progress = useProgress();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Formulas" }]}
        title="Formulas"
        description={`${EXCEL_LESSONS.length} practical Excel lessons, three exercises each. Start anywhere. Nothing is locked, and you keep what you finish.`}
      />
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {EXCEL_LESSONS.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            progress={progress}
          />
        ))}
      </div>
    </>
  );
}
