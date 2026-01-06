import { useState, useEffect } from "react";

interface MultiModelTask {
  id: string;
  prompt: string;
  models: string[];
  status: string;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  summary: string | null;
  metadata: string | null;
}

interface LLMAnswer {
  id: string;
  multimodeltask: string;
  model: string;
  prompt: string;
  response: string;
  tokensUsage: number;
  request_tokens: number;
  response_tokens: number;
  total_tokens: number;
  usage_info: string | null;
  created_at: string;
  updated_at: string;
}

interface MultiModelResults {
  task: MultiModelTask;
  answers: LLMAnswer[];
}

export function useMultiModelResults(runId: string | null) {
  const [results, setResults] = useState<MultiModelResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) {
      setResults(null);
      setError(null);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/yan/multimodel/${runId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch results");
        }

        const data: MultiModelResults = await response.json();
        setResults(data);
      } catch (err) {
        console.error("Error fetching multi-model results:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();

    // Poll for updates if task is still running
    let pollInterval: NodeJS.Timeout | null = null;
    
    if (results?.task.status === "running" || results?.task.status === "pending") {
      pollInterval = setInterval(fetchResults, 5000); // Poll every 5 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [runId, results?.task.status]);

  return { results, loading, error };
}
