import { auth } from "@/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { runId } = await params;
    const supabase = await createServerSupabaseClient();

    // First, get the multimodeltask by trigger_run_id
    const { data: task, error: taskError } = await supabase
      .from("multimodeltask")
      .select("*")
      .eq("trigger_run_id", runId)
      .eq("user_uuid", session.user.uuid)
      .single();

    if (taskError || !task) {
      return new Response(
        JSON.stringify({ error: "Task not found" }),
        { status: 404 }
      );
    }

    // Get all LLM answers for this task
    const { data: answers, error: answersError } = await supabase
      .from("llmanswer")
      .select("*")
      .eq("multimodeltask", task.id)
      .order("created_at", { ascending: true });

    if (answersError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch answers" }),
        { status: 500 }
      );
    }

    // Parse the models list
    let modelsList: string[] = [];
    try {
      modelsList = task.models.split(",").map((m: string) => m.trim());
    } catch (e) {
      console.error("Failed to parse models list:", e);
    }

    return new Response(
      JSON.stringify({
        task: {
          id: task.id,
          prompt: task.prompt,
          models: modelsList,
          status: task.status,
          started_at: task.started_at,
          completed_at: task.completed_at,
          duration_ms: task.duration_ms,
          summary: task.summary,
          metadata: task.metadata,
        },
        answers: answers || [],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching multi-model task:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
