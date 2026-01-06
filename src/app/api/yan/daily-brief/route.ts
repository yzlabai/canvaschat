import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { yanConversations, researchData, dailyBriefCache } from "@/db/schema";
import { MessageService } from "@/lib/chat-store/messages/api-server";
import { gateway } from "@ai-sdk/gateway";
import { resolveModelForSlot } from "@/services/ai-models";
import { generateText } from "ai";
import { and, desc, eq, inArray } from "drizzle-orm";

interface DailyBriefPayload {
  summary: string;
  promptSuggestions: string[];
  focusTopic?: string;
  toneNote?: string;
}

type ConversationSnippet = {
  title: string;
  lines: string[];
};

type NewsRecord = {
  title: string | null;
  content: string | null;
  insights: string | null;
  sources: string | null;
  collectedAt: Date | null;
  dataType: string;
};

const MAX_CONVERSATIONS = 3;
const MAX_MESSAGES_PER_CONVERSATION = 8;
const MAX_NEWS_ITEMS = 5;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

function truncateText(text: string, maxLength = 220): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
}

function safeJsonParse<T>(value: string | null): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("Failed to parse JSON value", error);
    return undefined;
  }
}

function formatSource(sources?: unknown): string | undefined {
  if (!sources) return undefined;
  if (Array.isArray(sources) && sources.length > 0) {
    const first = sources[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "url" in first) {
      const url = (first as Record<string, unknown>).url;
      return typeof url === "string" ? url : undefined;
    }
  }
  if (typeof sources === "string") return sources;
  return undefined;
}

function createPrompt({
  datetime,
  timezone,
  conversations,
  recentQuestions,
  newsItems,
}: {
  datetime: string;
  timezone: string;
  conversations: ConversationSnippet[];
  recentQuestions: string[];
  newsItems: Array<{
    title: string;
    summary: string;
    source?: string;
    collectedAt?: string;
  }>;
}): string {
  const conversationBlock = conversations.length
    ? conversations
        .map(
          (conv) =>
            `Conversation: ${conv.title}\n${conv.lines.map((line) => `- ${line}`).join("\n")}`
        )
        .join("\n\n")
    : "No recent conversation history available.";

  const questionsBlock = recentQuestions.length
    ? recentQuestions.map((item) => `- ${item}`).join("\n")
    : "No recent user questions recorded.";

  const newsBlock = newsItems.length
    ? newsItems
        .map((item) => {
          const meta = [
            item.collectedAt ? `Collected: ${item.collectedAt}` : undefined,
            item.source ? `Source: ${item.source}` : undefined,
          ]
            .filter(Boolean)
            .join(" | ");
          return `${item.title}\n${meta ? `${meta}\n` : ""}${item.summary}`;
        })
        .join("\n\n")
    : "No personalised news items found. Suggest relevant headlines based on today's date.";

  return `You are the CanvasChat daily briefing assistant. Using the provided context, craft a concise morning brief for the user.

Current DateTime: ${datetime}
User Timezone: ${timezone}

Recent Conversation Highlights:
${conversationBlock}

Recent User Questions:
${questionsBlock}

Latest News & Research Items:
${newsBlock}

Instructions:
1. Produce a JSON object with the following structure exactly:
{
  "summary": "<2-3 sentence overview>",
  "focusTopic": "Specific topic the user should chat about next",
  "promptSuggestions": [
    "Example follow-up prompt for the assistant"
  ],
  "toneNote": "Optional reminder about tone or mindset for the day"
}
2. Tailor the summary to the user's recent conversations and questions.
3. Emphasise timely or actionable context (news or conversations) in the summary when available.
4. The "focusTopic" should reflect a concrete, helpful conversation starter derived from the user's context.
5. Provide up to three concise "promptSuggestions" that expand on the focus topic or the day's priorities.
6. Respond with valid JSON only, without markdown fences or additional commentary.`;
}

