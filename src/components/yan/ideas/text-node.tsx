"use client";

import { Button } from "@/components/ui/button";
import {
  Plus,
  Save,
  X,
  Wand2,
} from "lucide-react";
import { IdeaNode } from "@/types/ideas";
import { useIdeas } from "@/contexts/ideas-provider";
import { Handle, NodeToolbar, Position } from "@xyflow/react";
import { memo, useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

interface TextNodeComponentProps {
  node: IdeaNode;
  isSelected: boolean;
  onSelect?: (id: string) => void;
  isConnectable?: boolean;
  readOnly?: boolean;
}

const TextNode = memo(
  ({ node, isSelected, onSelect, isConnectable, readOnly = false }: TextNodeComponentProps) => {
    const ideasContext = readOnly ? undefined : useIdeas();
    const {
      handleAddChildNode,
      updateNodeContent,
      generateTextContent,
    } = ideasContext || {};

    const [isEditingContent, setIsEditingContent] = useState(false);
    const [editContent, setEditContent] = useState(node.content || "");
    const [isGenerating, setIsGenerating] = useState(false);

    // Update local state when node prop changes
    useEffect(() => {
      setEditContent(node.content || "");
    }, [node.content]);

    const handleSaveContent = useCallback(async () => {
      if (!updateNodeContent) return;
      if (editContent.trim() !== node.content) {
        await updateNodeContent(node.id, editContent.trim());
        toast.success("Content updated");
      }
      setIsEditingContent(false);
    }, [editContent, node.id, node.content, updateNodeContent]);

    const handleCancelEdit = useCallback(() => {
      setEditContent(node.content || "");
      setIsEditingContent(false);
    }, [node.content]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
          handleCancelEdit();
        }
      },
      [handleCancelEdit]
    );

    const handleGenerateContent = useCallback(async () => {
      if (!generateTextContent) return;
      setIsGenerating(true);
      try {
        await generateTextContent(node.id);
      } finally {
        setIsGenerating(false);
      }
    }, [generateTextContent, node.id]);

    return (
      <div
        className={`relative bg-card border-2 rounded-lg shadow-lg transition-all ${
          isSelected
            ? "border-primary ring-2 ring-primary/20"
            : "border-border hover:border-primary/50"
        }`}
        style={{ minWidth: 320, maxWidth: 480 }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(node.id);
        }}
      >
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="!bg-primary !w-3 !h-3 !border-2 !border-background"
        />

        <NodeToolbar
          isVisible={isSelected}
          position={Position.Top}
          className="flex gap-1"
        >
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleGenerateContent();
            }}
            disabled={isGenerating}
            className="flex items-center gap-1"
          >
            {isGenerating ? (
              <Wand2 className="h-3 w-3 animate-spin" />
            ) : (
              <Wand2 className="h-3 w-3" />
            )}
            <span className="text-xs">
              {isGenerating ? "Generating..." : "AI Generate"}
            </span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleAddChildNode?.(node.id);
            }}
            className="flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            <span className="text-xs">Add Child</span>
          </Button>
        </NodeToolbar>

        {/* Node Content */}
        <div className="p-4 min-h-[100px]">
          {isEditingContent ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px] resize-y"
                placeholder="Enter text content..."
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelEdit();
                  }}
                  className="h-7"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveContent();
                  }}
                  className="h-7"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="group cursor-text"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingContent(true);
              }}
            >
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {node.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {node.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground text-xs italic">
                    Click to add content...
                  </p>
                )}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                <Button size="sm" variant="ghost" className="h-6 text-xs">
                  Click to edit
                </Button>
              </div>
            </div>
          )}
        </div>

        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className="!bg-primary !w-3 !h-3 !border-2 !border-background"
        />
      </div>
    );
  }
);

TextNode.displayName = "TextNode";

export default TextNode;
