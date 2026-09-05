import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EXCEL_LESSONS, getExcelLesson } from "@/content";
import { LessonView } from "@/components/engine/LessonView";
import { PageHeader } from "@/components/layout/PageHeader";

export function generateStaticParams() {
  return EXCEL_LESSONS.map((lesson) => ({ id: lesson.id }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/formulas/[id]">): Promise<Metadata> {
  const { id } = await params;
  const lesson = getExcelLesson(id);
  if (!lesson) return { title: "Not found" };
  return { title: lesson.name, description: lesson.blurb };
}

export default async function LessonPage({ params }: PageProps<"/formulas/[id]">) {
  const { id } = await params;
  const lesson = getExcelLesson(id);
  if (!lesson) notFound();

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Formulas", href: "/formulas" },
          { label: lesson.name },
        ]}
        title={lesson.name}
        titleMono
        description={lesson.blurb}
      />
      <LessonView lesson={lesson} />
    </>
  );
}
