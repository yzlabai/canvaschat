// Multi-Model Tool UI

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  ChevronDown,
  Loader2,
  Settings,
  XCircle,
} from "lucide-react";
import { runLLM, STREAMS } from "@/trigger/batch";
import { useRealtimeRunWithStreams } from "@trigger.dev/react-hooks";

import React, { useMemo, useState } from "react";
import { MessageContent } from "@/components/ui/message";

const RunLLMCard = ({
  model,
  runId,
  accessToken,
}: {
  model: string;
  runId: string | undefined;
  accessToken: string | undefined;
}) => {
  if (!accessToken || !runId) return null;

  const { streams } = useRealtimeRunWithStreams<typeof runLLM, STREAMS>(
    runId,
    {
      accessToken,
      baseURL: process.env.NEXT_PUBLIC_TRIGGER_API_URL,
    }
  );

  const response =
    streams.llm
      ?.filter((part) => part.type === "text-delta")
      .map((part) => part.text)
      .join("") ?? "";

  return (
    <div className="p-2">
      <MessageContent
        className={cn(
          "prose dark:prose-invert relative min-w-full bg-transparent p-0",
          "prose-h1:scroll-m-20 prose-h1:text-2xl prose-h1:font-semibold prose-h2:mt-8 prose-h2:scroll-m-20 prose-h2:text-xl prose-h2:mb-3 prose-h2:font-medium prose-h3:scroll-m-20 prose-h3:text-base prose-h3:font-medium prose-h4:scroll-m-20 prose-h5:scroll-m-20 prose-h6:scroll-m-20 prose-strong:font-medium prose-table:block prose-table:overflow-y-auto"
        )}
      >
        {response}
      </MessageContent>
    </div>
  );
};

export default RunLLMCard;
