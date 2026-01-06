import type { StoryImageStyleValue } from "@/types/ideas";

export const STORY_IMAGE_STYLE_OPTIONS: ReadonlyArray<{
  value: StoryImageStyleValue;
  label: string;
}> = [
  { value: "cinematic", label: "Cinematic" },
  { value: "watercolor", label: "Watercolor" },
  { value: "line-art", label: "Line Art" },
  { value: "anime", label: "Anime" },
  { value: "surreal", label: "Surreal" },
];

export const DEFAULT_STORY_IMAGE_STYLE: StoryImageStyleValue =
  STORY_IMAGE_STYLE_OPTIONS[0].value;

export type { StoryImageStyleValue };
