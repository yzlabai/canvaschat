import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createIdeaNode, deleteNodes, getSessionNodes } from "@/services/ideas";
import { generateText } from "ai";
import { gateway } from "@/lib/gateway";
import { resolveModelForSlot } from "@/services/ai-models";
import { db } from "@/db";
import { ideaNodes } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/yan/ideas/nodes - Get all nodes for session
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }
    const nodes = await getSessionNodes(sessionId, session.user.uuid);
    return NextResponse.json(nodes);
  } catch (error) {
    console.error("Error fetching session nodes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/yan/ideas/nodes - Create a new child idea node for a given parent node
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const {
      session_id,
      title: rawTitle,
      content: rawContent,
      node_type,
      position_x,
      position_y,
      parent_node_id,
      root_distance,
    } = body;
    const sessionId = session_id;
    // User supplies at least some content (free-form thought)
    if (!rawContent || rawContent.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    let finalTitle =
      rawTitle && rawTitle.trim().length > 0 ? rawTitle.trim() : "";
    let finalContent = rawContent.trim();

    // Optionally fetch parent node for context
    let parentInfo: {
      title?: string;
      content?: string;
      position_x: number;
      position_y: number;
      root_distance?: number;
    } = { position_x: 0, position_y: 0 };
    if (parent_node_id) {
      try {
        const database = db();
        const [parent] = await database
          .select({
            id: ideaNodes.id,
            title: ideaNodes.title,
            content: ideaNodes.content,
            position_x: ideaNodes.position_x,
            position_y: ideaNodes.position_y,
            root_distance: ideaNodes.root_distance,
          })
          .from(ideaNodes)
          .where(eq(ideaNodes.id, parent_node_id))
          .limit(1);
        if (parent) {
          parentInfo = {
            title: parent.title ?? undefined,
            content: parent.content ?? undefined,
            position_x: parent.position_x || 0,
            position_y: parent.position_y || 0,
            root_distance: parent.root_distance || 0,
          };
        }
      } catch (e) {
        console.warn("Parent node lookup failed, continuing without context");
      }
    }

    if (!finalTitle) {
      // Generate structured title + refined content using AI
      const fastModel = await resolveModelForSlot("default_fast");
      const model = gateway(fastModel.name);
      const prompt = `You are helping a user create a concise node in an idea map.
User raw input:
"""
${rawContent.trim()}
"""
${parentInfo.title ? `Parent Node Title: ${parentInfo.title}\n` : ""}${parentInfo.content ? `Parent Node Summary: ${parentInfo.content?.slice(0, 180)}\n` : ""}

Requirements:
1. Produce JSON ONLY (no markdown) with keys: title, content.
2. title: Short (2-5 words), Title Case, no ending punctuation, captures the essence.
3. content: 1-2 sentences (<=220 chars) expanding or clarifying the idea.
4. Avoid trivial echo of the exact input; refine and structure it.
5. Do NOT include additional keys.

Example output:
{"title":"Editorial Calendar Setup","content":"Plan initial publishing cadence and structure categories to ensure consistent, audience-focused output."}

Now output the JSON object:`;

      try {
        const aiResp = await generateText({
          model,
          prompt,
          temperature: 0.4,
          maxRetries: 2,
        });
        const text = aiResp.text.trim();
        let parsed: any = {};
        try {
          parsed = JSON.parse(text);
          if (parsed && typeof parsed === "object") {
            if (parsed.title && typeof parsed.title === "string")
              finalTitle = parsed.title.trim();
            if (parsed.content && typeof parsed.content === "string")
              finalContent = parsed.content.trim();
          }
        } catch (e) {
          // Fallback shaping
          const firstWords = rawContent.split(/\s+/).slice(0, 4).join(" ");
          finalTitle = finalTitle || firstWords.replace(/[.,;:!?]+$/, "");
        }
      } catch (e) {
        console.error("AI generation failed, falling back:", e);
        const firstWords = rawContent.split(/\s+/).slice(0, 4).join(" ");
        finalTitle = finalTitle || firstWords.replace(/[.,;:!?]+$/, "");
      }
    }

    // Final safety fallbacks
    if (!finalTitle) {
      finalTitle = rawContent.split(/\s+/).slice(0, 4).join(" ");
    }
    finalTitle = finalTitle.slice(0, 80);
    finalContent = finalContent.slice(0, 1000);

    const { node, connection } = await createIdeaNode(session.user.uuid, {
      session_id: sessionId,
      title: finalTitle,
      content: finalContent,
      node_type: node_type || "idea",
      position_x: position_x || parentInfo.position_x || 0,
      position_y: position_y || parentInfo.position_y + 200 || 0,
      parent_node_id,
      root_distance: root_distance !== undefined ? root_distance : (parentInfo.root_distance || 0) + 1,
    });

    return NextResponse.json({ node, connection });
  } catch (error) {
    console.error("Error creating idea node:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/yan/ideas/nodes - Delete nodes
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { ids } = await request.json();
    const deletedCount = await deleteNodes(ids, session.user.uuid);
    if (deletedCount === 0) {
      return NextResponse.json(
        { error: "Node not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Node deleted successfully" });
  } catch (error) {
    console.error("Error deleting idea node:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
