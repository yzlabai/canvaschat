"use client";

import { Button } from "@/components/ui/button";

import {
  Plus,
  Check,
  X,
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
    const { updateNodeImageData } = readOnly ? useShareIdea() : useIdeas();
    const handleAddChildNode = readOnly
      ? undefined
      : useIdeas().handleAddChildNode;
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isLoadingMedia, setIsLoadingMedia] = useState(false);

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

    const [refreshingMediaId, setRefreshingMediaId] = useState<string | null>(
      null
    );
    const [removingMediaId, setRemovingMediaId] = useState<string | null>(null);

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

              const rawStatus = (
                item.generationStatus ||
                item.generation_status ||
                ""
              )
                .toString()
                .toLowerCase();
              const hasSignedUrl =
                typeof item.url === "string" && item.url.length > 0;
              let generationStatus = rawStatus;

              if (!generationStatus) {
                generationStatus = hasSignedUrl ? "generated" : "queued";
              } else if (
                (generationStatus === "queued" ||
                  generationStatus === "generating") &&
                hasSignedUrl
              ) {
                // Legacy records might have generated media but stale status
                generationStatus = "generated";
              }

              const storagePath =
                item.storagePath ||
                item.storage_path ||
                item.media_url ||
                item.mediaUrl ||
                null;

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
                errorMessage:
                  item.error || item.errorMessage || item.error_message,
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
      fetchNodeMedia();
    }, [fetchNodeMedia]);

    const isImageBusy = isGeneratingImage || isLoadingMedia;
    const hasPendingGeneration = useMemo(
      () =>
        mediaItems.some((item: any) => {
          const status = (item?.generationStatus || "")
            .toString()
            .toLowerCase();
          return status === "queued" || status === "generating";
        }),
      [mediaItems]
    );
    const isGenerationBusy = isImageBusy || hasPendingGeneration;

    const currentImageUrl = useMemo(() => {
      const media = mediaItems[currentMediaIndex];
      if (media && media.type === "image" && typeof media.url === "string") {
        return media.url;
      }
      return undefined;
    }, [mediaItems, currentMediaIndex]);

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

            await fetchNodeMedia(mediaId);

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
      [fetchNodeMedia]
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
          const response = await fetch(
            `/api/yan/ideas/media?media_id=${mediaId}`,
            {
              method: "DELETE",
            }
          );

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
      [
        readOnly,
        fetchNodeMedia,
        updateNodeImageData,
        node.id,
        node.media_count,
        node.primary_media_id,
        node.primary_image_url,
      ]
    );

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
    const currentGenerationStatus = (currentMedia?.generationStatus || "")
      .toString()
      .toLowerCase();
    const currentMediaIsPending =
      currentGenerationStatus === "queued" ||
      currentGenerationStatus === "generating";
    const currentMediaHasError = currentGenerationStatus === "failed";
    const isRefreshingCurrentMedia = refreshingMediaId === currentMedia?.id;
    const isRemovingCurrentMedia = removingMediaId === currentMedia?.id;
    const displayTitle = useMemo(() => {
      const rawTitle = typeof node.title === "string" ? node.title.trim() : "";
      return rawTitle.length > 0 ? rawTitle : "Concept";
    }, [node.title]);
    const statusChip = statusBadge();

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
                          <ImageIcon className="h-4 w-4 animate-pulse" />
                          <span>
                            Image generation
                            {currentGenerationStatus === "queued"
                              ? " queued"
                              : " in progress"}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 max-w-[220px]">
                          Hang tight—we'll refresh automatically when it's
                          ready.
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
                              handleRefreshMediaStatus(
                                currentMedia.id,
                                currentMedia.type
                              );
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
                          {currentMedia?.errorMessage ||
                            "Media generation failed."}
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
                                handleRefreshMediaStatus(
                                  currentMedia.id,
                                  currentMedia.type
                                );
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
                    ) : (
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
                    )}
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

            {/* Header Section */}
            <div className="p-3 border-t border-gray-100">
              <div className="flex items-start gap-2">
                <div className="flex items-center justify-center rounded-full text-emerald-600">
                  <Image className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-gray-900 truncate">
                      {displayTitle}
                    </p>
                    {statusChip}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <NodeToolbar
          isVisible={isSelected}
          position={Position.Bottom}
          className="flex gap-1 bg-white/90 backdrop-blur border border-gray-200 shadow-lg rounded-md p-1 z-10"
        >
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
        </NodeToolbar>
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
