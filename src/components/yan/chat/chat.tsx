"use client";

import { ChatInput } from "@/components/yan/chat-input/chat-input";
import { Conversation } from "@/components/yan/chat/conversation";
import { InsufficientCreditsDialog } from "@/components/yan/dialogs/insufficient-credits-dialog";
import { MultiModelDialog } from "@/components/yan/dialogs/multi-model-dialog";
import { TodayBrief } from "@/components/yan/today-brief/today-brief";
import { HeaderSidebarTrigger } from "@/components/yan/layout/header-sidebar-trigger";
import { ButtonNewChat } from "@/components/yan/layout/button-new-chat";
import { HistoryTrigger } from "@/components/yan/history/history-trigger";
import { useYan } from "@/lib/chat-store/provider";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState, useRef } from "react";
import { MyUIMessage } from "@/types/api.types";

/**
 * Main Chat Component
 *
 * This component manages the entire chat interface using the centralized
 * YanProvider for all chat functionality including:
 * 1. Message persistence (database storage)
 * 2. Real-time streaming (AI SDK integration)
 * 3. Conversation management
 *
 * Key Responsibilities:
 * - Render chat interface and handle user interactions
 * - Manage input state and form submission
 * - Delegate all chat logic to YanProvider
 *
 * Architecture:
 * - Uses YanProvider for all chat state and operations
 * - Focuses purely on UI rendering and user interaction
 * - No direct AI SDK usage (handled by provider)
 */
export function Chat() {
  // ============================================================================
  // CONTEXT AND STATE INITIALIZATION
  // ============================================================================

  // Local UI state for form submission
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Provider state: All chat functionality managed centrally
  const {
    conversationId, // Current conversation ID from URL params
    messages, // Messages for current conversation
    canvasStatus, // Canvas AI chat status
    status, // AI streaming status
    onSend, // Message submission handler
    stop, // Stop streaming function
    handleDelete, // Message deletion handler
    handleEdit, // Message editing handler
    isInsufficientCreditsDialogOpen, // Insufficient credits dialog state
    setIsInsufficientCreditsDialogOpen, // Dialog state setter
    isMultiModelDialogOpen, // Multi-model dialog state
    setIsMultiModelDialogOpen, // Multi-model dialog state setter
  } = useYan();

  // ============================================================================
  // MESSAGE HANDLERS
  // ============================================================================

  /**
   * Handle input field changes
   */
  const onValueChange = (value: string) => {
    setInput(value);
  };

  /**
   * Handle form submission
   * Delegates to provider's onSend function
   */
  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    const messageContent = input;
    setInput(""); // Clear input immediately for better UX

    try {
      await onSend(messageContent);
    } catch (error) {
      // Restore input on error for retry
      setInput(messageContent);
    }
  }, [input, onSend]);

  /**
   * Handle prompt suggestion selection
   */
  const handlePromptSelect = useCallback((prompt: string) => {
    setInput(prompt);
    // Focus input after selecting a prompt
    // (Implementation depends on how the input is referenced, e.g., via ref)
    inputRef.current?.focus();
  }, []);

  // ============================================================================
  // MEMOIZED PROPS (PERFORMANCE OPTIMIZATION)
  // ============================================================================

  /**
   * Memoized conversation props to prevent unnecessary rerenders
   */
  const conversationProps = useMemo(
    () => ({
      messages: messages as MyUIMessage[],
      status,
      canvasStatus,
      onDelete: handleDelete,
      onEdit: handleEdit,
    }),
    [messages, status, canvasStatus, handleDelete, handleEdit]
  );

  /**
   * Memoized chat input props to prevent unnecessary rerenders
   */
  const chatInputProps = useMemo(
    () => ({
      value: input,
      onValueChange,
      onSend: handleSend,
      isSubmitting: status === "streaming" || status === "submitted",
      stop,
      canvasStatus,
      ref: inputRef,
    }),
    [input, handleSend, status, stop, canvasStatus]
  );

  // ============================================================================
  // UI STATE LOGIC
  // ============================================================================

  /**
   * Determine whether to show onboarding screen
   * Shows when: no active conversation
   */
  const showOnboarding = !conversationId;
  return (
    <>
      <div className="flex-1 overflow-hidden">
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-1">
          <HeaderSidebarTrigger />
        </div>
        <div
          className={cn(
            "@container/main relative flex h-full flex-col items-center justify-end md:justify-center overflow-hidden"
          )}
        >
          {/* Animated transition between onboarding and conversation views */}
          <AnimatePresence initial={false} mode="popLayout">
            {showOnboarding ? (
              <motion.div
                key="onboarding"
                className="mx-auto w-full max-w-[50rem] overflow-y-auto px-4 md:relative md:bottom-auto md:max-h-none md:overflow-visible md:px-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                layout="position"
                layoutId="onboarding"
                transition={{
                  layout: {
                    duration: 0,
                  },
                }}
              >
                <TodayBrief onPromptSelect={handlePromptSelect} />
              </motion.div>
            ) : (
              <Conversation key="conversation" {...conversationProps} />
            )}
          </AnimatePresence>
          <motion.div
            className={cn(
              "relative inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl"
            )}
            layout="position"
            layoutId="chat-input-container"
            transition={{
              layout: {
                duration: 0,
              },
            }}
          >
            <ChatInput {...chatInputProps} />
          </motion.div>
        </div>
      </div>

      {/* Insufficient Credits Dialog */}
      <InsufficientCreditsDialog
        open={isInsufficientCreditsDialogOpen}
        onOpenChange={setIsInsufficientCreditsDialogOpen}
      />

      {/* Multi-Model Selection Dialog */}
      <MultiModelDialog
        open={isMultiModelDialogOpen}
        onOpenChange={setIsMultiModelDialogOpen}
      />
    </>
  );
}
