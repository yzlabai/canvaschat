"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Image, Video, Plus, Loader2 } from "lucide-react";
import { useIdeas } from "@/contexts/ideas-provider";
import { useState, useCallback } from "react";
import { NodeType } from "@/types/ideas";

export function AddNodeDialog() {
  const {
    isAddNodeDialogOpen,
    parentNodeId,
    handleCreateNode,
    handleDialogClose,
  } = useIdeas();

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<NodeType>("text");
  const [newNodeContent, setNewNodeContent] = useState("");

  const onCreate = useCallback(async () => {
    if (!newNodeContent.trim() || !parentNodeId) return;
    setIsCreating(true);
    try {
      console.log("Creating node with:", {
        title,
        content: newNodeContent,
        type,
        parentNodeId,
      });
      await handleCreateNode({
        title,
        content: newNodeContent,
        type,
        parentNodeId: parentNodeId ?? undefined,
      });
    } finally {
      setIsCreating(false);
    }
  }, [title, newNodeContent, type, handleCreateNode, parentNodeId]);

  return (
    <Dialog open={isAddNodeDialogOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Node</DialogTitle>
          <DialogDescription>
            Create a new node, based on your idea, image, or video.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="node-type" className="text-sm font-medium">
              Node Type
            </label>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant={type === "text" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("text")}
                disabled={isCreating}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" /> Text
              </Button>
              <Button
                type="button"
                variant={type === "image" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("image")}
                disabled={isCreating}
                className="flex items-center gap-2"
              >
                <Image className="h-4 w-4" /> Image
              </Button>
              <Button
                type="button"
                variant={type === "video" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("video")}
                disabled={isCreating}
                className="flex items-center gap-2"
              >
                <Video className="h-4 w-4" /> Video
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <label htmlFor="node-content" className="text-sm font-medium">
              Prompt
            </label>
            <Textarea
              id="node-content"
              placeholder="Enter your prompt for AI to generate content..."
              value={newNodeContent}
              onChange={(e) => setNewNodeContent(e.target.value)}
              className="min-h-[90px]"
              disabled={isCreating}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleDialogClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={onCreate}
            disabled={!newNodeContent.trim() || isCreating}
            className="flex items-center gap-2"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isCreating ? "Creating..." : "Create Node"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
