"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Lightbulb, Sparkles } from "lucide-react";
import { IdeaCreationForm } from "./idea-form";
import { IdeaSessionType } from "@/types/ideas";
import { useIdeas } from "@/contexts/ideas-provider";
import {
  DEFAULT_STORY_IMAGE_STYLE,
  type StoryImageStyleValue,
} from "./story-style-options";

export function CanvasEmptyState() {
  const { createNewIdea } = useIdeas();
  const [seed, setSeed] = useState("");
  const [type, setType] = useState<IdeaSessionType>("brainstorm");
  const [isCreating, setIsCreating] = useState(false);
  const [storyImageStyle, setStoryImageStyle] = useState<StoryImageStyleValue>(
    DEFAULT_STORY_IMAGE_STYLE
  );
  const [storyImagePrompt, setStoryImagePrompt] = useState("");

  const onSubmit = useCallback(async () => {
    if (!seed.trim()) return;
    setIsCreating(true);
    try {
      await createNewIdea({
        description: seed.trim(),
        type,
        storyImageStyle: type === "story" ? storyImageStyle : undefined,
        storyImagePrompt:
          type === "story" ? storyImagePrompt.trim() || null : undefined,
      });
      setSeed("");
      if (type === "story") {
        setStoryImagePrompt("");
        setStoryImageStyle(DEFAULT_STORY_IMAGE_STYLE);
      }
    } finally {
      setIsCreating(false);
    }
  }, [seed, type, storyImageStyle, storyImagePrompt, createNewIdea]);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-muted/40 via-background to-background px-4 py-10">
      <Card className="relative w-full max-w-3xl overflow-hidden border border-border/60 bg-background/90 p-6 shadow-2xl backdrop-blur">
        <div className="relative flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/12 text-primary">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-primary">
              <Sparkles className="h-3 w-3" />
              Fresh canvas
            </div>
            <h2 className="text-lg font-semibold">Launch an idea</h2>
            <p className="text-sm text-muted-foreground">Mode → Seed → Node.</p>
          </div>
        </div>
        <IdeaCreationForm
          variant="canvas"
          seedIdea={seed}
          setSeedIdea={setSeed}
          ideaType={type}
          setIdeaType={setType}
          isCreating={isCreating}
          onSubmit={onSubmit}
          storyImageStyle={storyImageStyle}
          setStoryImageStyle={setStoryImageStyle}
          storyImagePrompt={storyImagePrompt}
          setStoryImagePrompt={setStoryImagePrompt}
        />
      </Card>
    </div>
  );
}
