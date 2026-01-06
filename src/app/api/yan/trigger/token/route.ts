import { auth } from "@/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { TaskService } from "@/services/task";
import { run_llms_tag_prefix } from "@/trigger/batch";
import { NextRequest } from "next/server";

/**
 * API endpoint to create a public access token for Trigger.dev runs
 * This allows the frontend to access real-time streams for specific runs
 * with read-only permissions.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { toolCallId, task, taskModelName, runId } = body;
    // verify whether the user has access to the specified run
    const hasAccess = await TaskService.checkUserTaskAccessWithRunId(
      session.user.uuid,
      taskModelName,
      runId
    );
    if (!hasAccess.hasAccess) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403 }
      );
    }

    let readScopes: any = runId ? { runs: [runId] } : {};
    if(task === run_llms_tag_prefix){
      readScopes = { tags: [`${run_llms_tag_prefix}${runId}`] };
    }
    
    try {
      // Try to use the official Trigger.dev auth method first
      const { auth: triggerAuth } = await import("@trigger.dev/sdk");
      
      // Create a public access token with read permissions for the specific run
      const publicToken = await triggerAuth.createPublicToken({
        scopes: {
          read: readScopes,
        },
      });

      return new Response(
        JSON.stringify({ accessToken: publicToken }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    } catch (triggerError) {
      // Fallback: If Trigger.dev auth.createPublicToken is not available in the current SDK version
      console.warn("Trigger.dev auth.createPublicToken not available, using environment API key");
      
      // Use the private API key as a fallback
      // NOTE: In production, you should implement proper token scoping
      // or upgrade to a Trigger.dev SDK version that supports createPublicToken
      const apiKey = process.env.TRIGGER_SECRET_KEY;
      if (!apiKey) {
        throw new Error("No Trigger.dev API key available in environment variables");
      }

      return new Response(
        JSON.stringify({ 
          accessToken: apiKey,
          note: "Using private API key as fallback - consider upgrading Trigger.dev SDK for better security"
        }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

  } catch (error) {
    console.error("Error creating public token:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to create public token",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500 }
    );
  }
}
