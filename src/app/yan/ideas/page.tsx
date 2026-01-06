"use client";

import { InteractiveCanvas } from "@/components/yan/ideas/interactive-canvas";
import { IdeasProvider, useIdeas } from "@/contexts/ideas-provider";

function IdeasPageContent() {
  const { isLoading } = useIdeas();

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing your idea session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col">
        <InteractiveCanvas />
      </div>
    </div>
  );
}

export default function IdeasPage() {
  return (
    <IdeasProvider>
      <IdeasPageContent />
    </IdeasProvider>
  );
}
