import { cache } from "react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { SharedIdeaCanvas } from "@/components/yan/ideas/shared-canvas";
import { ShareIdeasProvider } from "@/contexts/share-idea-provider";
import { db } from "@/db";
import { ideaSessions } from "@/db/schema";
import { APP_DOMAIN } from "@/lib/config";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const FALLBACK_TITLE = "Shared CanvasChat Canvas";
const FALLBACK_DESCRIPTION =
  "Explore publicly shared idea canvases powered by CanvasChat's AI canvas workspace.";

type SharedIdeaRecord = {
  id: string;
  title: string | null;
  description: string | null;
  type: string | null;
  collaborators: string | null;
  is_shared: boolean | null;
  updated_at: Date | null;
};

const getSharedIdea = cache(async (id: string): Promise<SharedIdeaRecord | null> => {
  const database = db();

  const [idea] = await database
    .select({
      id: ideaSessions.id,
      title: ideaSessions.title,
      description: ideaSessions.description,
      type: ideaSessions.type,
      collaborators: ideaSessions.collaborators,
      is_shared: ideaSessions.is_shared,
      updated_at: ideaSessions.updated_at,
    })
    .from(ideaSessions)
    .where(eq(ideaSessions.id, id))
    .limit(1);

  return idea ?? null;
});

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await searchParams;

  if (!id) {
    return buildUnavailableMetadata();
  }

  const idea = await getSharedIdea(id);

  if (!idea || !idea.is_shared) {
    return buildUnavailableMetadata();
  }

  const title = normalizeWhitespace(idea.title) || FALLBACK_TITLE;
  const description = buildIdeaDescription(idea.description);
  const canonicalPath = buildCanonicalPath(id);
  const absoluteUrl = buildAbsoluteUrl(canonicalPath);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl,
      type: "article",
      siteName: "CanvasChat",
      modifiedTime: idea.updated_at?.toISOString(),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  } satisfies Metadata;
}


export default async function SharedIdeaPage({
  searchParams,
}: {
  searchParams: Promise<{ id: string }>;
}) {
  const { id } = await searchParams;

  if (!id) {
    return <SharedIdeaFallback />;
  }

  const idea = await getSharedIdea(id);

  if (!idea || !idea.is_shared) {
    return (
      <SharedIdeaFallback />
    );
  }

  return (
    <ShareIdeasProvider>
      <SharedIdeaCanvas />
    </ShareIdeasProvider>
  );
}

function SharedIdeaFallback() {
  const gridOverlayStyle = {
    backgroundImage:
      "linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)",
    backgroundSize: "48px 48px",
  } as const;

  const panelClass =
    "border-4 border-black bg-red-700/95 px-8 py-10 text-slate-100 shadow-[6px_6px_0_rgba(15,23,42,0.9)] rounded-none";

  return (
    <div
      className="min-h-screen bg-white text-slate-900"
      style={gridOverlayStyle}
    >
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto space-y-10 text-center">
          <div className={`${panelClass} bg-red-700`}>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-200 md:text-2xl">
              The canvas you're looking for is private, archived, or has been removed by its creator.
            </p>
            <div
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center"
              style={{ imageRendering: "pixelated" }}
            >
              <Button
                size="lg"
                className="h-auto px-10 py-5 text-lg font-bold uppercase rounded-none border-4 border-black bg-primary text-white shadow-[4px_4px_0_rgba(2,6,23,0.9)] hover:bg-primary/80"
                asChild
              >
                <Link href="/yan/ideas">
                  Start your canvas <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function buildIdeaDescription(description: string | null): string {
  const normalized = normalizeWhitespace(description);

  if (normalized) {
    return truncate(normalized, 160);
  }

  return FALLBACK_DESCRIPTION;
}

function normalizeWhitespace(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function truncate(value: string, length: number): string {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length - 1).trimEnd()}…`;
}

function buildCanonicalPath(id: string): string {
  return `/share/idea?id=${encodeURIComponent(id)}`;
}

function buildAbsoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL?.trim();
  const origin = (() => {
    if (!baseUrl) {
      return APP_DOMAIN;
    }

    try {
      const normalized = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
      return new URL(normalized).origin;
    } catch (error) {
      console.warn("Invalid NEXT_PUBLIC_WEB_URL; falling back to APP_DOMAIN", error);
      return APP_DOMAIN;
    }
  })();

  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildUnavailableMetadata(): Metadata {
  return {
    title: "Canvas unavailable",
    description: "This shared canvas is private or has been removed.",
    robots: {
      index: false,
      follow: false,
    },
  } satisfies Metadata;
}
