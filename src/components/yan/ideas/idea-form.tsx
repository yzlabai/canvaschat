"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2 } from "lucide-react";
import { SpinnerIcon } from "@phosphor-icons/react";
import { IdeaSessionType } from "@/types/ideas";
import {
  DEFAULT_STORY_IMAGE_STYLE,
  STORY_IMAGE_STYLE_OPTIONS,
  type StoryImageStyleValue,
} from "./story-style-options";
import { MODE_OPTIONS, PROMPTS } from "./idea-modes";

const COPY: Record<IdeaSessionType, { fieldLabel: string; helper?: string; placeholder: string; note?: string }> = {
  brainstorm: {
    fieldLabel: "Seed",
    placeholder: "Spark idea...",
  },
  story: {
    fieldLabel: "Story",
    placeholder: "Scene or hero...",
  },
  chat: {
    fieldLabel: "Chat",
    placeholder: "Ask or riff...",
  },
};

interface IdeaCreationFormProps {
  seedIdea: string;
  setSeedIdea: (v: string) => void;
  ideaType: IdeaSessionType;
  setIdeaType: (v: IdeaSessionType) => void;
  isCreating: boolean;
  onSubmit: () => void;
  variant?: "dialog" | "canvas"; // adjust density/layout hints
  storyImageStyle: StoryImageStyleValue;
  setStoryImageStyle: (v: StoryImageStyleValue) => void;
  storyImagePrompt: string;
  setStoryImagePrompt: (v: string) => void;
}

export function IdeaCreationForm({
  seedIdea,
  setSeedIdea,
  ideaType,
  setIdeaType,
  isCreating,
  onSubmit,
  variant = "dialog",
  storyImageStyle,
  setStoryImageStyle,
  storyImagePrompt,
  setStoryImagePrompt,
}: IdeaCreationFormProps) {
  const currentPrompts = PROMPTS[ideaType] ?? PROMPTS.brainstorm;
  const copy = COPY[ideaType] ?? COPY.brainstorm;
  const selectedMode = MODE_OPTIONS.find((mode) => mode.type === ideaType) ?? MODE_OPTIONS[0];

  const hasSeed = seedIdea.trim().length > 0;
  const disabled = !hasSeed || isCreating;
  const isStoryMode = ideaType === "story";

  const actionLabels: Record<IdeaSessionType, { filled: string; empty: string }> = {
    brainstorm: {
      filled: "Create & Root",
      empty: "Create",
    },
    story: {
      filled: "Create Story",
      empty: "Create Story",
    },
    chat: {
      filled: "Start Chat",
      empty: "Start Chat",
    },
  };

  const handlePromptClick = (text: string) => {
    setSeedIdea(text);
  };

  const handleSurprise = () => {
    if (!currentPrompts.length || isCreating) return;
    const randomPrompt = currentPrompts[Math.floor(Math.random() * currentPrompts.length)];
    setSeedIdea(randomPrompt.text);
  };

  const handleClear = () => {
    if (isCreating) return;
    setSeedIdea("");
    if (isStoryMode) {
      setStoryImagePrompt("");
      setStoryImageStyle(DEFAULT_STORY_IMAGE_STYLE);
    }
  };

  const primaryLabel = isCreating
    ? "Creating..."
    : hasSeed
    ? actionLabels[ideaType].filled
    : actionLabels[ideaType].empty;

  const PrimaryIcon = selectedMode.icon;

  return (
    <div className={`space-y-6 ${variant === "canvas" ? "pt-2" : ""}`}>
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Wand2 className="h-3 w-3" />
          </span>
          Mode
        </div>
        <div className="flex flex-wrap gap-2">
          {MODE_OPTIONS.map(({ type, label, icon: Icon }) => {
            const isActive = ideaType === type;
            return (
              <Button
                key={type}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setIdeaType(type);
                  if (type !== "story") {
                    return;
                  }
                  if (!storyImageStyle) {
                    setStoryImageStyle(DEFAULT_STORY_IMAGE_STYLE);
                  }
                }}
                disabled={isCreating}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                  isActive
                    ? "border-transparent bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-background hover:bg-muted/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            );
          })}
            <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleSurprise}
            disabled={isCreating || currentPrompts.length === 0}
            aria-label="Surprise prompt"
            className="rounded-full p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <label htmlFor="seed-idea" className="text-sm font-semibold">
          {copy.fieldLabel}
        </label>
        {copy.helper ? <p className="text-xs text-muted-foreground">{copy.helper}</p> : null}
        {currentPrompts.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {currentPrompts.map((prompt) => (
              <Button
                key={prompt.label}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handlePromptClick(prompt.text)}
                disabled={isCreating}
                className="rounded-full border-border bg-background text-xs hover:bg-muted"
              >
                {prompt.label}
              </Button>
            ))}
          </div>
        ) : null}
        <Textarea
          id="seed-idea"
          autoFocus
          placeholder={copy.placeholder}
          value={seedIdea}
          onChange={(e) => setSeedIdea(e.target.value)}
          className="min-h-[130px] resize-none rounded-lg border border-border bg-gradient-to-br from-background to-muted/40 text-sm"
          disabled={isCreating}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          {copy.note ? <span>{copy.note}</span> : <span />}
        </div>
      </section>

      {isStoryMode ? (
        <section className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Story image style
            </p>
            <div className="flex flex-wrap gap-2">
              {STORY_IMAGE_STYLE_OPTIONS.map((option) => {
                const isActive = storyImageStyle === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isCreating}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      isActive
                        ? "border-transparent bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-background hover:bg-muted/60"
                    }`}
                    onClick={() => setStoryImageStyle(option.value)}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="story-image-prompt"
                className="text-sm font-semibold text-muted-foreground"
              >
                Default image prompt (optional)
              </label>
              <span className="text-[11px] text-muted-foreground">
                Applied to story node art
              </span>
            </div>
            <Textarea
              id="story-image-prompt"
              placeholder="Describe desired mood, motifs, or characters..."
              value={storyImagePrompt}
              onChange={(e) => setStoryImagePrompt(e.target.value)}
              className="min-h-[80px] resize-none rounded-lg border border-border bg-background text-sm"
              disabled={isCreating}
            />
            <p className="text-[11px] text-muted-foreground">
              This prompt guides automatic art generation for this story session. You can leave it blank to let AI improvise.
            </p>
          </div>
        </section>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleClear}
          disabled={!hasSeed || isCreating}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </Button>
        <Button onClick={onSubmit} disabled={disabled} className="flex items-center gap-2">
          {isCreating ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <PrimaryIcon className="h-4 w-4" />}
          {primaryLabel}
        </Button>
      </div>
    </div>
  );
}
