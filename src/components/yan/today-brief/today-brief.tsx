"use client";

import {
  Calendar as CalendarIcon,
  RefreshCw,
  Sparkles,
  Quote,
  MessageSquare,
  Lamp,
  FlaskConical,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";

interface TodayBriefProps {
  onPromptSelect?: (prompt: string) => void;
}

interface DailyBriefNewsItem {
  title: string;
  summary: string;
  source?: string;
  url?: string;
}

interface DailyBriefPayload {
  summary: string;
  highlights: string[];
  actionItems: string[];
  news: DailyBriefNewsItem[];
  promptSuggestions: string[];
  toneNote?: string;
}

interface DailyBriefResponse {
  brief: DailyBriefPayload;
  metadata?: {
    generatedAt: string;
    timezone: string;
    hasConversations: boolean;
    hasNews: boolean;
  };
}

export function TodayBrief({ onPromptSelect }: TodayBriefProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState("");
  const [brief, setBrief] = useState<DailyBriefPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch (err) {
      console.warn("Failed to resolve timezone", err);
      return "UTC";
    }
  }, []);

  // Format today's date
  useEffect(() => {
    const today = new Date();
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const formatted = selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setCurrentDate(formatted);
  }, [selectedDate]);

  const fetchBrief = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/yan/daily-brief?timezone=${encodeURIComponent(timezone)}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load today's brief");
      }

      const data = (await response.json()) as DailyBriefResponse;
      setBrief(data.brief);
    } catch (err) {
      console.error("Failed to fetch daily brief", err);
      setError(
        err instanceof Error ? err.message : "Something went wrong loading the brief"
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timezone]);

  useEffect(() => {
    fetchBrief();
  }, [fetchBrief]);

  const handleRefresh = () => {
    if (isLoading) return;
    setIsRefreshing(true);
    fetchBrief();
  };

  const summaryText = brief?.summary ||
    "Let's set the tone for a productive day. Focus on momentum and keep your top priorities in view.";
  const primaryTopic = useMemo(
    () => brief?.promptSuggestions?.[0] ?? "",
    [brief?.promptSuggestions]
  );

  const handleChatStart = () => {
    if (!primaryTopic) return;
    onPromptSelect?.(primaryTopic);
  };

  const handleIdeaNavigation = () => {
    router.push("/yan/ideas");
  };

  const handleResearchNavigation = () => {
    router.push("/yan/research");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 mb-5">
      {/* Date and Daily Insight */}
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 rounded-sm border border-transparent px-3 py-1 text-muted-foreground transition hover:border-primary/40"
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{currentDate}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="center">
              <Calendar
                mode="single"
                className="bg-popover size-full"
                selected={selectedDate ?? undefined}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setIsCalendarOpen(false);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <h1 className="mb-6 text-3xl font-medium tracking-tight">
          Good {getTimeOfDay()}!
        </h1>

        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "relative w-full overflow-hidden rounded-sm border border-accent/40 bg-gradient-to-br",
              "from-accent/10 via-background to-background p-4 shadow-[4px_4px_0px_theme(colors.accent.DEFAULT)]",
              "transition-transform duration-200",
              isLoading && "animate-pulse"
            )}
          >
            <div className="flex items-start gap-3 text-left">
              <p className="text leading-relaxed text-muted-foreground">
                {isLoading ? "Crafting your daily insight…" : summaryText}
              </p>
            </div>

            {brief?.toneNote && !isLoading ? (
              <div className="mt-3 flex items-start gap-2 rounded border border-primary/30 bg-primary/5 p-3 text-left">
                <Quote className="h-4 w-4 flex-shrink-0 text-primary" />
                <p className="text-muted-foreground">
                  {brief.toneNote}
                </p>
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ActionCard
          icon={<MessageSquare className="h-5 w-5" />}
          title={primaryTopic ? "Start a focused chat" : "Start a new chat"}
          description={
            primaryTopic
              ? `Dive into "${primaryTopic}" guided by Yan.`
              : "Spark a conversation with Yan about today's priorities."
          }
          actionLabel={primaryTopic ? "Chat about this" : "Open chat"}
          onClick={handleChatStart}
          disabled={!primaryTopic}
          loading={isLoading}
        />

        <ActionCard
          icon={<Lamp className="h-5 w-5" />}
          title="Explore ideas"
          description="Open your idea canvas to create something new or revisit an existing concept."
          actionLabel="Go to ideas"
          onClick={handleIdeaNavigation}
          loading={isLoading}
        />

        <ActionCard
          icon={<FlaskConical className="h-5 w-5" />}
          title="Check long-term research"
          description="Review ongoing research streams and schedule your next deep dive."
          actionLabel="Open research"
          onClick={handleResearchNavigation}
          loading={isLoading}
        />
      </div>

    </div>
  );
}

interface ActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

function ActionCard({
  icon,
  title,
  description,
  actionLabel,
  onClick,
  disabled,
  loading,
}: ActionCardProps) {
  return (
    <section className="flex h-full flex-col justify-between rounded-sm border border-accent/40 bg-background p-4 text-left shadow-[3px_3px_0_theme(colors.accent.DEFAULT)]">
      <div className="space-y-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-accent/60 bg-accent/10 text-accent">
          {icon}
        </span>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button
        type="button"
        onClick={onClick}
        className="mt-4 h-9 rounded-sm border border-accent/40 bg-accent text-xs font-semibold uppercase tracking-wide text-accent-foreground shadow-[2px_2px_0_theme(colors.accent.DEFAULT)] transition hover:translate-y-0.5"
        disabled={disabled || loading}
      >
        {actionLabel}
      </Button>
    </section>
  );
}

// Helper function to determine time of day
function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
