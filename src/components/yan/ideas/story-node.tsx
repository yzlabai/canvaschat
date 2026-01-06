"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_STORY_IMAGE_STYLE,
  STORY_IMAGE_STYLE_OPTIONS,
} from "./story-style-options";
import type { StoryImageStyleValue } from "./story-style-options";
import {
  Wand2,
  Plus,
  Check,
  X,
  BookOpen,
  Sparkles,
  Image,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Clapperboard,
  RotateCcw,
  Trash2,
  Loader2,
} from "lucide-react";
import { IdeaNode } from "@/types/ideas";
import { useIdeas } from "@/contexts/ideas-provider";
import { useShareIdea } from "@/contexts/share-idea-provider";
import { Handle, NodeToolbar, Position } from "@xyflow/react";
import { memo, useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface IdeaNodeComponentProps {
  node: IdeaNode;
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
    const { updateNodeImageData, hasChildren } = readOnly
      ? useShareIdea()
      : useIdeas();
    const handleGenerateStoryAction = readOnly
      ? undefined
      : useIdeas()?.handleGenerateStoryAction;
    console.log("Rendering StoryNode:", node.id, node.title);

    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isLoadingMedia, setIsLoadingMedia] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

    // Media gallery state
    const [mediaItems, setMediaItems] = useState(() => {
      try {
        const metadata =
          typeof node.metadata === "string"
            ? JSON.parse(node.metadata)
            : node.metadata;
        return metadata?.mediaItems || [];
      } catch {
        return [];
      }
    });
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [isImagePopoverOpen, setIsImagePopoverOpen] = useState(false);
    const [imagePrompt, setImagePrompt] = useState("");
    const [imageStyle, setImageStyle] = useState<StoryImageStyleValue>(
      DEFAULT_STORY_IMAGE_STYLE
    );
  const [generationMode, setGenerationMode] = useState<"image" | "video">("image");
    const [videoPrompt, setVideoPrompt] = useState("");
    const [videoStyle, setVideoStyle] = useState<StoryImageStyleValue>(
      DEFAULT_STORY_IMAGE_STYLE
    );
    const [videoMode, setVideoMode] = useState<"text-to-video" | "image-to-video">(
      "text-to-video"
    );
    const [useCurrentImageAsReference, setUseCurrentImageAsReference] =
      useState(false);
    const [refreshingMediaId, setRefreshingMediaId] = useState<string | null>(null);
    const [removingMediaId, setRemovingMediaId] = useState<string | null>(null);
    const videoPollingRef = useRef<
      Map<string, { cancelled: boolean; timeout?: ReturnType<typeof setTimeout> }>
    >(new Map());

    const isRootNode = node.category === "root";
    const hasChildrenMemo = useMemo(
      () => hasChildren(node.id),
      [hasChildren, node]
    );

    // Update local state when node prop changes
    useEffect(() => {
      try {
        const metadata =
          typeof node.metadata === "string"
            ? JSON.parse(node.metadata)
            : node.metadata;
        setMediaItems(metadata?.mediaItems || []);
      } catch {
        setMediaItems([]);
      }
    }, [node.metadata]);

    useEffect(() => {
      if (!isImagePopoverOpen) {
        setImagePrompt("");
        setVideoPrompt("");
        setVideoStyle(DEFAULT_STORY_IMAGE_STYLE);
        setVideoMode("text-to-video");
        setUseCurrentImageAsReference(false);
        setGenerationMode("image");
      }
    }, [isImagePopoverOpen]);

    const fetchNodeMedia = useCallback(
      async (focusMediaId?: string) => {
        if (!node.id) {
          return;
        }
        setIsLoadingMedia(true);
        try {
          const response = await fetch(
            `/api/yan/ideas/media?nodeId=${node.id}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch node media");
          }

          const payload = await response.json();
          const rawItems = Array.isArray(payload.mediaItems)
            ? payload.mediaItems
            : Array.isArray(payload.medias)
              ? payload.medias
              : [];

          const normalizedItems = rawItems
            .map((item: any) => {
              if (!item) {
                return null;
              }

              const rawStatus = (item.generationStatus || item.generation_status || "")
                .toString()
                .toLowerCase();
              const hasSignedUrl = typeof item.url === "string" && item.url.length > 0;
              let generationStatus = rawStatus;

              if (!generationStatus) {
                generationStatus = hasSignedUrl ? "generated" : "queued";
              } else if (
                (generationStatus === "queued" || generationStatus === "generating") &&
                hasSignedUrl
              ) {
                // Legacy records might have generated media but stale status
                generationStatus = "generated";
              }

              const storagePath =
                item.storagePath || item.storage_path || item.media_url || item.mediaUrl || null;

              if (!storagePath) {
                return null;
              }

              const id =
                item.id ||
                item.media_id ||
                crypto.randomUUID?.() ||
                `${storagePath}-${Date.now()}`;

              return {
                id,
                url: hasSignedUrl ? item.url : null,
                type: item.type || item.media_type || "image",
                title: item.title || `Media for ${node.title ?? "story node"}`,
                description: item.description,
                isPrimary: item.isPrimary ?? item.is_primary ?? false,
                storagePath,
                generationStatus,
                errorMessage: item.error || item.errorMessage || item.error_message,
                thumbnailUrl: item.thumbnailUrl || item.thumbnail_url,
                duration: item.duration,
                width: item.width,
                height: item.height,
                mimeType: item.mimeType || item.mime_type,
                format: item.format,
              };
            })
            .filter((item: any): item is Record<string, any> => Boolean(item));

          setMediaItems(normalizedItems as any[]);

          if (normalizedItems.length > 0) {
            const primaryIndex = normalizedItems.findIndex(
              (item: any) => item?.isPrimary
            );
            const focusIndex = focusMediaId
              ? normalizedItems.findIndex(
                  (item: any) =>
                    item?.id === focusMediaId ||
                    item?.storagePath === focusMediaId
                )
              : -1;
            const nextIndex =
              focusIndex >= 0
                ? focusIndex
                : primaryIndex >= 0
                  ? primaryIndex
                  : 0;
            setCurrentMediaIndex(nextIndex);
          } else {
            setCurrentMediaIndex(0);
          }
        } catch (error) {
          console.error("Failed to load story node media:", error);
        } finally {
          setIsLoadingMedia(false);
        }
      },
      [node.id, node.title]
    );

    useEffect(() => {
      fetchNodeMedia(node.primary_media_id);
    }, [fetchNodeMedia, node.primary_media_id]);

    const isImageBusy = isGeneratingImage || isLoadingMedia;
    const isVideoBusy = isGeneratingVideo;
    const hasPendingGeneration = useMemo(
      () =>
        mediaItems.some((item: any) => {
          const status = (item?.generationStatus || "").toString().toLowerCase();
          return status === "queued" || status === "generating";
        }),
      [mediaItems]
    );
    const isGenerationBusy = isImageBusy || isVideoBusy || hasPendingGeneration;

    const currentImageUrl = useMemo(() => {
      const media = mediaItems[currentMediaIndex];
      if (media && media.type === "image" && typeof media.url === "string") {
        return media.url;
      }
      return undefined;
    }, [mediaItems, currentMediaIndex]);

    const hasImageReference = useMemo(
      () => mediaItems.some((item: any) => item?.type === "image"),
      [mediaItems]
    );

    useEffect(() => {
      if (videoMode === "image-to-video" && !hasImageReference) {
        setVideoMode("text-to-video");
      }
    }, [videoMode, hasImageReference]);

    useEffect(() => {
      if (!hasImageReference) {
        setUseCurrentImageAsReference(false);
      }
    }, [hasImageReference]);

    useEffect(() => {
      return () => {
        videoPollingRef.current.forEach((controller) => {
          controller.cancelled = true;
          if (controller.timeout) {
            clearTimeout(controller.timeout);
          }
        });
        videoPollingRef.current.clear();
      };
    }, []);

    const handleGenerateImage = useCallback(
      async (
        nodeId: string,
        options?: { prompt?: string; style?: string }
      ): Promise<boolean> => {
        if (!nodeId || readOnly || !updateNodeImageData || hasPendingGeneration) {
          return false;
        }

        setIsGeneratingImage(true);
        let success = false;
        try {
          const response = await fetch(`/api/yan/ideas/gen/image`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              node_id: nodeId,
              prompt: options?.prompt,
              style: options?.style,
            }),
          });

          if (!response.ok) {
            const rawError = await response.text();
            let errorMessage = "Failed to generate image";
            if (rawError) {
              try {
                const parsed = JSON.parse(rawError);
                if (parsed && typeof parsed === "object" && parsed.error) {
                  errorMessage = String(parsed.error);
                } else {
                  errorMessage = rawError;
                }
              } catch {
                errorMessage = rawError;
              }
            }
            throw new Error(errorMessage);
          }

          const result = await response.json();

          updateNodeImageData(nodeId, {
            has_images: true,
            primary_media_id: result.media_id,
            media_count: result.isExisting
              ? node.media_count || 1
              : (node.media_count || 0) + 1,
            primary_image_url: result.image,
          });
          success = true;
          await fetchNodeMedia(result.media_id || result.storage_path);
        } catch (error) {
          console.error("Failed to generate image:", error);
          const message =
            error instanceof Error && error.message
              ? error.message
              : "Failed to generate image";
          toast.error(message);
        } finally {
          setIsGeneratingImage(false);
        }
        return success;
      },
  [readOnly, updateNodeImageData, node.media_count, fetchNodeMedia, hasPendingGeneration]
    );

    const startVideoPolling = useCallback(
      (mediaId: string, pollUrl?: string) => {
        if (!mediaId || !pollUrl) {
          return;
        }

        if (videoPollingRef.current.has(mediaId)) {
          return;
        }

        const controller: {
          cancelled: boolean;
          timeout?: ReturnType<typeof setTimeout>;
        } = {
          cancelled: false,
          timeout: undefined,
        };

        videoPollingRef.current.set(mediaId, controller);

        const poll = async () => {
          if (controller.cancelled) {
            return;
          }

          try {
            const resolvedUrl =
              pollUrl.startsWith("http") || pollUrl.startsWith("//")
                ? pollUrl
                : typeof window !== "undefined"
                  ? `${window.location.origin}${pollUrl}`
                  : pollUrl;

            const response = await fetch(resolvedUrl, {
              cache: "no-store",
            });

            if (!response.ok) {
              throw new Error(`Failed to poll video status: ${response.status}`);
            }

            const data = await response.json();
            if (controller.cancelled) {
              return;
            }

            const status = (data?.status || "").toString().toLowerCase();

            if (status === "generated") {
              await fetchNodeMedia(data?.media_id || mediaId);
              toast.success("Video is ready to view");

              if (controller.timeout) {
                clearTimeout(controller.timeout);
              }

              controller.cancelled = true;
              videoPollingRef.current.delete(mediaId);
              return;
            }

            if (status === "failed") {
              toast.error(data?.error || "Video generation failed");
              await fetchNodeMedia(mediaId);

              if (controller.timeout) {
                clearTimeout(controller.timeout);
              }

              controller.cancelled = true;
              videoPollingRef.current.delete(mediaId);
              return;
            }
          } catch (error) {
            console.error("Failed to poll video generation status", error);
          }

          if (!controller.cancelled) {
            controller.timeout = setTimeout(poll, 5000);
          }
        };

        poll();
      },
      [fetchNodeMedia]
    );

    const handleRefreshMediaStatus = useCallback(
      async (mediaId: string, mediaType?: string | null) => {
        if (!mediaId) {
          return;
        }

        setRefreshingMediaId(mediaId);

        const resetTracking = () => {
          setRefreshingMediaId((prev) => (prev === mediaId ? null : prev));
        };

        try {
          if (mediaType === "video") {
            const existingController = videoPollingRef.current.get(mediaId);
            if (existingController) {
              existingController.cancelled = true;
              if (existingController.timeout) {
                clearTimeout(existingController.timeout);
              }
              videoPollingRef.current.delete(mediaId);
            }

            const response = await fetch(`/api/yan/ideas/gen/video?media_id=${mediaId}`, {
              cache: "no-store",
            });

            if (!response.ok) {
              const raw = await response.text();
              let message = "Failed to refresh media status";
              if (raw) {
                try {
                  const parsed = JSON.parse(raw);
                  if (parsed?.error) {
                    message = String(parsed.error);
                  } else {
                    message = raw;
                  }
                } catch {
                  message = raw;
                }
              }
              throw new Error(message);
            }

            const data = await response.json();
            const status = (data?.status || "").toString().toLowerCase();

            if (status === "generated") {
              toast.success("Media is ready to view");
            } else if (status === "failed") {
              const errorMessage =
                data?.error ||
                data?.errorMessage ||
                (data?.metadata?.error?.message as string | undefined) ||
                "Media generation failed";
              toast.error(errorMessage);
            }

            await fetchNodeMedia(mediaId);

            if (status === "queued" || status === "generating") {
              startVideoPolling(mediaId, `/api/yan/ideas/gen/video?media_id=${mediaId}`);
            }
          } else {
            await fetchNodeMedia(mediaId);
          }
        } catch (error) {
          console.error("Failed to refresh media status", error);
          const message =
            error instanceof Error && error.message
              ? error.message
              : "Failed to refresh media status";
          toast.error(message);
        } finally {
          resetTracking();
        }
      },
      [fetchNodeMedia, startVideoPolling]
    );

    const handleRemoveFailedMedia = useCallback(
      async (mediaId: string) => {
        if (!mediaId || readOnly) {
          return;
        }

        setRemovingMediaId(mediaId);

        const resetTracking = () => {
          setRemovingMediaId((prev) => (prev === mediaId ? null : prev));
        };

        try {
          const existingController = videoPollingRef.current.get(mediaId);
          if (existingController) {
            existingController.cancelled = true;
            if (existingController.timeout) {
              clearTimeout(existingController.timeout);
            }
            videoPollingRef.current.delete(mediaId);
          }

          const response = await fetch(`/api/yan/ideas/media?media_id=${mediaId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const raw = await response.text();
            let message = "Failed to remove media";
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                if (parsed?.error) {
                  message = String(parsed.error);
                } else {
                  message = raw;
                }
              } catch {
                message = raw;
              }
            }
            throw new Error(message);
          }

          const result = await response.json().catch(() => ({}));

          await fetchNodeMedia();

          if (updateNodeImageData) {
            const hasImages =
              typeof result?.has_images === "boolean"
                ? result.has_images
                : Boolean((node as any)?.has_images);
            const mediaCount =
              typeof result?.remaining_count === "number"
                ? result.remaining_count
                : node.media_count;
            const primaryMediaId =
              typeof result?.primary_media_id === "string"
                ? result.primary_media_id
                : node.primary_media_id === mediaId
                  ? undefined
                  : node.primary_media_id;

            updateNodeImageData(node.id, {
              has_images: hasImages,
              primary_media_id: primaryMediaId,
              media_count: mediaCount,
              primary_image_url: node.primary_image_url,
            });
          }

          toast.success("Removed failed media");
        } catch (error) {
          console.error("Failed to remove media", error);
          const message =
            error instanceof Error && error.message
              ? error.message
              : "Failed to remove media";
          toast.error(message);
        } finally {
          resetTracking();
        }
      },
      [readOnly, fetchNodeMedia, updateNodeImageData, node.id, node.media_count, node.primary_media_id, node.primary_image_url]
    );

    const handleGenerateVideo = useCallback(
      async (
        nodeId: string,
        options: {
          prompt?: string;
          style?: string;
          mode?: "text-to-video" | "image-to-video";
          referenceUrl?: string;
        } = {}
      ): Promise<boolean> => {
        if (!nodeId || readOnly || hasPendingGeneration) {
          return false;
        }

        setIsGeneratingVideo(true);
        let success = false;

        try {
          const payload: Record<string, unknown> = {
            node_id: nodeId,
          };

          if (options.prompt) {
            payload.prompt = options.prompt;
          }
          if (options.style) {
            payload.style = options.style;
          }
          if (options.mode) {
            payload.mode = options.mode;
          }
          if (options.mode === "image-to-video" && options.referenceUrl) {
            payload.reference_image_url = options.referenceUrl;
            payload.image_url = options.referenceUrl;
          }

          const response = await fetch(`/api/yan/ideas/gen/video`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const rawError = await response.text();
            let errorMessage = "Failed to queue video generation";
            if (rawError) {
              try {
                const parsed = JSON.parse(rawError);
                if (parsed && typeof parsed === "object" && parsed.error) {
                  errorMessage = String(parsed.error);
                } else {
                  errorMessage = rawError;
                }
              } catch {
                errorMessage = rawError;
              }
            }
            throw new Error(errorMessage);
          }

          const result = await response.json();
          const mediaId: string | undefined = result?.media_id;
          const pollUrl: string | undefined = result?.poll_url;

          await fetchNodeMedia(mediaId || result?.storage_path);

          if (mediaId && pollUrl) {
            startVideoPolling(mediaId, pollUrl);
          }

          toast.success(
            result?.message || "Video generation started. We'll let you know when it's ready."
          );
          success = true;
        } catch (error) {
          console.error("Failed to queue video generation:", error);
          const message =
            error instanceof Error && error.message
              ? error.message
              : "Failed to start video generation";
          toast.error(message);
        } finally {
          setIsGeneratingVideo(false);
        }

        return success;
      },
  [readOnly, fetchNodeMedia, startVideoPolling, hasPendingGeneration]
    );
    const handleStoryActionWithLoading = useCallback(
      async (nodeId: string) => {
        if (readOnly || !handleGenerateStoryAction) {
          return;
        }
        setIsGenerating(true);
        try {
          await handleGenerateStoryAction(nodeId);
        } catch (error) {
          console.error("Failed to generate story structure:", error);
        } finally {
          setIsGenerating(false);
        }
      },
      [readOnly, handleGenerateStoryAction]
    );

    const handleImagePromptSubmit = async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();
      event.stopPropagation();

      if (readOnly || isGenerationBusy) {
        return;
      }

      const trimmedPrompt = imagePrompt.trim();
      const success = await handleGenerateImage(node.id, {
        prompt: trimmedPrompt.length ? trimmedPrompt : undefined,
        style: imageStyle,
      });

      if (success) {
        setIsImagePopoverOpen(false);
      }
    };

    const handleVideoPromptSubmit = async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();
      event.stopPropagation();

      if (readOnly || isGenerationBusy) {
        return;
      }

      const trimmedPrompt = videoPrompt.trim();
      const selectedMode = videoMode;
      const referenceUrl =
        selectedMode === "image-to-video" && useCurrentImageAsReference
          ? currentImageUrl
          : undefined;

      if (selectedMode === "image-to-video" && !referenceUrl) {
        toast.error("Select an image to transform into a video");
        return;
      }

      const success = await handleGenerateVideo(node.id, {
        prompt: trimmedPrompt.length ? trimmedPrompt : undefined,
        style: videoStyle,
        mode: selectedMode,
        referenceUrl,
      });

      if (success) {
        setIsImagePopoverOpen(false);
      }
    };

    const getIcon = () => {
      return <BookOpen className="h-6 w-6 text-green-600" />;
    };

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

    const currentMedia = mediaItems[currentMediaIndex] ?? null;
    const currentGenerationStatus = (currentMedia?.generationStatus || "").toString().toLowerCase();
    const currentMediaIsPending =
      currentGenerationStatus === "queued" || currentGenerationStatus === "generating";
    const currentMediaHasError = currentGenerationStatus === "failed";
  const isRefreshingCurrentMedia = refreshingMediaId === currentMedia?.id;
  const isRemovingCurrentMedia = removingMediaId === currentMedia?.id;

    return (
      <>
        <div className="relative group">
          <div
            className={cn(
              "rounded-lg border-2 transition-all duration-200 bg-white/90 backdrop-blur overflow-hidden",
              readOnly ? "cursor-default" : "cursor-move hover:shadow-lg",
              isSelected ? "ring-2 ring-green-500 ring-offset-2" : ""
            )}
            style={{
              width: 320,
              transition: "width 0.2s ease-in-out",
            }}
            onClick={() => {
              if (readOnly) {
                return;
              }
              onSelect?.(node.id);
            }}
          >
            {/* Media Gallery Section - Like a social media post */}
            <div className="relative">
              {mediaItems.length > 0 ? (
                <div className="relative group/media">
                  {/* Current Media Display */}
                  <div className="w-full min-h-48 bg-black flex items-center justify-center">
                    {currentMediaIsPending ? (
                      <div className="flex flex-col items-center justify-center gap-2 text-center text-white/80">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {currentMedia?.type === "video" ? (
                            <Clapperboard className="h-4 w-4 animate-pulse" />
                          ) : (
                            <ImageIcon className="h-4 w-4 animate-pulse" />
                          )}
                          <span>
                            {currentMedia?.type === "video" ? "Video" : "Media"} generation
                            {currentGenerationStatus === "queued" ? " queued" : " in progress"}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 max-w-[220px]">
                          Hang tight—we'll refresh automatically when it's ready.
                        </p>
                        {!readOnly && currentMedia?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-7 px-3 text-xs text-white bg-white/10 hover:bg-white/20 border border-white/20"
                            disabled={isRefreshingCurrentMedia}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleRefreshMediaStatus(currentMedia.id, currentMedia.type);
                            }}
                          >
                            <RotateCcw
                              className={`h-3.5 w-3.5 ${isRefreshingCurrentMedia ? "animate-spin" : ""}`}
                            />
                            <span className="ml-1">Refresh now</span>
                          </Button>
                        )}
                      </div>
                    ) : currentMediaHasError ? (
                      <div className="flex flex-col items-center justify-center gap-2 text-center text-white/80">
                        <X className="h-4 w-4 text-red-300" />
                        <p className="text-xs text-red-200">
                          {currentMedia?.errorMessage || "Media generation failed."}
                        </p>
                        {!readOnly && currentMedia?.id && (
                          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-3 text-xs text-white bg-white/10 hover:bg-white/20 border border-white/20"
                              disabled={isRefreshingCurrentMedia}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                handleRefreshMediaStatus(currentMedia.id, currentMedia.type);
                              }}
                            >
                              <RotateCcw
                                className={`h-3.5 w-3.5 ${isRefreshingCurrentMedia ? "animate-spin" : ""}`}
                              />
                              <span className="ml-1">Retry</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-3 text-xs text-white bg-red-500/20 hover:bg-red-500/30 border border-red-400/40"
                              disabled={isRemovingCurrentMedia}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                handleRemoveFailedMedia(currentMedia.id);
                              }}
                            >
                              {isRemovingCurrentMedia ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              <span className="ml-1">Remove</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : currentMedia?.type === "image" ? (
                      <img
                        src={currentMedia?.url}
                        alt={currentMedia?.title || node.title}
                        className="w-full min-h-48 object-cover cursor-pointer"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove(
                            "hidden"
                          );
                        }}
                      />
                    ) : currentMedia?.type === "video" ? (
                      <video
                        src={currentMedia?.url || undefined}
                        className="w-full h-48 object-cover"
                        controls
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove(
                            "hidden"
                          );
                        }}
                      />
                    ) : currentMedia?.type === "audio" ? (
                      <div className="w-full h-48 bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
                        <div className="text-center">
                          <Volume2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                          <audio
                            src={currentMedia?.url || undefined}
                            controls
                            className="mx-auto"
                          />
                          <p className="text-sm text-gray-600 mt-2">
                            {currentMedia?.title}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Media Navigation */}
                  {mediaItems.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1/2 left-2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white rounded-full opacity-0 group-hover/media:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMediaIndex(
                            currentMediaIndex > 0
                              ? currentMediaIndex - 1
                              : mediaItems.length - 1
                          );
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1/2 right-2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white rounded-full opacity-0 group-hover/media:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMediaIndex(
                            currentMediaIndex < mediaItems.length - 1
                              ? currentMediaIndex + 1
                              : 0
                          );
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  {/* Media Controls */}
                  {(!readOnly) && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/media:opacity-100 transition-opacity">
                      <Popover
                        open={isImagePopoverOpen}
                        onOpenChange={(open) => {
                          if (isGenerationBusy) {
                            return;
                          }
                          setIsImagePopoverOpen(open);
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 bg-black/20 hover:bg-purple-500/60 text-white rounded-full"
                            title="Add custom image"
                            disabled={isGenerationBusy}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <Plus
                              className={`h-3 w-3 ${isGenerationBusy ? "animate-pulse" : ""}`}
                            />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="end"
                          sideOffset={8}
                          className="w-80 p-4 space-y-4 rounded-lg border border-emerald-100 bg-white shadow-xl"
                          onOpenAutoFocus={(event) => event.preventDefault()}
                          onCloseAutoFocus={(event) => event.preventDefault()}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
                            <button
                              type="button"
                              className={cn(
                                "flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                                generationMode === "image"
                                  ? "border border-emerald-500 bg-emerald-50 text-emerald-700"
                                  : "border border-transparent bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                              )}
                              disabled={isGenerationBusy}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                if (!isGenerationBusy) {
                                  setGenerationMode("image");
                                }
                              }}
                            >
                              <ImageIcon className="h-3 w-3" /> Image
                            </button>
                            <button
                              type="button"
                              className={cn(
                                "flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                                generationMode === "video"
                                  ? "border border-emerald-500 bg-emerald-50 text-emerald-700"
                                  : "border border-transparent bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                              )}
                              disabled={isGenerationBusy}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                if (!isGenerationBusy) {
                                  setGenerationMode("video");
                                }
                              }}
                            >
                              <Clapperboard className="h-3 w-3" /> Video
                            </button>
                          </div>

                          {hasPendingGeneration && (
                            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                              Please wait for the current media generation to finish before starting a new one.
                            </div>
                          )}

                          {generationMode === "image" ? (
                            <form
                              className="space-y-4"
                              onSubmit={handleImagePromptSubmit}
                            >
                              <div className="space-y-2 text-left">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                    Style
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {STORY_IMAGE_STYLE_OPTIONS.map((option) => (
                                      <button
                                        key={option.value}
                                        type="button"
                                        className={cn(
                                          "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                                          imageStyle === option.value
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                            : "border-transparent bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                        )}
                                        onClick={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          setImageStyle(option.value);
                                        }}
                                      >
                                        {option.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                    Prompt
                                  </p>
                                  <Textarea
                                    value={imagePrompt}
                                    onChange={(event) =>
                                      setImagePrompt(event.target.value)
                                    }
                                    placeholder="Describe the image you'd like to see (optional)"
                                    rows={3}
                                    className="text-xs"
                                  />
                                  <p className="text-[11px] text-zinc-400">
                                    Combine a prompt with the selected style to
                                    guide the generator.
                                  </p>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setIsImagePopoverOpen(false);
                                  }}
                                >
                                  Close
                                </Button>
                                <Button
                                  type="submit"
                                  size="sm"
                                  className="text-xs"
                                  disabled={isGenerationBusy}
                                >
                                  {isImageBusy ? (
                                    <span className="flex items-center gap-1">
                                      <Wand2 className="h-3 w-3 animate-spin" />
                                      Working...
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <ImageIcon className="h-3 w-3" />
                                      Generate image
                                    </span>
                                  )}
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <form
                              className="space-y-4"
                              onSubmit={handleVideoPromptSubmit}
                            >
                              <div className="space-y-2 text-left">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                    Mode
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      className={cn(
                                        "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                                        videoMode === "text-to-video"
                                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                          : "border-transparent bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                      )}
                                      onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        setVideoMode("text-to-video");
                                        setUseCurrentImageAsReference(false);
                                      }}
                                    >
                                      Text to video
                                    </button>
                                    <button
                                      type="button"
                                      className={cn(
                                        "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                                        videoMode === "image-to-video"
                                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                          : "border-transparent bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                      )}
                                      disabled={!hasImageReference}
                                      onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        if (!hasImageReference) {
                                          return;
                                        }
                                        setVideoMode("image-to-video");
                                        setUseCurrentImageAsReference(Boolean(currentImageUrl));
                                      }}
                                    >
                                      Image to video
                                    </button>
                                  </div>
                                  {!hasImageReference && (
                                    <p className="mt-1 text-[11px] text-zinc-400">
                                      Add or select an image to unlock image-to-video transformations.
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                    Style
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {STORY_IMAGE_STYLE_OPTIONS.map((option) => (
                                      <button
                                        key={option.value}
                                        type="button"
                                        className={cn(
                                          "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                                          videoStyle === option.value
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                            : "border-transparent bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                        )}
                                        onClick={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          setVideoStyle(option.value);
                                        }}
                                      >
                                        {option.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                    Prompt
                                  </p>
                                  <Textarea
                                    value={videoPrompt}
                                    onChange={(event) =>
                                      setVideoPrompt(event.target.value)
                                    }
                                    placeholder="Describe the motion or scene you'd like to see"
                                    rows={3}
                                    className="text-xs"
                                  />
                                  <p className="text-[11px] text-zinc-400">
                                    Focus on action, pacing, and camera movement for best results.
                                  </p>
                                </div>
                                {videoMode === "image-to-video" && (
                                  <label className="flex items-center gap-2 text-[11px] text-zinc-500">
                                    <input
                                      type="checkbox"
                                      className="rounded border-zinc-300"
                                      checked={
                                        Boolean(currentImageUrl) &&
                                        useCurrentImageAsReference
                                      }
                                      onChange={(event) => {
                                        const shouldUse = event.target.checked && Boolean(currentImageUrl);
                                        setUseCurrentImageAsReference(shouldUse);
                                      }}
                                      disabled={!currentImageUrl}
                                    />
                                    Use current image as reference
                                    {!currentImageUrl && (
                                      <span className="ml-1 text-[11px] text-amber-600">
                                        Select an image in the gallery first
                                      </span>
                                    )}
                                  </label>
                                )}
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setIsImagePopoverOpen(false);
                                  }}
                                >
                                  Close
                                </Button>
                                <Button
                                  type="submit"
                                  size="sm"
                                  className="text-xs"
                                  disabled={isGenerationBusy}
                                >
                                  {isVideoBusy ? (
                                    <span className="flex items-center gap-1">
                                      <Clapperboard className="h-3 w-3 animate-spin" />
                                      Generating...
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <Clapperboard className="h-3 w-3" />
                                      Generate video
                                    </span>
                                  )}
                                </Button>
                              </div>
                            </form>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {/* Media Type Indicators */}
                  {mediaItems.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                      {mediaItems.map((media: any, index: number) => (
                        <button
                          key={media.id || index}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentMediaIndex
                              ? "bg-white scale-125"
                              : "bg-white/50 hover:bg-white/75"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentMediaIndex(index);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center border-b group/placeholder">
                  <div className="text-center text-gray-400">
                    <Image className="h-8 w-8 mx-auto mb-2" />
                    {isGenerationBusy ? (
                      <div className="flex items-center justify-center gap-2 text-[11px] text-purple-600">
                        <ImageIcon className="h-3 w-3 animate-pulse" />
                        Generating media...
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-purple-600 hover:text-purple-700 opacity-60 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchNodeMedia();
                          }}
                          disabled={isGenerationBusy}
                        >
                          <ImageIcon className="h-3 w-3 mr-1" /> Refresh media
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Content Section - Like a social media post */}
            <div className="p-3">
              {/* Header with title */}
              <div className="flex items-start gap-2 mb-2">
                <div className={`flex-shrink-0 mt-0.5`}>{getIcon()}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <h3
                      className={`text-base font-semibold leading-snug break-words flex-1`}
                    >
                      {node.title || "Untitled Story Section"}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-1 mb-2">{statusBadge()}</div>

              {/* Story content */}
              {node.content ? (
                <div
                  className={`text-[13px] prose prose-xs max-w-none dark:prose-invert leading-relaxed`}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
                    {node.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-[12px] text-gray-400 italic">
                  No story content available.
                </p>
              )}
            </div>
          </div>
        </div>
        {!hasChildrenMemo && (
          <NodeToolbar
            isVisible={isSelected && isRootNode}
            position={Position.Bottom}
          >
            {isGenerating ? (
              <Button variant="outline" size="lg" disabled={true}>
                <Wand2 className="h-4 w-4 animate-spin" /> Generating...
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                aria-label="Start your journey"
                title="Start your journey"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStoryActionWithLoading(node.id);
                }}
              >
                <Wand2 className="h-4 w-4" />
                Start your journey
              </Button>
            )}
          </NodeToolbar>
        )}
        <Handle
          type="target"
          position={Position.Left}
          onConnect={(params) => console.log("handle onConnect", params)}
          isConnectable={readOnly ? false : isConnectable}
        />
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={readOnly ? false : isConnectable}
        />
      </>
    );
  }
);
