// Multi-Model Tool UI
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle, Loader2, Settings, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export type ToolPart = {
  type: string;
  state:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  toolCallId?: string;
  errorText?: string;
};

export type ToolProps = {
  wkey: string;
  toolPart: ToolPart;
  defaultOpen?: boolean;
  className?: string;
};
import React from "react";
import RunLLMCard from "./runllmcard";
import {
  useRealtimeRun,
  useRealtimeRunsWithTag,
} from "@trigger.dev/react-hooks";
import { taskStatus } from "@/lib/task-status";
import { run_llms_tag_prefix } from "@/trigger/batch";

const MultiModels = ({
  wkey,
  toolPart,
  defaultOpen = false,
  className,
}: ToolProps) => {
  console.log("Render MultiModels:", toolPart);
  const { type, state, input, output, errorText, toolCallId } = toolPart;

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  // output has: runId taskId models
  const { runId, taskId, models } =
    (output as { runId?: string; taskId?: string; models?: string[] }) || {};

  // Fetch access token from backend API
  const fetchAccessToken = React.useCallback(async () => {
    if (!runId) return;

    setIsLoadingToken(true);
    setTokenError(null);
    try {
      const response = await fetch("/api/yan/trigger/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: run_llms_tag_prefix,
          taskModelName: "multimodeltask",
          runId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      setAccessToken(data.accessToken);
    } catch (error) {
      console.error("Error fetching access token:", error);
      setTokenError(
        error instanceof Error ? error.message : "Failed to fetch access token"
      );
    } finally {
      setIsLoadingToken(false);
    }
  }, [runId]);

  useEffect(() => {
    fetchAccessToken();
  }, [fetchAccessToken]);

  // Get realtime runs for all models
  const tag = `${run_llms_tag_prefix}${runId}`;
  const { runs } = useRealtimeRunsWithTag<any>(tag, {
    enabled: !!runId && !!accessToken,
    accessToken: accessToken!!,
    baseURL: process.env.NEXT_PUBLIC_TRIGGER_API_URL,
  });
  console.log("MultiModels runs:", runs);

  const modelsWithStatus =
    models?.map((model) => {
      // Find the corresponding run for this model
      const modelRun = runs.find(
        (run) => run.payload?.model_name === model || run.tags?.includes(model)
      );

      return {
        name: model,
        status:
          modelRun?.status === "EXECUTING"
            ? taskStatus.GENERATING
            : modelRun?.status === "COMPLETED"
              ? taskStatus.COMPLETED
              : modelRun?.status === "FAILED"
                ? taskStatus.FAILED
                : taskStatus.PENDING,
        runId: modelRun?.id,
      };
    }) || [];
  console.log("modelsWithStatus:", modelsWithStatus);
  console.log("runs:", runs);

  // Set initial selected model if none selected
  useEffect(() => {
    if (!selectedModel && modelsWithStatus.length > 0) {
      setSelectedModel(modelsWithStatus[0].name);
    }
  }, [selectedModel, modelsWithStatus]);

  const getStateIcon = (status: string) => {
    switch (status) {
      case taskStatus.PROCESSING:
      case taskStatus.GENERATING:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case taskStatus.QUEUED:
        return <Settings className="h-4 w-4 text-orange-500" />;
      case taskStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case taskStatus.FAILED:
      case taskStatus.CANCELLED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Settings className="text-muted-foreground h-4 w-4" />;
    }
  };

  const getStateBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case taskStatus.PROCESSING:
      case taskStatus.GENERATING:
        return (
          <span
            className={cn(
              baseClasses,
              "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            )}
          >
            {status === taskStatus.GENERATING ? "Generating" : "Processing"}
          </span>
        );
      case taskStatus.QUEUED:
        return (
          <span
            className={cn(
              baseClasses,
              "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
            )}
          >
            Queued
          </span>
        );
      case taskStatus.COMPLETED:
        return (
          <span
            className={cn(
              baseClasses,
              "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            )}
          >
            Completed
          </span>
        );
      case taskStatus.FAILED:
        return (
          <span
            className={cn(
              baseClasses,
              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}
          >
            Failed
          </span>
        );
      case taskStatus.CANCELLED:
        return (
          <span
            className={cn(
              baseClasses,
              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}
          >
            Cancelled
          </span>
        );
      default:
        return (
          <span
            className={cn(
              baseClasses,
              "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
            )}
          >
            Pending
          </span>
        );
    }
  };

  const handleModelCardClick = (model: {
    name: string;
    status: string;
    runId?: string;
  }) => {
    console.log("onclick model:", model.name, "runId:", model.runId);
    setSelectedModel(model.name);
  };

  // Get the selected model details
  const selectedModelData = modelsWithStatus.find(
    (m) => m.name === selectedModel
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Multi-Models Answer</h2>
      </div>

      {/* Model Status Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {modelsWithStatus.map((model, index) => (
          <div
            key={index}
            className={cn(
              "border border-border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
              selectedModel === model.name && "ring-2 ring-primary"
            )}
            onClick={() => handleModelCardClick(model)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {getStateIcon(model.status)}
                <span className="font-mono text-sm font-medium truncate">
                  {model.name}
                </span>
              </div>
              {getStateBadge(model.status)}
            </div>
          </div>
        ))}
      </div>

      {/* Model Details View */}
      {modelsWithStatus.length > 0 && accessToken &&
        modelsWithStatus.map((model, index) => (
          <div
            className={cn(
              "border-t border-border pt-2",
              selectedModelData?.name === model.name ? "" : "hidden"
            )}
            key={index}
          >
            <div className="space-y-1">
              <RunLLMCard
                model={model.name}
                runId={model.runId}
                accessToken={accessToken || undefined}
              />
            </div>
          </div>
        ))}

      {/* If no models available, show fallback */}
      {modelsWithStatus.length === 0 && (
        <div className="text-center text-muted-foreground">Loading...</div>
      )}
    </div>
  );
};

export default MultiModels;
