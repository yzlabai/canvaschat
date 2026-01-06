import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * Supported task model names for access control
 */
export const TaskModelNames = [
  "multimodeltask",
] as const;
export type TaskModelName =
  | "multimodeltask";

/**
 * Task access result interface
 */
export interface TaskAccessResult {
  hasAccess: boolean;
  taskData?: any;
  error?: string;
}

/**
 * Service for handling task access control and operations
 */
export class TaskService {
  /**
   * Check whether a user has access to a specific task
   * @param userUuid - The user's UUID
   * @param taskModelName - The task model name (e.g.,  "multimodeltask")
   * @param taskId - The task ID (UUID)
   * @param runId - The Trigger.dev run ID associated with the task
   * @returns Promise<TaskAccessResult> - Access result with task data if accessible
   */
  static async checkUserTaskAccessWithRunId(
    userUuid: string,
    taskModelName: TaskModelName,
    runId: string
  ): Promise<TaskAccessResult> {
    try {
      const supabase = await createServerSupabaseClient();

      // Define the query based on task model name
      let query;
      if (taskModelName === "multimodeltask") {
        query = supabase
            .from("multimodeltask")
            .select("*")
            .eq("trigger_run_id", runId)
            .eq("user_uuid", userUuid);
      }else {
        return {
          hasAccess: false,
          error: `Unsupported task model name: ${taskModelName}`,
        };
      }

      const { data, error } = await query.single();

      if (error) {
        // If the error is "No rows found", it means the user doesn't have access
        if (error.code === 'PGRST116') {
          return {
            hasAccess: false,
            error: "Task not found or access denied",
          };
        }

        console.error(`Error checking access for ${taskModelName} runId:${runId}:`, error);
        return {
          hasAccess: false,
          error: `Database error: ${error.message}`,
        };
      }

      return {
        hasAccess: true,
        taskData: data,
      };
    } catch (error) {
      console.error("Error in checkUserTaskAccess:", error);
      return {
        hasAccess: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get all tasks for a user by task model name
   * @param userUuid - The user's UUID
   * @param taskModelName - The task model name
   * @param limit - Maximum number of tasks to return (default: 50)
   * @param offset - Number of tasks to skip (default: 0)
   * @returns Promise<any[]> - Array of tasks belonging to the user
   */
  static async getUserTasks(
    userUuid: string,
    taskModelName: TaskModelName,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const supabase = await createServerSupabaseClient();

      let query;
      if (taskModelName === "multimodeltask") {
        query = supabase
            .from("multimodeltask")
            .select("*")
            .eq("user_uuid", userUuid)
            .order("created_at", { ascending: false })
            .limit(limit)
            .range(offset, offset + limit - 1);
      } else {
        console.error(`Unsupported task model name: ${taskModelName}`);
        return [];
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching user tasks for ${taskModelName}:`, error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getUserTasks:", error);
      return [];
    }
  }
}
