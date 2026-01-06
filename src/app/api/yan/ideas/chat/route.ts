import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createIdeaNode, getIdeaSession } from "@/services/ideas";
import { streamText } from "ai";
import { gateway } from "@/lib/gateway";
import { resolveModelForSlot } from "@/services/ai-models";
import { db } from "@/db";
import { ideaNodes } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/yan/ideas/chat
// Body: { text: string; parentNodeId?: string; sessionId?: string }
// Behavior:
// 1) Create a user message node under parentNodeId (or session root)
// 2) Create an empty AI node as a child of the user message node
// 3) Stream AI output tokens; update AI node content during/after streaming
// 4) Return a streaming response including initial data { userNodeId, aiNodeId }
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      text,
      parentNodeId,
      sessionId: bodySessionId,
      aiOnly,
      userNodeId,
      aiNodeId,
    } = await request.json();

    if (!aiOnly) {
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return NextResponse.json(
          { error: "Text is required" },
          { status: 400 }
        );
      }
    }
    // Determine effective parent node
    let effectiveParentId: string | undefined = parentNodeId;
    let resolvedSessionId: string | undefined = bodySessionId;

    // Determine positioning relative to parent
    const database = db();
    let parentPos = { x: 0, y: 0 };

    const [parentRow] = effectiveParentId
      ? await database
          .select({
            session_id: ideaNodes.session_id,
            x: ideaNodes.position_x,
            y: ideaNodes.position_y,
            content: ideaNodes.content,
          })
          .from(ideaNodes)
          .where(eq(ideaNodes.id, effectiveParentId))
          .limit(1)
      : [undefined as any];
    if (parentRow) parentPos = { x: parentRow.x || 0, y: parentRow.y || 0 };
    resolvedSessionId = parentRow?.session_id ?? resolvedSessionId;

    // If parent not provided or not found, try root by sessionId
    if (!effectiveParentId) {
      if (!resolvedSessionId) {
        return NextResponse.json(
          { error: "parentNodeId or sessionId is required" },
          { status: 400 }
        );
      }
      const sessionData = await getIdeaSession(
        resolvedSessionId,
        session.user.uuid
      ).catch(() => null as any);
      const rootId = (sessionData as any)?.root_node_id;
      if (!rootId) {
        return NextResponse.json(
          { error: "Could not resolve parent node" },
          { status: 400 }
        );
      }
      effectiveParentId = rootId;
    }
    if (!resolvedSessionId) {
      return NextResponse.json(
        { error: "Could not resolve session for chat" },
        { status: 400 }
      );
    }
    let userNode: any = null;
    let aiNode: any = null;
    if (aiOnly) {
      // Only create AI node directly under the parent
      const created = await createIdeaNode(session.user.uuid, {
        id: aiNodeId,
        session_id: resolvedSessionId,
        title: "AI",
        content: "",
        node_type: "chat",
        parent_node_id: effectiveParentId,
        created_by: "ai",
        position_x: parentPos.x + 200,
        position_y: parentPos.y,
        root_distance: parentRow ? (parentRow as any).root_distance + 1 : 1,
      });
      aiNode = created.node;
    } else {
      // Create user message node (child of effectiveParentId)
      const createdUser = await createIdeaNode(session.user.uuid, {
        id: userNodeId,
        session_id: resolvedSessionId,
        title: "",
        content: text,
        node_type: "chat",
        parent_node_id: effectiveParentId,
        created_by: "user",
        position_x: parentPos.x + 200,
        position_y: parentPos.y,
        root_distance: parentRow ? (parentRow as any).root_distance + 1 : 1,
      });
      userNode = createdUser.node;

      // Create placeholder AI node (child of user message)
      const createdAi = await createIdeaNode(session.user.uuid, {
        id: aiNodeId,
        session_id: resolvedSessionId,
        title: "AI",
        content: "",
        node_type: "chat",
        parent_node_id: userNode.id,
        created_by: "ai",
        position_x: parentPos.x + 400,
        position_y: parentPos.y,
        root_distance: parentRow ? (parentRow as any).root_distance + 2 : 2,
      });
      aiNode = createdAi.node;
    }

    // Helper: fetch direct ancestor chain from parent -> root (inclusive)
    type Ancestor = {
      id: string;
      title: string | null;
      content: string | null;
      node_type: string | null;
      parent_node_id: string | null;
      root_distance: number | null;
    };
    const fetchAncestors = async (startId: string): Promise<Ancestor[]> => {
      const ancestors: Ancestor[] = [];
      let currentId: string | null = startId;
      const maxDepth = 50; // safety guard against cycles
      while (currentId && ancestors.length < maxDepth) {
        const [row] = await database
          .select({
            id: ideaNodes.id,
            title: ideaNodes.title,
            content: ideaNodes.content,
            node_type: ideaNodes.node_type,
            parent_node_id: ideaNodes.parent_node_id,
            root_distance: ideaNodes.root_distance,
          })
          .from(ideaNodes)
          .where(eq(ideaNodes.id, currentId))
          .limit(1);
        if (!row) break;
        ancestors.push(row as unknown as Ancestor);
        currentId = (row as any).parent_node_id || null;
      }
      return ancestors.reverse(); // root -> parent
    };

    // Helper: smart abbreviate long text near boundary
    const abbreviate = (input: string, limit: number): string => {
      if (!input) return "";
      const text = input.replace(/\s+/g, " ").trim();
      if (text.length <= limit) return text;
      const slice = text.slice(0, limit);
      const boundary = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf("! "),
        slice.lastIndexOf("? ")
      );
      const cutPoint = boundary > limit * 0.5 ? boundary + 1 : limit;
      return slice.slice(0, cutPoint).trimEnd() + " …";
    };

    // Helper: build a concise ancestor context block with total cap
    const buildAncestorContext = (
      ancestors: Ancestor[],
      maxTotal = 2000
    ): string => {
      if (!ancestors.length) return "";
      // Allocate per-node budget, bounded
      let per = Math.min(
        500,
        Math.max(120, Math.floor(maxTotal / ancestors.length))
      );
      const render = (budget: number) =>
        ancestors
          .map((n) => {
            const header = `- [${(n.title || "").toString().trim() || n.node_type || "Node"}]`;
            const body = abbreviate(
              (n.content || n.title || "").toString(),
              budget
            );
            return `${header}: ${body}`;
          })
          .join("\n");
      let combined = render(per);
      if (combined.length > maxTotal) {
        per = Math.max(80, Math.floor(maxTotal / ancestors.length) - 16);
        combined = render(per);
        if (combined.length > maxTotal) {
          combined = combined.slice(0, maxTotal - 1) + "…";
        }
      }
      return combined;
    };

    // Collect ancestor context from the effective parent of the user message
    const ancestors = await fetchAncestors(effectiveParentId as string);
    const ancestorContext = buildAncestorContext(ancestors, 2000);

    // Start streaming AI response
  const fastModel = await resolveModelForSlot("default_fast");
  console.log("Using model:", fastModel);
  const model = gateway(fastModel.name);
    const prompt = `You are a helpful AI assistant in a canvas-based chat. Respond concisely and clearly.

Canvas ancestor context (root -> current parent):
${ancestorContext || "(no prior context)"}

User: ${aiOnly ? parentRow?.content || "" : text}
Assistant:`;

    const result = streamText({
      model,
      prompt,
      temperature: 0.5,
      maxRetries: 2,
      onFinish: async ({ text }) => {
        try {
          const finalText = text || "";
          const database = db();
          await database
            .update(ideaNodes)
            .set({ content: finalText, updated_at: new Date() , status: "done" })
            .where(eq(ideaNodes.id, aiNode.id));
        } catch (e) {
          console.error("Final AI node update failed", e);
        }
      },
    });

    // Stream plain text response and include node IDs in headers
    const response = result.toTextStreamResponse();
    // Clone headers to append custom metadata
    const headers = new Headers(response.headers);
    if (userNode?.id) headers.set("x-user-node-id", userNode.id);
    headers.set("x-ai-node-id", aiNode.id);
    headers.set("x-parent-node-id", effectiveParentId as string);
    headers.set("x-session-id", resolvedSessionId as string);
    return new Response(response.body, { status: 200, headers });
  } catch (error) {
    console.error("Error in chat generation route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
