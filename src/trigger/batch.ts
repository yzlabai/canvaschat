import { gateway } from "@/lib/gateway";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { taskStatus } from "@/lib/task-status";
import { batch, metadata, schemaTask, task } from "@trigger.dev/sdk";
import { streamText, type TextStreamPart } from "ai";
import { z } from "zod";

export type STREAMS = {
  llm: TextStreamPart<{}>;
};

export const run_models_id = "run-models";
export const run_llm_id = "run-llm";
export const run_llms_tag_prefix = "runllms:";

export const runModels = schemaTask({
  id: run_models_id,
  description: "Evaluate the prompt on multiple models",
  schema: z.object({
    id: z.string(),
  }),
  run: async ({ id }) => {
    // Initialize Supabase client
    const supabase = await createServerSupabaseClient();
    // Fetch the multiModelTask task from the database
    const { data: multiModelTask, error } = await supabase
      .from("multimodeltask")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !multiModelTask) {
      throw new Error(`Failed to fetch multiModelTask task: ${error?.message}`);
    }
    const { models, trigger_run_id } = multiModelTask;
    const tag = `${run_llms_tag_prefix}${trigger_run_id}`;

    await supabase.from("multimodeltask").update({
      status: taskStatus.PROCESSING,
      trigger_tag: tag,
      updated_at: new Date().toISOString(),
    }).eq("id", id);

    let modelsArr: string[] = [];

    if (typeof models === "string") {
      // If models is a string, convert it to an array
      modelsArr = models.split(",").map((model: string) => model.trim());
    }
    metadata.set("models", modelsArr.map((m) => ({
      name: m,
      status: taskStatus.GENERATING,
    })));

    const runModelTasks = modelsArr.map((model:string, index:number) => ({
      task: runLLM,
      payload: {
        model_name: model,
        prompt: multiModelTask.prompt,
        batchId: multiModelTask.id,
        index,
      },
      options: {
        tags: [model, tag],
      },
    }));

    const { runs } = await batch.triggerByTaskAndWait(runModelTasks);
    //todo update multimodeltask in database when trigger tasks finished(check runModelsResults)
    await supabase.from("multimodeltask").update({
      status: taskStatus.COMPLETED,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    return { results: runs };
  },
});


export const runLLM = schemaTask({
  id: run_llm_id,
  description: "Evaluate the prompt on a specific LLM provider",
  schema: z.object({
    model_name: z.string(),
    prompt: z.string(),
    batchId: z.string(),
    index: z.number(),
  }),
  run: async ({ model_name, prompt, batchId, index }) => {
    metadata.set("model_name", model_name);
    metadata.set("status", taskStatus.GENERATING);
    // Initialize Supabase client
    const supabase = await createServerSupabaseClient();
    const model = gateway(model_name);

    const result = streamText({
      model,
      prompt,
      onError: (error) => {
        console.error("Error streaming text:", error);
        metadata.parent.set(`$.models.${index}.status`, taskStatus.FAILED);
        metadata.set("status", taskStatus.FAILED);
      },
      onFinish: async ({ text, totalUsage }) => {
        const { error } = await supabase.from("llmanswer").insert({
          multimodeltask: batchId,
          model: model_name,
          prompt: prompt,
          response: text,
          total_cost: Math.round((totalUsage?.totalTokens || 0) / 100000),
          request_tokens: totalUsage.inputTokens,
          response_tokens: totalUsage.outputTokens,
          total_tokens: totalUsage.totalTokens,
        });
        if (error) {
          console.error("Error inserting llmanswer:", error);
        }
        metadata.parent.set(`$.models.${index}.status`, taskStatus.COMPLETED);
        metadata.set("status", taskStatus.COMPLETED);
      }
    });
    
    await metadata.stream("llm", result.fullStream);
    
    return { model_name: model_name, status: taskStatus.COMPLETED };
  },
});

