"use client";

import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  MessageCircle,
  Target,
  Brain,
  Wand2,
  Plus,
  FileText,
  Crown,
  Check,
  X,
  Play,
  Pause,
  FlagTriangleRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { IdeaNode } from "@/types/ideas";
import { useIdeas } from "@/contexts/ideas-provider";
import { Handle, NodeToolbar, Position } from "@xyflow/react";
import { memo, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { useShareIdea } from "@/contexts/share-idea-provider";

interface IdeaNodeComponentProps {
  node: IdeaNode; //TODO fix type
  isSelected: boolean;
  onSelect?: (id: string) => void;
  isConnectable?: boolean;
  readOnly?: boolean;
}

export default memo(
  ({ node, isSelected, onSelect, isConnectable, readOnly = false }: IdeaNodeComponentProps) => {
    const chooseStoryPath = readOnly ? () => {} : useIdeas()?.chooseStoryPath;
    const markStoryAlternative = readOnly ? () => {} : useIdeas()?.markStoryAlternative;

    const [isLoading, setIsLoading] = useState(false);

    const handleChooseStoryPath = readOnly ? () => {} : useCallback(
      async (nodeId: string) => {
        setIsLoading(true);
        try {
          await chooseStoryPath(nodeId);
        } catch (error) {
          console.error("Failed to choose story path:", error);
          toast.error("Failed to choose story path");
        } finally {
          setIsLoading(false);
        }
      },
      [chooseStoryPath]
    );

    const handleMarkStoryAlternative = readOnly ? () => {} : useCallback(
      async (nodeId: string) => {
        setIsLoading(true);
        try {
          await markStoryAlternative(nodeId);
        } catch (error) {
          console.error("Failed to mark story alternative:", error);
          toast.error("Failed to mark story alternative");
        } finally {
          setIsLoading(false);
        }
      },
      [markStoryAlternative]
    );

    const getIcon = () => {
      return <Target className="h-6 w-6 text-green-600" />;
    };

    const isRejected = node.status === "reject";
    const isChosen = node.status === "accept";
    const isSuggesting = node.status === "suggest";

    const statusBadge = () => {
      const base =
        "px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide border";
      if (node.status === "suggest") {
        return (
          <span
            className={`${base} bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1`}
          >
            {" "}
            <Sparkles className="h-3 w-3" />
          </span>
        );
      }
      if (node.status === "generating") {
        return (
          <span
            className={`${base} bg-purple-50 text-purple-700 border-purple-200 animate-pulse`}
          >
            Generating...
          </span>
        );
      }
      if (node.status === "accept") {
        return (
          <span
            className={`${base} bg-green-50 text-green-700 border-green-200 flex items-center gap-1`}
          >
            <Check className="h-3 w-3" /> Accepted
          </span>
        );
      }
      if (node.status === "reject") {
        return (
          <span
            className={`${base} bg-gray-50 text-gray-500 border-gray-200 flex items-center gap-1`}
          >
            <X className="h-3 w-3" /> Rejected
          </span>
        );
      }
      return null;
    };

    const renderActions = () => {
      // Don't show actions for rejected AI suggestions
      if (isRejected) {
        return null;
      }
      return (
        <div className="flex flex-wrap gap-1">
          <Button
            variant="secondary"
            size="lg"
            className="text-[11px] px-2 leading-none bg-green-500/10 hover:bg-green-500/20 text-green-700"
            onClick={(e) => {
              e.stopPropagation();
              handleChooseStoryPath(node.id);
            }}
            disabled={isLoading}
          >
            <FlagTriangleRight className="h-3 w-3 mr-1" /> Choose
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="text-[11px] px-2 leading-none"
            onClick={(e) => {
              e.stopPropagation();
              handleMarkStoryAlternative(node.id);
            }}
            disabled={isLoading}
          >
            <X className="h-3 w-3 mr-1" />
          </Button>
        </div>
      );
    };

    return (
      <>
        <div className="relative group">
          <div
            className={`p-2 rounded-lg border-2 cursor-move hover:shadow-lg transition-all duration-200 bg-white/80 backdrop-blur 
              ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""}  
              ${isRejected ? "opacity-50 bg-gray-50/80 border-gray-200" : ""} 
              ${isChosen ? "border-green-300 bg-green-50/80" : ""}`}
            style={{
              width: 260,
            }}
            onClick={() => onSelect?.(node.id)}
          >
            {/* Header */}
            <div className="flex items-start gap-2 border-b pb-1">
              <div
                className={`flex-shrink-0 mt-0.5 ${isRejected ? "opacity-50" : ""}`}
              >
                {getIcon()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1 group">
                  <h3
                    className={`text-base font-semibold leading-snug break-words flex-1 ${
                      isRejected ? "text-gray-500" : ""
                    }`}
                  >
                    {node.title}
                  </h3>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-1 mt-1">
              {statusBadge()}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Choice
              </span>
            </div>
            {/* Markdown content */}
            {node.content ? (
              <div className="mt-1">
                <div className="group relative">
                  <div
                    className={`text-[12px] prose prose-xs max-w-none dark:prose-invert ${
                      isRejected ? "text-gray-500" : ""
                    }`}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
                      {node.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Actions */}
            {isSuggesting && (
              <div className="mt-2 block">{renderActions()}</div>
            )}
            {isLoading && (
              <div className="flex flex-wrap gap-1">
                <Button
                  variant="secondary"
                  size="lg"
                  className="text-[11px] px-2 leading-none bg-gray-100 text-gray-500"
                  disabled
                >
                  <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                  Loading...
                </Button>
              </div>
            )}
          </div>
        </div>
        <Handle
          type="target"
          position={Position.Left}
          onConnect={(params) => console.log("handle onConnect", params)}
          isConnectable={isConnectable}
        />
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
        />
      </>
    );
  }
);
