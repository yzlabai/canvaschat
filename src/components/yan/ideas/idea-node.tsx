"use client";

import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  Wand2,
  Plus,
  Check,
  X,
  Sparkles,
  Edit3,
  Save,
} from "lucide-react";
import { IdeaNode } from "@/types/ideas";
import { useIdeas } from "@/contexts/ideas-provider";
import { Handle, NodeToolbar, Position } from "@xyflow/react";
import { memo, useState, useEffect, useCallback, useContext } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

interface IdeaNodeComponentProps {
  node: IdeaNode; //TODO fix type
  isSelected: boolean;
  onSelect?: (id: string) => void;
  isConnectable?: boolean;
  readOnly?: boolean;
}

export default memo(
  ({
    node,
    isSelected,
    onSelect,
    isConnectable,
    readOnly = false,
  }: IdeaNodeComponentProps) => {
    const ideasContext = readOnly ? undefined : useIdeas();

    const acceptAISuggestion = ideasContext?.acceptAISuggestion;
    const rejectAISuggestion = ideasContext?.rejectAISuggestion;
    const handleAddChildNode = ideasContext?.handleAddChildNode;
    const updateNodeTitle = ideasContext?.updateNodeTitle;
    const updateNodeContent = ideasContext?.updateNodeContent;
    const generateAIChildSuggestions = ideasContext?.generateAIChildSuggestions;

    const canEdit = Boolean(ideasContext) && !readOnly;

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingContent, setIsEditingContent] = useState(false);
    const [editTitle, setEditTitle] = useState(node.title || "");
    const [editContent, setEditContent] = useState(node.content || "");
    const [isGenerating, setIsGenerating] = useState(false);

    // Update local state when node prop changes
    useEffect(() => {
      setEditTitle(node.title || "");
      setEditContent(node.content || "");
    }, [node.title, node.content]);

    useEffect(() => {
      if (!canEdit) {
        setIsEditingTitle(false);
        setIsEditingContent(false);
      }
    }, [canEdit]);

    const handleSaveTitle = async () => {
      if (!canEdit || !updateNodeTitle) {
        setIsEditingTitle(false);
        setEditTitle(node.title || "");
        return;
      }

      if (editTitle.trim() !== node.title) {
        await updateNodeTitle(node.id, editTitle.trim());
      }
      setIsEditingTitle(false);
    };

    const handleSaveContent = async () => {
      if (!canEdit || !updateNodeContent) {
        setIsEditingContent(false);
        setEditContent(node.content || "");
        return;
      }

      if (editContent !== node.content) {
        await updateNodeContent(node.id, editContent);
      }
      setIsEditingContent(false);
    };

    const handleCancelEdit = () => {
      setEditTitle(node.title || "");
      setEditContent(node.content || "");
      setIsEditingTitle(false);
      setIsEditingContent(false);
    };

    const handleAcceptAISuggestion = useCallback(
      async (nodeId: string) => {
        if (!canEdit || !acceptAISuggestion) {
          return;
        }
        setIsGenerating(true);
        await acceptAISuggestion(nodeId);
        setIsGenerating(false);
      },
      [acceptAISuggestion, canEdit]
    );

    const handleGenerateAISuggestions = useCallback(
      async (nodeId: string) => {
        if (!canEdit || !generateAIChildSuggestions) {
          return;
        }
        if (!nodeId) {
          toast.error("Please select a node first");
          return;
        }
        setIsGenerating(true);
        try {
          await generateAIChildSuggestions(nodeId);
          toast.success("AI suggestions generated!");
        } catch (error) {
          console.error("Failed to generate AI suggestions:", error);
          toast.error("Failed to generate AI suggestions");
        } finally {
          setIsGenerating(false);
        }
      },
      [generateAIChildSuggestions, canEdit]
    );

    const getIcon = () => {
      return <Lightbulb className="h-6 w-6 text-blue-600" />;
    };

    const isAISuggestion =
      node.created_by === "ai" &&
      (node.status === "suggest" || node.status === "generating");
    const isAIRejected = node.created_by === "ai" && node.status === "reject";
    const isAIAccepted = node.created_by === "ai" && node.status === "accept";
    const isUserCreated = node.created_by === "user";

    const statusBadge = () => {
      const base =
        "px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide border";
      if (node.status === "suggest") {
        return (
          <span
            className={`${base} bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1`}
          >
            {" "}
            <Sparkles className="h-3 w-3" /> Suggestion
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
      if (!canEdit) {
        return null;
      }

      // Don't show actions for rejected AI suggestions
      if (isAIRejected) {
        return null;
      }

      return (
        <div className="flex flex-wrap gap-1">
          {isAISuggestion && (
            <>
              <Button
                variant="secondary"
                size="lg"
                className="text-[11px] px-2 leading-none bg-green-500/10 hover:bg-green-500/20 text-green-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcceptAISuggestion(node.id);
                }}
              >
                <Check className="h-3 w-3 mr-1" /> Accept
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="text-[11px] px-2 leading-none bg-red-500/10 hover:bg-red-500/20 text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  rejectAISuggestion?.(node.id);
                }}
              >
                <X className="h-3 w-3 mr-1" /> Reject
              </Button>
            </>
          )}
        </div>
      );
    };

    return (
      <>
        <NodeToolbar
          isVisible={(isSelected || isGenerating) && canEdit}
          position={Position.Bottom}
          className="flex gap-1 bg-white/90 backdrop-blur border border-gray-200 shadow-lg rounded-md p-1 z-10"
        >
          {isGenerating ? (
            <Button
              variant="outline"
              size="lg"
              aria-label="AI suggestions"
              title="AI suggestions"
              onClick={() => {
                handleGenerateAISuggestions(node.id);
              }}
              disabled={isGenerating}
            >
              <Wand2 className="h-4 w-4 animate-spin" /> Generating AI
              suggestions...
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="lg"
                aria-label="AI suggestions"
                title="AI suggestions"
                onClick={() => {
                  handleGenerateAISuggestions(node.id);
                }}
                disabled={isGenerating}
              >
                <Wand2 className="h-4 w-4" />
                AI suggestions
              </Button>
              <Button
                variant="outline"
                size="lg"
                aria-label="Add child node"
                title="Add child node"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddChildNode?.(node.id);
                }}
              >
                <Plus className="h-4 w-4" />
                Add child
              </Button>
            </>
          )}
        </NodeToolbar>
        <div className="relative group">
          <div
            className={`p-2 rounded-lg border-2 cursor-move hover:shadow-lg transition-all duration-200 bg-white/80 backdrop-blur ${
              isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
            } ${isAISuggestion ? "border-dashed" : ""} ${
              isAIRejected ? "opacity-50 bg-gray-50/80 border-gray-200" : ""
            } ${isAIAccepted ? "border-green-300 bg-green-50/80" : ""}`}
            style={{
              width: isEditingTitle || isEditingContent ? 340 : 260,
              transition: "width 0.2s ease-in-out",
            }}
            onClick={() => onSelect?.(node.id)}
          >
            {/* Header */}
            <div className="flex items-start gap-2 border-b pb-1">
              <div
                className={`flex-shrink-0 mt-0.5 ${isAIRejected ? "opacity-50" : ""}`}
              >
                {getIcon()}
              </div>
              <div className="flex-1">
                {isEditingTitle && canEdit ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 text-base font-semibold leading-snug bg-transparent border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTitle();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={handleSaveTitle}
                    >
                      <Save className="h-3 w-3 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-3 w-3 text-gray-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 group">
                    <h3
                      className={`text-base font-semibold leading-snug break-words flex-1 ${
                        isAIRejected ? "text-gray-500" : ""
                      }`}
                    >
                      {node.title}
                    </h3>
                    {isUserCreated && canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingTitle(true);
                        }}
                      >
                        <Edit3 className="h-3 w-3 text-gray-600" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-1 mt-1">
              {statusBadge()}
            </div>
            {/* Markdown content */}
            {node.content || (isUserCreated && canEdit && !isEditingContent) ? (
              <div className="mt-1">
                {isEditingContent && canEdit ? (
                  <div className="space-y-1">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full text-[12px] bg-transparent border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 resize-none"
                      rows={12}
                      placeholder="Add content..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.ctrlKey) handleSaveContent();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] px-2"
                        onClick={handleSaveContent}
                      >
                        <Save className="h-3 w-3 mr-1 text-green-600" /> Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] px-2"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-3 w-3 mr-1 text-gray-600" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : node.content ? (
                  <div className="group relative">
                    <div
                      className={`text-[12px] prose prose-xs max-w-none dark:prose-invert ${
                        isAIRejected ? "text-gray-500" : ""
                      }`}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
                        {node.content}
                      </ReactMarkdown>
                    </div>
                    {isUserCreated && canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingContent(true);
                        }}
                      >
                        <Edit3 className="h-3 w-3 text-gray-600" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="group">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] px-2 text-gray-500 hover:text-gray-700 opacity-60 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingContent(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add content
                    </Button>
                  </div>
                )}
              </div>
            ) : null}

            {/* Actions */}
            {!isAIRejected && canEdit && (
              <div className="mt-2 block">{renderActions()}</div>
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
