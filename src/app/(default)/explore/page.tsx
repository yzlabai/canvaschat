import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, CalendarClock, Sparkles, Users } from "lucide-react";
import { and, desc, eq, notInArray } from "drizzle-orm";

import { db } from "@/db";
import { ideaSessions } from "@/db/schema";
import { buildStaticMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = buildStaticMetadata("/explore");

const HIDDEN_STATUSES = ["archived", "deleted"] as const;
const MAX_IDEAS = 24;

type SharedIdeaRow = {
  id: string;
  title: string | null;
  description: string | null;
  type: string | null;
  tags: string | null;
  collaborators: string | null;
  totalIdeaNodes: number | null;
  updatedAt: Date | null;
  startedAt: Date | null;
};

type ExploreIdea = {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  tags: string[];
  collaboratorCount: number;
  totalIdeaNodes: number;
  updatedAt: Date | null;
};

async function loadSharedIdeas(): Promise<ExploreIdea[]> {
  const database = db();

  const rows = await database
    .select({
      id: ideaSessions.id,
      title: ideaSessions.title,
      description: ideaSessions.description,
      type: ideaSessions.type,
      tags: ideaSessions.tags,
      collaborators: ideaSessions.collaborators,
      totalIdeaNodes: ideaSessions.total_idea_nodes,
      updatedAt: ideaSessions.updated_at,
      startedAt: ideaSessions.started_at,
    })
    .from(ideaSessions)
    .where(
      and(
        eq(ideaSessions.is_shared, true),
        notInArray(ideaSessions.status, [...HIDDEN_STATUSES])
      )
    )
    .orderBy(desc(ideaSessions.updated_at), desc(ideaSessions.started_at))
    .limit(MAX_IDEAS);

  return rows.map(mapSharedIdeaRow);
}

function mapSharedIdeaRow(row: SharedIdeaRow): ExploreIdea {
  const tags = parseStringArray(row.tags);
  const collaborators = parseStringArray(row.collaborators);

  return {
    id: row.id,
    title: row.title?.trim() || "Untitled Canvas",
    description: normalizeText(row.description),
    type: row.type?.trim() || null,
    tags,
    collaboratorCount: collaborators.length,
    totalIdeaNodes: row.totalIdeaNodes ?? 0,
    updatedAt: row.updatedAt ?? row.startedAt ?? null,
  } satisfies ExploreIdea;
}

function parseStringArray(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (typeof item === "string") {
            return item.trim();
          }

          if (item && typeof item === "object" && "value" in item) {
            const val = (item as { value?: unknown }).value;
            return typeof val === "string" ? val.trim() : "";
          }

          return "";
        })
        .filter(Boolean);
    }

    if (typeof parsed === "string") {
      return parsed
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    }
  } catch (error) {
    console.warn("Unable to parse string array", error);
  }

  return [];
}

function normalizeText(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function formatUpdatedAt(value: Date | null): string | null {
  if (!value) return null;

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(value);
  } catch (error) {
    console.warn("Unable to format date", error);
    return value.toISOString();
  }
}

const typeStyles: Record<string, string> = {
  brainstorm: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  story: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  chat: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
};

export default async function ExplorePage() {
  const ideas = await loadSharedIdeas();

  return (
    <div
      className="min-h-screen bg-white text-slate-900"
      style={{
        backgroundImage:
          "linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      <section className="container mx-auto px-4 py-16 md:py-24">
        <header className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border-4 border-black bg-slate-900 px-4 py-1 text-xs font-black uppercase tracking-[0.24em] text-slate-100 shadow-[4px_4px_0_rgba(15,23,42,0.9)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Explore Gallery
          </p>
          <h1 className="mt-6 text-4xl font-black uppercase tracking-[0.14em] text-slate-900 md:text-5xl">
            Discover Public Idea Canvases
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
            Pick a canvas card to open its live public workspace.
          </p>
        </header>

        {ideas.length === 0 ? (
          <div className="mx-auto mt-16 max-w-xl rounded-3xl border-4 border-black bg-white/90 p-10 text-center shadow-[8px_8px_0_rgba(15,23,42,0.9)]">
            <p className="text-lg font-semibold text-slate-700">
              No shared canvases yet.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Toggle sharing on your idea canvas to publish it here.
            </p>
          </div>
        ) : (
          <div className="mt-16 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {ideas.map((idea) => {
              const updatedLabel = formatUpdatedAt(idea.updatedAt);
              const badgeClass = idea.type
                ? typeStyles[idea.type] ?? "bg-slate-500/10 text-slate-700 border-slate-500/20"
                : "bg-slate-500/10 text-slate-700 border-slate-500/20";

              return (
                <Link
                  key={idea.id}
                  href={`/share/idea?id=${idea.id}`}
                  prefetch={false}
                  className="group block h-full rounded-3xl border-4 border-black bg-white/85 p-6 shadow-[6px_6px_0_rgba(15,23,42,0.9)] transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary"
                >
                  <div className="flex h-full flex-col gap-5">
                    <div className="space-y-3">
                      <p className="text-xs font-mono uppercase tracking-[0.24em] text-slate-500">
                        {idea.type ?? "Canvas"}
                      </p>
                      <h2 className="text-xl font-black uppercase tracking-[0.12em] text-slate-900">
                        {idea.title}
                      </h2>
                      {idea.description ? (
                        <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                          {idea.description}
                        </p>
                      ) : (
                        <p className="text-sm italic text-slate-400">No description provided.</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {idea.type ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
                            badgeClass
                          )}
                        >
                          {idea.type}
                        </span>
                      ) : null}
                      {idea.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full border-2 border-black bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      <span>
                        {idea.totalIdeaNodes.toString().padStart(2, "0")} nodes
                      </span>
                      {idea.collaboratorCount > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-4 w-4" aria-hidden /> {idea.collaboratorCount}
                        </span>
                      ) : null}
                      {updatedLabel ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-4 w-4" aria-hidden /> {updatedLabel}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-end gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                      View canvas
                      <ArrowUpRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                        aria-hidden
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
