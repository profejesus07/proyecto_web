import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ChapterReader } from "@/components/chapter-reader";
import { BackLink } from "@/components/ui";
import { CHAPTERS, chapterById } from "@/content/cronicas";
import { requirePlayer } from "@/lib/auth";
import { loadChronicles } from "@/lib/data/chronicles";

export async function generateMetadata({ params }: PageProps<"/cronicas/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: chapterById(id)?.title ?? "Crónica" };
}

export default async function ChapterPage({ params }: PageProps<"/cronicas/[id]">) {
  const { id } = await params;
  const viewer = await requirePlayer(`/cronicas/${id}`);
  const chapter = chapterById(id);
  if (!chapter) notFound();
  const shelves = await loadChronicles(viewer);
  const all = shelves.flatMap((s) => s.chapters);
  const me = all.find((c) => c.chapter.id === id);
  // Un capítulo sellado no se puede leer escribiendo su dirección.
  if (!me?.unlocked) redirect("/cronicas");

  const order = CHAPTERS.map((c) => c.id);
  const next = all
    .filter((c) => c.unlocked && order.indexOf(c.chapter.id) > order.indexOf(id))
    .sort((a, b) => order.indexOf(a.chapter.id) - order.indexOf(b.chapter.id))[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackLink href="/cronicas">Archivo de Crónicas</BackLink>
      <ChapterReader
        id={chapter.id}
        title={chapter.title}
        scene={chapter.scene}
        guest={chapter.guest ?? null}
        pages={chapter.pages}
        next={next ? { id: next.chapter.id, title: next.chapter.title } : null}
        alreadyRead={me.read}
      />
    </div>
  );
}
