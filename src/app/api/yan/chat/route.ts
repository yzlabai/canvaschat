import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config";
import {
  convertToCoreMessages,
  streamText,
} from "ai";

import { createErrorResponse, extractErrorMessage } from "./utils";
import { createToolMultipleModels } from "./tools/multiple-models";
import { MyUIMessage } from "@/types/api.types";
import { gateway } from "@/lib/gateway";
import { auth } from "@/auth";
import { MessageService } from "@/lib/chat-store/messages/api-server";
import { ConversationService } from "@/lib/chat-store/conversations/api-server";
import { resolveModelForSlot } from "@/services/ai-models";
import {
  decreaseCredits,
  CreditsTransType,
  getUserCredits,
  computeCreditsFromTokens,
} from "@/services/credit";

export const maxDuration = 60;

type ChatRequest = {
  id: string;
  message: MyUIMessage;
  messages: MyUIMessage[];
  conversationId: string;
  isMultiModelMode?: boolean;
  selectedModels?: string[];
};

/**
 * Calculate and consume credits based on token usage and special modes
 */
async function handleCreditConsumption(
  userId: string,
  totalUsage: any,
  isMultiModelMode: boolean
): Promise<number> {
  // calculate cost based on tokens
  const costAmount = computeCreditsFromTokens(
    totalUsage?.totalTokens || 0,
    CreditsTransType.Chat
  );

  // Consume credits based on cost amount
  // For now, 1 cent = 1 credit (you can adjust this ratio as needed)
  let creditsToConsume = costAmount;
  if (isMultiModelMode) {
    creditsToConsume += 1;
  }

  if (creditsToConsume > 0) {
    try {
      await decreaseCredits({
        user_uuid: userId,
        trans_type: CreditsTransType.Chat,
        credits: creditsToConsume,
      });
      console.log(
        `Successfully consumed ${creditsToConsume} credits for user ${userId}`
      );
    } catch (error) {
      console.error("Failed to consume credits:", error);
      // Continue with saving the message even if credit consumption fails
      // You might want to handle this differently based on your business logic
    }
  }

  return costAmount;
}

/**
 * Extract tool calls and tool results from steps and determine final finish reason
 */
function extractStepData(steps: any[], finishReason: string) {
  const allToolCalls: any[] = [];
  const allToolResults: any[] = [];
  let finalFinishReason = finishReason;
  
  // Process steps to extract tool calls and results
  if (steps && steps.length > 0) {
    steps.forEach((step, index) => {
      if (step.toolCalls) {
        allToolCalls.push(...step.toolCalls);
      }
      if (step.toolResults) {
        allToolResults.push(...step.toolResults);
      }
      // Use the finish reason from the last step
      if (index === steps.length - 1 && step.finishReason) {
        finalFinishReason = step.finishReason;
      }
    });
  }

  return { allToolCalls, allToolResults, finalFinishReason };
}

/**
 * Build message parts from content array, merging tool parts with same toolCallId
 */
function buildMessageParts(content: any): any[] {
  const parts: any[] = [];
  
  if (Array.isArray(content)) {
    // content to parts
    // if has same toolCallId, merge them into one part
    // change type from tool-* to tool-<toolName>
    content.forEach((part) => {
      if (part.type === "reasoning") {
        parts.push({
          type: "reasoning",
          text: part.text,
        });
      } else if (part.type.startsWith("tool-")) {
        const toolCallId = 'toolCallId' in part ? part.toolCallId : undefined;
        const toolName = 'toolName' in part ? part.toolName : undefined;
        const toolType = toolName ? `tool-${toolName}` : part.type;
        const output = 'output' in part ? part.output : undefined;
        const state = 'state' in part ? part.state : output ? 'output-available' : 'output-error';
        const existingPart = parts.find(
          (p) => p.toolCallId === toolCallId && toolCallId !== undefined
        );
        if (existingPart) {
          existingPart.state = state;
          existingPart.errorText = 'errorText' in part ? part.errorText : undefined;
          existingPart.type = toolType;
          existingPart.toolName = toolName;
          existingPart.toolCallId = toolCallId;
          if ('output' in part) {
            existingPart.output = part.output || existingPart.output;
          }
        } else {
          parts.push({
            type: toolType,
            toolCallId: toolCallId,
            input: 'input' in part ? part.input : undefined,
            output: output,
            state: state,
            errorText: 'errorText' in part ? part.errorText : undefined
          });
        }
      } else if (part.type === "text" && part.text) {
        parts.push({
          type: "text",
          text: part.text,
        });
      } else { // other types: file, source, image, etc.
        parts.push({
          ...part
        });
      }
    });
  } else if (typeof content === "string") {
    parts.push({
      type: "text",
      text: content,
    });
  }

  return parts;
}

