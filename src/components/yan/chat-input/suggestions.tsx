"use client"

import { PromptSuggestion } from "@/components/ui/prompt-suggestion"
import { AnimatePresence, motion } from "motion/react"
import React, { memo, useCallback, useMemo, useState } from "react"
import { BookOpenTextIcon, BrainIcon, CodeIcon, LightbulbIcon, NotepadIcon, PaintBrushIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr"

const TRANSITION_SUGGESTIONS = {
  duration: 0.25,
  type: "spring" as const,
  bounce: 0,
}

const SUGGESTIONS_CONFIG = [
  {
    label: "Summary",
    highlight: "Summarize",
    prompt: `Summarize`,
    items: [
      "Summarize the French Revolution",
      "Summarize the plot of Inception",
      "Summarize World War II in 5 sentences",
      "Summarize the benefits of meditation",
    ],
    icon: NotepadIcon,
  },
  {
    label: "Code",
    highlight: "Help me",
    prompt: `Help me`,
    items: [
      "Help me write a function to reverse a string in JavaScript",
      "Help me create a responsive navbar in HTML/CSS",
      "Help me write a SQL query to find duplicate emails",
      "Help me convert this Python function to JavaScript",
    ],
    icon: CodeIcon,
  },
  {
    label: "Design",
    highlight: "Design",
    prompt: `Design`,
    items: [
      "Design a color palette for a tech blog",
      "Design a UX checklist for mobile apps",
      "Design 5 great font pairings for a landing page",
      "Design better CTAs with useful tips",
    ],
    icon: PaintBrushIcon,
  },
  {
    label: "Research",
    highlight: "Research",
    prompt: `Research`,
    items: [
      "Research the pros and cons of remote work",
      "Research the differences between Apple Vision Pro and Meta Quest",
      "Research best practices for password security",
      "Research the latest trends in renewable energy",
    ],
    icon: BookOpenTextIcon,
  },
  {
    label: "Get inspired",
    highlight: "Inspire me",
    prompt: `Inspire me`,
    items: [
      "Inspire me with a beautiful quote about creativity",
      "Inspire me with a writing prompt about solitude",
      "Inspire me with a poetic way to start a newsletter",
      "Inspire me by describing a peaceful morning in nature",
    ],
    icon: SparkleIcon,
  },
  {
    label: "Think deeply",
    highlight: "Reflect on",
    prompt: `Reflect on`,
    items: [
      "Reflect on why we fear uncertainty",
      "Reflect on what makes a conversation meaningful",
      "Reflect on the concept of time in a simple way",
      "Reflect on what it means to live intentionally",
    ],
    icon: BrainIcon,
  },
  {
    label: "Learn gently",
    highlight: "Explain",
    prompt: `Explain`,
    items: [
      "Explain quantum physics like I'm 10",
      "Explain stoicism in simple terms",
      "Explain how a neural network works",
      "Explain the difference between AI and AGI",
    ],
    icon: LightbulbIcon,
  },
]


type SuggestionsProps = {
  onValueChange: (value: string) => void
  onSuggestion: (suggestion: string) => void
  value?: string
}

const MotionPromptSuggestion = motion.create(PromptSuggestion)

export const Suggestions = memo(function Suggestions({
  onValueChange,
  onSuggestion,
  value,
}: SuggestionsProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  if (!value && activeCategory !== null) {
    setActiveCategory(null)
  }

  const activeCategoryData = SUGGESTIONS_CONFIG.find(
    (group) => group.label === activeCategory
  )

  const showCategorySuggestions =
    activeCategoryData && activeCategoryData.items.length > 0

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setActiveCategory(null)
      onSuggestion(suggestion)
      onValueChange("")
    },
    [onSuggestion, onValueChange]
  )

  const handleCategoryClick = useCallback(
    (suggestion: { label: string; prompt: string }) => {
      setActiveCategory(suggestion.label)
      onValueChange(suggestion.prompt)
    },
    [onValueChange]
  )

  const suggestionsGrid = useMemo(
    () => (
      <motion.div
        key="suggestions-grid"
        className="flex w-full max-w-full flex-nowrap justify-start gap-2 overflow-x-auto px-2 md:mx-auto md:max-w-2xl md:flex-wrap md:justify-center md:pl-0"
        initial="initial"
        animate="animate"
        variants={{
          initial: { opacity: 0, y: 10, filter: "blur(4px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        }}
        transition={TRANSITION_SUGGESTIONS}
        style={{
          scrollbarWidth: "none",
        }}
      >
        {SUGGESTIONS_CONFIG.map((suggestion, index) => (
          <MotionPromptSuggestion
            key={suggestion.label}
            onClick={() => handleCategoryClick(suggestion)}
            className="capitalize"
            initial="initial"
            animate="animate"
            transition={{
              ...TRANSITION_SUGGESTIONS,
              delay: index * 0.02,
            }}
            variants={{
              initial: { opacity: 0, scale: 0.8 },
              animate: { opacity: 1, scale: 1 },
            }}
          >
            <suggestion.icon className="size-4" />
            {suggestion.label}
          </MotionPromptSuggestion>
        ))}
      </motion.div>
    ),
    [handleCategoryClick]
  )

  const suggestionsList = useMemo(
    () => (
      <motion.div
        className="flex w-full flex-col space-y-1 px-2"
        key={activeCategoryData?.label}
        initial="initial"
        animate="animate"
        variants={{
          initial: { opacity: 0, y: 10, filter: "blur(4px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          exit: {
            opacity: 0,
            y: -10,
            filter: "blur(4px)",
          },
        }}
        transition={TRANSITION_SUGGESTIONS}
      >
        {activeCategoryData?.items.map((suggestion: string, index: number) => (
          <MotionPromptSuggestion
            key={`${activeCategoryData?.label}-${suggestion}-${index}`}
            highlight={activeCategoryData.highlight}
            type="button"
            onClick={() => handleSuggestionClick(suggestion)}
            className="block h-full text-left"
            initial="initial"
            animate="animate"
            variants={{
              initial: { opacity: 0, y: -10 },
              animate: { opacity: 1, y: 0 },
            }}
            transition={{
              ...TRANSITION_SUGGESTIONS,
              delay: index * 0.05,
            }}
          >
            {suggestion}
          </MotionPromptSuggestion>
        ))}
      </motion.div>
    ),
    [
      handleSuggestionClick,
      activeCategoryData?.highlight,
      activeCategoryData?.items,
      activeCategoryData?.label,
    ]
  )

  return (
    <AnimatePresence mode="wait">
      {showCategorySuggestions ? suggestionsList : suggestionsGrid}
    </AnimatePresence>
  )
})
