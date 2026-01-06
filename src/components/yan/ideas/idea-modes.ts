import { type ComponentType } from "react";
import { IdeaSessionType } from "@/types/ideas";
import {
  LightbulbIcon,
  BookOpenIcon,
  ChatCircleTextIcon,
} from "@phosphor-icons/react";
import { ListChecks } from "lucide-react";

// Centralized example prompts (single source for idea creation UX)
export const BRAINSTORM_PROMPTS = [
  {
    label: "Brainstorm",
    text: "Help me brainstorm ideas for a new startup app that leverages AI to improve productivity.",
  },
  {
    label: "Breakdown Goal",
    text: "Help me break down the goal of 'Launch a Successful Personal Tech Blog' into major subject areas required.",
  },
  {
    label: "Decision-making",
    text: "Simulate a decision-making process for choosing a new career path, listing key factors to consider.",
  },
];

export const STORY_PROMPTS = [
  {
    label: "Space Adventure",
    text: "You are the captain of a deep space exploration vessel. Your ship has detected an unknown signal from a distant planet. What do you do?",
  },
  {
    label: "Mystery Detective",
    text: "You're a detective investigating a mysterious disappearance in a small town. You've found a strange letter in the victim's room. What's your next move?",
  },
  {
    label: "Fantasy Quest",
    text: "You're a young mage who has discovered an ancient artifact in the forest. Strange things begin happening in your village. How do you proceed?",
  },
  {
    label: "Time Travel",
    text: "You've accidentally traveled back to medieval times with modern knowledge. You must decide how to survive and whether to change history.",
  },
];

export const CHAT_PROMPTS = [
  {
    label: "General Chat",
    text: "Let's chat about my goals this quarter and how to approach them effectively.",
  },
  {
    label: "Clarify Idea",
    text: "I have a vague idea for a learning app. Ask me questions to clarify the concept.",
  },
  {
    label: "Daily Planning",
    text: "Help me plan my day with 3 priorities and time estimates.",
  },
];

export const TASK_PROMPTS = [
  {
    label: "Sprint Plan",
    text: "Outline the three most important tasks we need to complete this week to keep the project moving forward.",
  },
  {
    label: "Blockers",
    text: "List current blockers for the marketing launch and assign a next action to each.",
  },
  {
    label: "Delegation",
    text: "Break down the onboarding flow improvement into actionable steps with suggested owners and deadlines.",
  },
];

export type Prompt = {
  label: string;
  text: string;
};

export const PROMPTS: Record<IdeaSessionType, Prompt[]> = {
  brainstorm: BRAINSTORM_PROMPTS,
  story: STORY_PROMPTS,
  chat: CHAT_PROMPTS,
};

export type ModeOption = {
  type: IdeaSessionType;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

export const MODE_OPTIONS: ModeOption[] = [
  {
    type: "brainstorm",
    label: "Brainstorm",
    description: "Map ideas fast.",
    icon: LightbulbIcon,
  },
  {
    type: "chat",
    label: "Chat",
    description: "Think with AI.",
    icon: ChatCircleTextIcon,
  },
  {
    type: "story",
    label: "Story",
    description: "Shape stories.",
    icon: BookOpenIcon,
  },
];