/**
 * Extract text content from content/parts for the main message content
 */
function extractMessageText(content: any, text: string): string {
  let messageText = "";
  if (typeof content === "string") {
    messageText = content;
  } else if (Array.isArray(content)) {
    messageText = content
      .filter(part => part.type === "text" && 'text' in part)
      .map(part => (part as any).text)
      .join("\n");
  } else if (text) {
    messageText = text;
  }
  return messageText;
}

/**
 * Handle POST requests for chat message input.
 * This function processes the chat messages, streams the response,
 * and returns a response to the client.
 * In the process, the user message and AI generated message are saved to the database.
 * @param req
 * @returns
 */
export async function POST(req: Request) {
  try {
    const data = (await req.json()) as ChatRequest;
    const {
      id,
      messages,
      conversationId,
      isMultiModelMode = false,
      selectedModels = [],
    } = data;
    
    // Fallback if message is not provided explicitly (standard useChat behavior)
    const message = data.message || (messages && messages.length > 0 ? messages[messages.length - 1] : undefined);

    const userId = (await auth())?.user?.uuid;
    if (!message || !conversationId || !userId) {
      return new Response(
        JSON.stringify({ error: "Error, missing information" }),
        { status: 400 }
      );
    }

    // Verify conversation exists and belongs to user
    const conversationExists =
      await ConversationService.checkConversationExists(conversationId, userId);

    if (!conversationExists) {
      return new Response(
        JSON.stringify({ error: "Conversation not found or access denied" }),
        { status: 404 }
      );
    }

    if (!message || message.role !== "user") {
      return new Response(
        JSON.stringify({ error: "Last message must be from user" }),
        { status: 400 }
      );
    }    
    // Save the user message to database using createMessageWithParts
    try {
      const userParts = message.parts || [
        {
          type: "text",
          text: message.content || "",
        },
      ];

      const userMessage = await MessageService.createMessageWithParts(
        conversationId,
        userId,
        "user",
        message.content || "",
        userParts,
        {}
      );

      if (!userMessage) {
        console.error("Failed to save user message to database");
        return new Response(
          JSON.stringify({ error: "Failed to save user message" }),
          { status: 500 }
        );
      }

      console.log("User message saved successfully:", userMessage.id);
    } catch (error) {
      console.error("Error saving user message:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save user message" }),
        { status: 500 }
      );
    }

    // Check if user has sufficient credits
    try {
      const userCredits = await getUserCredits(userId);
      if (userCredits.left_credits <= 0) {
        return new Response(
          JSON.stringify({
            error:
              "Insufficient credits. Please contact support to get more credits.",
            code: "INSUFFICIENT_CREDITS",
          }),
          { status: 402 } // Insufficient credits
        );
      }
      console.log(
        `User ${userId} has ${userCredits.left_credits} credits remaining`
      );
    } catch (error) {
      console.error("Error checking user credits:", error);
      return new Response(
        JSON.stringify({ error: "Failed to verify credits" }),
        { status: 500 }
      );
    }

    let effectiveSystemPrompt = SYSTEM_PROMPT_DEFAULT;
    let tools: any = {};
    let toolChoice: "auto" | "none" | "required" | { type: "tool"; toolName: string } | undefined;

    if (isMultiModelMode) {
      const toolMultipleModels = createToolMultipleModels(selectedModels);
      effectiveSystemPrompt += "\n\n[MULTI MODEL MODE]\n";
      tools = {
        multipleModels: toolMultipleModels,
      };
      toolChoice = { type: "tool", toolName: "multipleModels" };
    }

    // Filter out reasoning parts and convert tool parts to text before passing to AI model
    const filteredMessages = messages.map(msg => ({
      ...msg,
      parts: msg.parts
        .filter(part => part.type !== 'reasoning')
        .map(part => {
          // Convert tool-* parts to text parts
          if (part.type.startsWith('tool-')) {
            const toolName = part.type.replace('tool-', '');
            const input = 'input' in part ? part.input : null;
            const output = 'output' in part ? part.output : null;
            const state = 'state' in part ? part.state : 'unknown';
            
            let textContent = `Called tool ${toolName}`;
            if (input && typeof input === 'object') {
              textContent += ` with input: ${JSON.stringify(input)}`;
            }
            if (output && state === 'output-available') {
              textContent += ` and result is: ${typeof output === 'string' ? output : JSON.stringify(output)}`;
            } else if (state === 'output-error') {
              textContent += ` but encountered an error`;
            }
            
            return {
              type: 'text' as const,
              text: textContent
            };
          }
          return part;
        })
    }));

    const fastModel = await resolveModelForSlot("default_fast");
    console.log("Using model:", fastModel.name);
    const result = streamText({
      model: gateway(fastModel.name),
      system: effectiveSystemPrompt,
      messages: convertToCoreMessages(filteredMessages), // Pass filtered messages without reasoning parts
      tools,
      toolChoice,
      onError: (err: unknown) => {
        console.error("Streaming error occurred:", err);
      },
      onFinish: async ({ text, content, finishReason, response, steps, totalUsage }) => {
        try {
          // Handle credit consumption
          const costAmount = await handleCreditConsumption(
            userId,
            totalUsage,
            isMultiModelMode
          );

          // Extract tool calls and tool results from steps
          const { allToolCalls, allToolResults, finalFinishReason } = extractStepData(steps, finishReason);

          // Build message parts from content
          const parts = buildMessageParts(content);

          // Extract text content from parts for the main message content
          const messageText = extractMessageText(content, text);

          // Create additional fields for the AI message
          const aiMessageFields = {
            finish_reason: finalFinishReason || null,
            request_tokens: totalUsage?.inputTokens || 0,
            response_tokens: totalUsage?.outputTokens || 0,
            total_tokens: totalUsage?.totalTokens || 0,
            cost_amount: costAmount,
            model_provider: fastModel.provider,
            model: fastModel.model,
            message_status: "completed" as const,
          };

          // Save the AI assistant message with parts to database
          const result = await MessageService.createMessageWithParts(
            conversationId,
            userId,
            "assistant",
            messageText,
            parts,
            {
              totalUsage,
              finishReason: finalFinishReason,
              stepsCount: steps?.length || 0,
              toolCallsCount: allToolCalls.length,
              toolResultsCount: allToolResults.length,
            },
            aiMessageFields
          );

          if (result) {
            console.log("AI message saved successfully:", result.id);
          } else {
            console.error("Failed to save AI message");
          }

          // Update conversation's last_message_at timestamp
          await ConversationService.updateLastMessageAt(conversationId, userId);
        } catch (error) {
          console.error("Error in onFinish callback:", error);
        }
      },
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: true,
      sendSources: true,
      onError: (error: unknown) => {
        console.error("Error forwarded to client:", error);
        return extractErrorMessage(error);
      },
    });
  } catch (err: unknown) {
    console.error("Error in /api/chat:", err);
    const error = err as {
      code?: string;
      message?: string;
      statusCode?: number;
    };

    return createErrorResponse(error);
  }
}
