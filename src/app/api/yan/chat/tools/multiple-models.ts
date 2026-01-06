import { tool } from "ai";
import { auth } from "@/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { tasks } from "@trigger.dev/sdk";
import { runModels } from "@/trigger/batch";
import z from "zod";
import { taskStatus } from "@/lib/task-status";

/**
 * Multiple Models Tool
 * Executes a prompt across multiple AI models for comparison and analysis
 */
export const createToolMultipleModels = (selectedModels: string[]) => {
  return tool({
    description: "Call multiple models to answer a query",
    inputSchema: z.object({
      prompt: z.string().describe("The prompt to send to multiple models"),
    }),
    execute: async ({ prompt }) => {
      // Get user ID from auth context
      const userId = (await auth())?.user?.uuid;
      
      // use trigger dev to call multiple models
      // get selectmodels from outside
      const models = selectedModels;

      const supabase = await createServerSupabaseClient();
      const { data: multimodeltask, error } = await supabase
        .from("multimodeltask")
        .insert({
          prompt,
          models: models.join(","),
          user_uuid: userId,
        })
        .select()
        .single();
      
      if (error || !multimodeltask) {
        throw new Error(
          `Failed to create multimodeltask: ${error?.message}`
        );
      }
      // the handler returns once task is triggered
      const handler = await tasks.trigger<typeof runModels>("run-models", {
        id: multimodeltask.id,
      });

      // update multimodeltask with run ID
      try {
        const { error: updateError } = await supabase
          .from("multimodeltask")
          .update({
            trigger_run_id: handler.id,
            status: taskStatus.PROCESSING,
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", multimodeltask.id);

        if (updateError) {
          console.error("Failed to update multimodeltask:", updateError);
        }
      } catch (error) {
        console.error("Error creating trigger run record:", error);
      }

      //todo trigger a summary task to generate summary of the models' output.

      return { 
        result: `Executed ${handler.id}`, 
        taskId: multimodeltask.id, 
        runId: handler.id,
        models: selectedModels
      };
    },
  });
};
