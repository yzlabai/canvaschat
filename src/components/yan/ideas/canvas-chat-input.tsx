"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PromptSuggestion } from "@/components/ui/prompt-suggestion";
import {
  PromptInput,
  PromptInputActions,
  PromptInputAction,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { List, Send, Plus, GitBranch, Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIdeas } from "@/contexts/ideas-provider";
import { IdeaCreationForm } from "@/components/yan/ideas/idea-form";
import { IdeaSessionType, StoryImageStyleValue } from "@/types/ideas";
import { toast } from "sonner";
import {
  DEFAULT_STORY_IMAGE_STYLE,
  STORY_IMAGE_STYLE_OPTIONS,
} from "./story-style-options";
import { MODE_OPTIONS } from "./idea-modes";

type ModeIconComponent = (typeof MODE_OPTIONS)[number]["icon"];

const MODE_ICON_MAP = MODE_OPTIONS.reduce(
  (acc, option) => {
    acc[option.type] = option.icon;
    return acc;
  },
  {} as Partial<Record<IdeaSessionType, ModeIconComponent>>
);

export function CanvasChatInput() {
  const {
    ideasessions,
    currentIdea,
    setCurrentIdea,
    setSelectedNode,
    selectedNode,
    flowNodes,
    switchIdeaSession,
    handleChatMessage,
    createNewIdea,
  updateIdeaSession,
    getNodeShortId,
    promptLoading,
    reactFlowInstance,
    promptValue,
    setPromptValue,
  } = useIdeas();

  const [isContextOpen, setIsContextOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createSeed, setCreateSeed] = useState("");
  const [createType, setCreateType] = useState<IdeaSessionType>("brainstorm");
  const [createStoryImageStyle, setCreateStoryImageStyle] =
    useState<StoryImageStyleValue>(DEFAULT_STORY_IMAGE_STYLE);
  const [createStoryImagePrompt, setCreateStoryImagePrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [submitable, setSubmittable] = useState(false);
  const [isNodesPopoverOpen, setIsNodesPopoverOpen] = useState(false);
  const [isIdeaSettingsOpen, setIsIdeaSettingsOpen] = useState(false);
  const [settingsStoryImageStyle, setSettingsStoryImageStyle] =
    useState<StoryImageStyleValue>(DEFAULT_STORY_IMAGE_STYLE);
  const [settingsStoryImagePrompt, setSettingsStoryImagePrompt] = useState("");
  const [isSavingIdeaSettings, setIsSavingIdeaSettings] = useState(false);

  const currentSession = ideasessions.find((s) => s.id === currentIdea);
  const currentSessionMode = useMemo(() => {
    if (!currentSession) return null;
    return MODE_OPTIONS.find((mode) => mode.type === currentSession.type) || null;
  }, [currentSession]);

  // Selected node label/title (string-safe)
  const selectedNodeData = useMemo(
    () => flowNodes.find((n) => n.id === selectedNode),
    [flowNodes, selectedNode]
  );
  const selectedNodeLabel = useMemo(() => {
    if (!selectedNode) return "Please select a node";
    return getNodeShortId(selectedNode) || "Selected node";
  }, [selectedNode, getNodeShortId]);
  const selectedNodeTitleAttr = useMemo(
    () =>
      String(
        selectedNodeData?.data?.title ??
          selectedNodeData?.data?.content ??
          (selectedNode || "")
      ),
    [selectedNodeData, selectedNode]
  );

  const canvasNodes = useMemo(() => {
    const nodesInSession = flowNodes.filter((n) => n.data?.session_id === currentIdea);

    const getDistance = (nodeId: string): number => {
      const start = flowNodes.find((n) => n.id === nodeId);
      if (!start) return Number.POSITIVE_INFINITY;
      const rd = (start as any).data?.root_distance;
      if (typeof rd === "number") return Number(rd);
      let d = 0;
      let cur: any = start;
      const guard = new Set<string>();
      while (cur?.data?.parent_node_id && !guard.has(cur.id)) {
        guard.add(cur.id);
        d++;
        cur = flowNodes.find((n) => n.id === cur.data.parent_node_id);
        if (!cur) break;
      }
      return d;
    };

    return nodesInSession
      .map((n) => ({ node: n, dist: getDistance(n.id) }))
      .sort((a, b) => a.dist - b.dist)
      .map((x) => x.node);
  }, [flowNodes, currentIdea]);

  useEffect(() => {
    if (!isIdeaSettingsOpen) return;
    if (!currentSession) {
      setSettingsStoryImagePrompt("");
      setSettingsStoryImageStyle(DEFAULT_STORY_IMAGE_STYLE);
      return;
    }

    if (currentSession.type === "story") {
      setSettingsStoryImageStyle(
        currentSession.story_image_style ?? DEFAULT_STORY_IMAGE_STYLE
      );
      setSettingsStoryImagePrompt(currentSession.story_image_prompt ?? "");
    } else {
      setSettingsStoryImagePrompt("");
      setSettingsStoryImageStyle(DEFAULT_STORY_IMAGE_STYLE);
    }
  }, [isIdeaSettingsOpen, currentSession]);

  const handleSessionSelect = useCallback(
    (sessionId: string) => {
      if (sessionId !== currentIdea) {
        switchIdeaSession(sessionId);
      }
      setIsContextOpen(false);
    },
    [currentIdea, ideasessions, setCurrentIdea, setSelectedNode]
  );

  const openCreateDialog = useCallback(() => {
    setIsContextOpen(false);
    setIsCreateDialogOpen(true);
  }, []);

  const handleCreateIdeaSubmit = useCallback(async () => {
    if (!createSeed.trim()) return;
    setIsCreating(true);
    try {
      await createNewIdea({
        description: createSeed.trim(),
        type: createType,
        storyImageStyle:
          createType === "story" ? createStoryImageStyle : undefined,
        storyImagePrompt:
          createType === "story"
            ? createStoryImagePrompt.trim() || null
            : undefined,
      });
      setCreateSeed("");
      if (createType === "story") {
        setCreateStoryImageStyle(DEFAULT_STORY_IMAGE_STYLE);
        setCreateStoryImagePrompt("");
      }
      setIsCreateDialogOpen(false);
    } catch (e) {
      console.error("Failed to create idea", e);
    } finally {
      setIsCreating(false);
    }
  }, [
    createSeed,
    createType,
    createStoryImageStyle,
    createStoryImagePrompt,
    createNewIdea,
  ]);

  const storySettingsDirty = useMemo(() => {
    if (!currentSession || currentSession.type !== "story") return false;
    const currentStyle = currentSession.story_image_style ?? DEFAULT_STORY_IMAGE_STYLE;
    const currentPrompt = currentSession.story_image_prompt ?? "";
    return (
      currentStyle !== settingsStoryImageStyle ||
      currentPrompt !== settingsStoryImagePrompt.trim()
    );
  }, [
    currentSession,
    settingsStoryImageStyle,
    settingsStoryImagePrompt,
  ]);

  const handleIdeaSettingsSave = useCallback(async () => {
    if (!currentSession) {
      setIsIdeaSettingsOpen(false);
      return;
    }

    if (currentSession.type !== "story") {
      setIsIdeaSettingsOpen(false);
      return;
    }

    if (!storySettingsDirty) {
      setIsIdeaSettingsOpen(false);
      return;
    }

    setIsSavingIdeaSettings(true);
    try {
      await updateIdeaSession(currentSession.id, {
        storyImageStyle: settingsStoryImageStyle,
        storyImagePrompt:
          settingsStoryImagePrompt.trim().length > 0
            ? settingsStoryImagePrompt.trim()
            : null,
      });
      setIsIdeaSettingsOpen(false);
    } catch (error) {
      // Error toast handled in context
    } finally {
      setIsSavingIdeaSettings(false);
    }
  }, [
    currentSession,
    storySettingsDirty,
    settingsStoryImageStyle,
    settingsStoryImagePrompt,
    updateIdeaSession,
  ]);

  const handleSubmitPrompt = useCallback(async () => {
    const content = (promptValue || "").trim();
    if (!content || !selectedNode || promptLoading) return;

    let parentNodeId: string | null = null;
    if (selectedNode) parentNodeId = selectedNode;

    const currentIdeaRoot = flowNodes.find(
      (n) =>
        n.data?.session_id === currentIdea &&
        (n.data?.root_distance === 0 || n.data?.id === n.data?.root_node_id)
    );

    if (!parentNodeId) {
      const rfSelected = flowNodes.find((n) => n.selected);
      parentNodeId =
        rfSelected?.id || currentIdeaRoot?.id || flowNodes[0]?.id || null;
    }

    if (!parentNodeId) {
      return toast.error("Please select or create a node to reply to.");
    }
    setPromptValue("");
    try {
      await handleChatMessage(content, parentNodeId);
    } catch (e) {
      toast.error("Failed to send chat message.");
    }
  }, [
    promptValue,
    selectedNode,
    flowNodes,
    currentIdea,
    handleChatMessage,
    promptLoading,
    setPromptValue,
  ]);

  // compute submitable: selected node exists and textarea has content
  useEffect(() => {
    const valid = Boolean(selectedNode) && Boolean((promptValue || "").trim());
    setSubmittable(valid);
  }, [selectedNode, promptValue]);

  return (
    <div
      className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 md:px-8 ${
        currentSession?.type === "chat" ? "w-full" : ""
      }`}
    >
      <div className="mx-auto max-w-3xl">
        {/* Context row */}
        <div className="mb-2 flex items-center gap-2">
          <PromptSuggestion
            variant="outline"
            size="lg"
            onClick={() => setIsContextOpen(true)}
            className="gap-2 shadow-lg"
          >
            <List className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {currentSession?.title || "Select Context"}
            </span>
          </PromptSuggestion>

          <PromptSuggestion
            variant="outline"
            size="lg"
            className="gap-0 p-2 shadow-lg"
            aria-label="Idea settings"
            title="Idea settings"
            onClick={() => setIsIdeaSettingsOpen(true)}
          >
            <Settings2 className="h-4 w-4" />
          </PromptSuggestion>

          {/* Quick node navigator (icon-only) */}
          <Popover open={isNodesPopoverOpen} onOpenChange={setIsNodesPopoverOpen}>
            <PopoverTrigger asChild>
              <PromptSuggestion
                variant="outline"
                size="lg"
                className="gap-0 p-2 shadow-lg"
                aria-label="Navigate nodes"
                title="Navigate nodes"
              >
                <GitBranch className="h-4 w-4" />
              </PromptSuggestion>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0 w-full">
              <Command>
                <CommandInput placeholder="Search nodes..." />
                <CommandList className="max-h-[360px]">
                  <CommandEmpty>No nodes found.</CommandEmpty>
                  <CommandGroup heading="Nodes in this session">
                    {canvasNodes.map((n) => {
                      const label = String(
                        n?.data?.title || n?.data?.content || n.id
                      );
                      const shortId = getNodeShortId(n.id) || n.id.slice(0, 6);
                      return (
                        <CommandItem
                          key={n.id}
                          value={label}
                          onSelect={() => {
                            setSelectedNode(n.id);
                            setIsNodesPopoverOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="flex h-6 w-24 items-center justify-center rounded border text-[10px]">
                              {shortId}
                            </div>
                            <span className="truncate">{label}</span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Selected node indicator */}
          {selectedNode && (
            <PromptSuggestion
              variant="outline"
              size="lg"
              className="shrink-0 overflow-hidden max-w-[50%] md:max-w-[60%] lg:max-w-[70%] shadow-lg"
              title={selectedNodeTitleAttr}
              onClick={() => {
                reactFlowInstance?.fitView({
                  nodes: [{ id: selectedNode! }],
                  padding: 1,
                  duration: 500,
                });
              }}
            >
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="truncate">Node: {selectedNodeLabel}</span>
            </PromptSuggestion>
          )}
        </div>

        <Dialog
          open={isIdeaSettingsOpen}
          onOpenChange={(open) => {
            setIsIdeaSettingsOpen(open);
            if (!open) {
              setIsSavingIdeaSettings(false);
            }
          }}
        >
          <DialogContent className="max-w-lg space-y-5">
            <DialogHeader>
              <DialogTitle>Idea settings</DialogTitle>
              <DialogDescription>
                Review idea details and customize story visuals.
              </DialogDescription>
            </DialogHeader>

            {currentSession ? (
              <div className="space-y-5">
                <div className="space-y-1 text-sm">
                  <p className="text-base font-semibold">
                    {currentSession.title || "Untitled idea"}
                  </p>
                  <p className="text-muted-foreground">
                    {(currentSessionMode?.label || currentSession.type) + " mode"}
                  </p>
                  {currentSession.description ? (
                    <p className="text-muted-foreground">
                      {currentSession.description}
                    </p>
                  ) : null}
                </div>

                {currentSession.type === "story" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Story image style
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {STORY_IMAGE_STYLE_OPTIONS.map((option) => {
                          const isActive =
                            settingsStoryImageStyle === option.value;
                          return (
                            <Button
                              key={option.value}
                              type="button"
                              size="lg"
                              variant="outline"
                              disabled={isSavingIdeaSettings}
                              onClick={() =>
                                setSettingsStoryImageStyle(option.value)
                              }
                              className={`rounded-full border px-3 py-1 text-xs transition ${
                                isActive
                                  ? "border-transparent bg-primary/10 text-primary shadow-sm"
                                  : "border-border bg-background hover:bg-muted/60"
                              }`}
                            >
                              {option.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="story-settings-prompt"
                        className="text-sm font-semibold text-muted-foreground"
                      >
                        Default image prompt
                      </label>
                      <Textarea
                        id="story-settings-prompt"
                        placeholder="Describe desired mood, motifs, or characters..."
                        value={settingsStoryImagePrompt}
                        onChange={(e) => setSettingsStoryImagePrompt(e.target.value)}
                        className="min-h-[80px] resize-none rounded-lg border border-border bg-background text-sm"
                        disabled={isSavingIdeaSettings}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        This prompt guides automatic art generation for this story session.
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-1 text-xs text-muted-foreground">
                  <span>Status: {currentSession.status}</span>
                  <span>
                    Nodes: {currentSession.total_idea_nodes ?? 0}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No idea session selected.
              </p>
            )}

            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                size="lg"
                variant="ghost"
                onClick={() => setIsIdeaSettingsOpen(false)}
                disabled={isSavingIdeaSettings}
              >
                Close
              </Button>
              {currentSession?.type === "story" ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={handleIdeaSettingsSave}
                  disabled={isSavingIdeaSettings || !storySettingsDirty}
                >
                  {isSavingIdeaSettings ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  ) : (
                    "Save changes"
                  )}
                </Button>
              ) : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Context Select Dialog */}
        <Dialog open={isContextOpen} onOpenChange={setIsContextOpen}>
          <DialogContent className="p-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Select Context</DialogTitle>
              <DialogDescription>Choose an idea session</DialogDescription>
            </DialogHeader>
            <Command className="border-none">
              <CommandInput placeholder="Search idea sessions..." />
              <CommandList className="max-h-[420px] min-h-[260px]">
                <CommandEmpty>No sessions found.</CommandEmpty>
                <CommandGroup heading="All your ideas and root nodes">
                  {/* Create new session entry */}
                  <CommandItem
                    value="__create_new_session__"
                    onSelect={openCreateDialog}
                    className="cursor-pointer text-green-600"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded border text-xs">
                        <Plus className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <span className="truncate">Create new idea session</span>
                    </div>
                  </CommandItem>

                  {ideasessions.map((idea) => {
                    const ideaType = idea?.type as IdeaSessionType | undefined;
                    const IdeaIcon = ideaType ? MODE_ICON_MAP[ideaType] : undefined;
                    const fallbackInitial =
                      idea.title?.slice(0, 1).toUpperCase() ||
                      ideaType?.slice(0, 1).toUpperCase() ||
                      "I";

                    return (
                      <CommandItem
                        key={idea.id}
                        value={idea.title || idea.id}
                        onSelect={() => handleSessionSelect(idea.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded border text-xs">
                            {IdeaIcon ? (
                              <IdeaIcon className="h-4 w-4" />
                            ) : (
                              fallbackInitial
                            )}
                          </div>
                          <span className="truncate">
                            {idea.title || "Untitled idea"}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </DialogContent>
        </Dialog>

        {/* Create Idea Session Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create a new idea session</DialogTitle>
            </DialogHeader>
            <IdeaCreationForm
              variant="dialog"
              seedIdea={createSeed}
              setSeedIdea={setCreateSeed}
              ideaType={createType}
              setIdeaType={setCreateType}
              isCreating={isCreating}
              onSubmit={handleCreateIdeaSubmit}
              storyImageStyle={createStoryImageStyle}
              setStoryImageStyle={setCreateStoryImageStyle}
              storyImagePrompt={createStoryImagePrompt}
              setStoryImagePrompt={setCreateStoryImagePrompt}
            />
          </DialogContent>
        </Dialog>

        {/* Prompt Input */}
        {currentSession?.type === "chat" && (
          <PromptInput
            className="bg-white/90 backdrop-blur border border-gray-200 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:shadow-2xl"
            value={promptValue}
            onValueChange={setPromptValue}
            onSubmit={handleSubmitPrompt}
          >
            <div className="flex flex-col gap-2">
              <PromptInputTextarea
                className="w-full focus:outline-none caret-blue-600"
                placeholder="Describe your next idea… Press Enter to send"
                aria-label="Idea message"
              />
              <PromptInputActions className="ml-auto">
                <PromptInputAction tooltip="Send (Enter)" side="top">
                  <Button
                    size="icon"
                    variant="default"
                    onClick={handleSubmitPrompt}
                    className="h-9 w-9"
                    disabled={!submitable || promptLoading}
                  >
                    {promptLoading ? (
                      // simple spinner using tailwind
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </PromptInputAction>
              </PromptInputActions>
            </div>
          </PromptInput>
        )}
      </div>
    </div>
  );
}