function normalizeBrief(input: unknown): DailyBriefPayload | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const raw = input as Record<string, unknown>;

  const summary = typeof raw.summary === "string" ? raw.summary.trim() : "";

  const promptSuggestions = Array.isArray(raw.promptSuggestions)
    ? raw.promptSuggestions
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .slice(0, 3)
    : [];

  const focusTopicRaw = raw.focusTopic;
  const focusTopic =
    typeof focusTopicRaw === "string" && focusTopicRaw.trim()
      ? focusTopicRaw.trim()
      : promptSuggestions[0] || undefined;

  const toneNote =
    typeof raw.toneNote === "string" && raw.toneNote.trim()
      ? raw.toneNote.trim()
      : undefined;

  return {
    summary,
    promptSuggestions,
    focusTopic,
    toneNote,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.uuid;
    const database = db();
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get("timezone") || "UTC";

    const requestTime = new Date();

    const cachedEntries = await database
      .select({
        brief: dailyBriefCache.brief,
        generatedAt: dailyBriefCache.generated_at,
        hasConversations: dailyBriefCache.has_conversations,
        hasNews: dailyBriefCache.has_news,
      })
      .from(dailyBriefCache)
      .where(
        and(
          eq(dailyBriefCache.user_uuid, userId),
          eq(dailyBriefCache.timezone, timezone)
        )
      )
      .limit(1);

    if (cachedEntries.length) {
      const cachedEntry = cachedEntries[0];
      const generatedAt = cachedEntry.generatedAt
        ? new Date(cachedEntry.generatedAt)
        : null;

      if (
        generatedAt &&
        requestTime.getTime() - generatedAt.getTime() < CACHE_TTL_MS
      ) {
        try {
          const cachedRaw = JSON.parse(cachedEntry.brief) as unknown;
          const cachedBrief = normalizeBrief(cachedRaw);

          if (cachedBrief) {
            return NextResponse.json({
              brief: cachedBrief,
              metadata: {
                generatedAt: generatedAt.toISOString(),
                timezone,
                hasConversations: cachedEntry.hasConversations,
                hasNews: cachedEntry.hasNews,
                cached: true,
              },
            });
          }
        } catch (error) {
          console.warn("Failed to parse cached daily brief", error);
        }
      }
    }

    const conversations = await database
      .select({
        id: yanConversations.id,
        title: yanConversations.title,
      })
      .from(yanConversations)
      .where(
        and(
          eq(yanConversations.user_uuid, userId),
          eq(yanConversations.status, "active")
        )
      )
      .orderBy(desc(yanConversations.last_message_at))
      .limit(MAX_CONVERSATIONS);

    const conversationSnippets: ConversationSnippet[] = [];
    const recentQuestions: string[] = [];

    if (conversations.length > 0) {
      const snippetPromises = conversations.map(async (conversation) => {
        const messages = await MessageService.getMessagesForConversation(
          conversation.id,
          userId
        );
        if (!messages.length) return;

        const recentMessages = messages
          .filter((msg) => msg.content && msg.content.trim())
          .slice(-MAX_MESSAGES_PER_CONVERSATION);

        if (!recentMessages.length) return;

        const lines = recentMessages.map((msg) => {
          const speaker =
            msg.role === "assistant"
              ? "Yan"
              : msg.role === "user"
                ? "You"
                : msg.role;
          const content = truncateText(msg.content || "");
          return `${speaker}: ${content}`;
        });

        recentMessages
          .filter((msg) => msg.role === "user" && msg.content)
          .slice(-3)
          .forEach((msg) => {
            const content = truncateText(msg.content || "", 160);
            if (content) {
              recentQuestions.push(content);
            }
          });

        conversationSnippets.push({
          title: conversation.title,
          lines,
        });
      });

      await Promise.all(snippetPromises);
    }

    const newsRows = (await database
      .select({
        title: researchData.title,
        content: researchData.content,
        insights: researchData.insights,
        sources: researchData.sources,
        collectedAt: researchData.collection_date,
        dataType: researchData.data_type,
      })
      .from(researchData)
      .where(
        and(
          eq(researchData.user_uuid, userId),
          inArray(researchData.data_type, ["news", "analysis", "research"])
        )
      )
      .orderBy(desc(researchData.collection_date))
      .limit(MAX_NEWS_ITEMS)) as NewsRecord[];

    const newsItems = newsRows
      .map((row) => {
        const summary = truncateText(row.insights || row.content || "", 280);
        if (!summary) return null;

        const parsedSources = safeJsonParse<unknown>(row.sources);
        const source = formatSource(parsedSources);

        return {
          title: row.title || "Untitled Update",
          summary,
          source,
          collectedAt: row.collectedAt
            ? row.collectedAt.toISOString()
            : undefined,
        };
      })
      .filter(Boolean) as Array<{
      title: string;
      summary: string;
      source?: string;
      collectedAt?: string;
    }>;

    const prompt = createPrompt({
      datetime: requestTime.toISOString(),
      timezone,
      conversations: conversationSnippets,
      recentQuestions,
      newsItems,
    });

  const fastModel = await resolveModelForSlot("default_fast");
  const model = gateway(fastModel.name);
    const aiResult = await generateText({
      model,
      prompt,
      temperature: 0.6,
      maxRetries: 2,
    });

    let payload: DailyBriefPayload | null = null;

    try {
      const parsed = JSON.parse(aiResult.text) as unknown;
      const normalized = normalizeBrief(parsed);
      if (normalized) {
        payload = normalized;
      }
    } catch (error) {
      console.error(
        "Failed to parse daily brief response",
        error,
        aiResult.text
      );
    }

    const hasConversations = conversationSnippets.length > 0;
    const hasNews = newsItems.length > 0;

    if (!payload) {
      const suggestions = [
        "Help me plan my day",
        "Summarize my recent chats",
        "What should I focus on next?",
      ];

      payload = {
        summary:
          "Let's set the tone for a productive day. Focus on the conversations that matter most and keep momentum on active projects.",
        promptSuggestions: suggestions,
        focusTopic: suggestions[0],
      };
    }

    try {
      await database
        .insert(dailyBriefCache)
        .values({
          user_uuid: userId,
          timezone,
          brief: JSON.stringify(payload),
          has_conversations: hasConversations,
          has_news: hasNews,
          generated_at: requestTime,
          updated_at: requestTime,
        })
        .onConflictDoUpdate({
          target: [dailyBriefCache.user_uuid, dailyBriefCache.timezone],
          set: {
            brief: JSON.stringify(payload),
            has_conversations: hasConversations,
            has_news: hasNews,
            generated_at: requestTime,
            updated_at: requestTime,
          },
        });
    } catch (error) {
      console.error("Failed to cache daily brief", error);
    }

    return NextResponse.json({
      brief: payload,
      metadata: {
        generatedAt: requestTime.toISOString(),
        timezone,
        hasConversations,
        hasNews,
        cached: false,
      },
    });
  } catch (error) {
    console.error("Failed to generate daily brief", error);
    return NextResponse.json(
      {
        error: "Failed to generate daily brief",
      },
      { status: 500 }
    );
  }
}
