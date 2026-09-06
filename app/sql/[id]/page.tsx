import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SQL_LESSONS, getSqlLesson } from "@/content";
import { SqlLessonView } from "@/components/sql/SqlLessonView";
import { PageHeader } from "@/components/layout/PageHeader";

export function generateStaticParams() {
  return SQL_LESSONS.map((lesson) => ({ id: lesson.id }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/sql/[id]">): Promise<Metadata> {
  const { id } = await params;
  const lesson = getSqlLesson(id);
  if (!lesson) return { title: "Not found" };
  return { title: lesson.name, description: lesson.blurb };
}

export default async function SqlLessonPage({ params }: PageProps<"/sql/[id]">) {
  const { id } = await params;
  const lesson = getSqlLesson(id);
  if (!lesson) notFound();

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: "SQL", href: "/sql" },
          { label: lesson.name },
        ]}
        title={lesson.name}
        titleMono
        focusToggle
        description={lesson.blurb}
      />
      <SqlLessonView lesson={lesson} />
    </>
  );
}
