"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { StackIcon } from "@phosphor-icons/react";
import { SUPPORTED_MODELS } from "@/lib/aimodels";
import { useYan } from "@/lib/chat-store/provider";
import { useState } from "react";

interface MultiModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MultiModelDialog({
  open,
  onOpenChange,
}: MultiModelDialogProps) {
  const { selectedModels, setSelectedModels, setIsMultiModelMode } = useYan();

  // Local working state (not committed until user confirms)
  const [tempSelectedModels, setTempSelectedModels] = useState<string[]>(selectedModels);
  const [search, setSearch] = useState("");
  const [providerFilters, setProviderFilters] = useState<string[]>([]);

  const providers = Array.from(new Set(SUPPORTED_MODELS.map(m => m.provider)));

  const filteredModels = SUPPORTED_MODELS.filter(m => {
    const matchesProvider = providerFilters.length === 0 || providerFilters.includes(m.provider);
    const q = search.trim().toLowerCase();
    const matchesQuery = !q ||
      m.model.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q);
    return matchesProvider && matchesQuery;
  });

  const toggleProviderFilter = (provider: string) => {
    setProviderFilters(prev => prev.includes(provider) ? prev.filter(p => p !== provider) : [...prev, provider]);
  };

  const handleModelToggle = (modelName: string, checked?: boolean) => {
    setTempSelectedModels(prev => {
      const isSelected = prev.includes(modelName);
      const nextState = (typeof checked === "boolean") ? checked : !isSelected;
      if (nextState && !isSelected) return [...prev, modelName];
      if (!nextState && isSelected) return prev.filter(n => n !== modelName);
      return prev;
    });
  };

  const handleConfirm = () => {
    setSelectedModels(tempSelectedModels);
    const isMultiModelMode = tempSelectedModels.length > 0;
    setIsMultiModelMode(isMultiModelMode);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTempSelectedModels(selectedModels); // Reset to original selection
    setSearch("");
    setProviderFilters([]);
    onOpenChange(false);
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      openai:
        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      google:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      anthropic:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      xai: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
      moonshotai:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    };
    return (
      colors[provider] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    );
  };

  const handleDisable = () => {
    setSelectedModels([]);
    setIsMultiModelMode(false);
    onOpenChange(false);
  };

  const handleSelectAllFiltered = () => {
    const all = filteredModels.map(m => m.name);
    setTempSelectedModels(all);
  };

  const handleClearSelection = () => {
    setTempSelectedModels([]);
  };

  const someFilteredSelected = filteredModels.some(m => tempSelectedModels.includes(m.name));
  const allFilteredSelected = filteredModels.length > 0 && filteredModels.every(m => tempSelectedModels.includes(m.name));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-2xl w-full max-h-[85vh] p-4 sm:p-6">
        <DialogHeader>
              <DialogTitle>Select AI Models</DialogTitle>
              <DialogDescription className="mt-1">
                Choose multiple models to compare their responses. Each model
                will provide its own answer.
              </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          {/* Controls Row */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Provider filters (h-scroll on mobile) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] flex-nowrap md:flex-wrap md:overflow-visible pr-1">
              {providers.map(p => {
                const active = providerFilters.includes(p);
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => toggleProviderFilter(p)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-md border transition-colors flex-shrink-0",
                      active ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              {providerFilters.length > 0 && (
                <button
                  type="button"
                  onClick={() => setProviderFilters([])}
                  className="text-xs px-2 py-1 rounded-md border hover:bg-accent flex-shrink-0"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Input
                placeholder="Search models..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground px-0.5">
              <span>
                Showing {filteredModels.length} of {SUPPORTED_MODELS.length}
              </span>
              <span className="font-medium">•</span>
              <span>
                Selected: {tempSelectedModels.length}
              </span>
              {filteredModels.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={allFilteredSelected ? handleClearSelection : handleSelectAllFiltered}
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    {allFilteredSelected ? "Clear filtered" : someFilteredSelected ? "Select all filtered" : "Select all"}
                  </button>
                  {tempSelectedModels.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="underline underline-offset-2 hover:text-foreground transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}
            </div>

          <ScrollArea className="h-[48vh] sm:h-[400px] pr-1 sm:pr-2">
            {filteredModels.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4">No models match your filters.</div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {filteredModels.map(model => {
                  const isSelected = tempSelectedModels.includes(model.name);
                  return (
                    <div
                      key={model.name}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => handleModelToggle(model.name)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleModelToggle(model.name); } }}
                      className={cn(
                        "group relative flex flex-col gap-1 rounded-lg border p-3 cursor-pointer select-none outline-none transition-colors text-left min-h-[90px] sm:min-h-[110px]",
                        isSelected ? "border-primary ring-primary/40 bg-primary/5" : "hover:bg-accent/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-sm font-medium truncate" title={model.model}>{model.model}</span>
                          </div>
                          <div className="mt-1">
                            <Badge
                              variant="secondary"
                              className={cn(getProviderColor(model.provider), "text-[10px] font-normal px-1.5 py-0.5")}
                            >
                              {model.provider}
                            </Badge>
                          </div>
                        </div>
                        <Checkbox
                          id={`chk-${model.name}`}
                          checked={isSelected}
                          onCheckedChange={() => handleModelToggle(model.name)}
                          className="shrink-0 translate-y-0.5"
                          aria-label={`Select ${model.model}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2 pt-3 sm:pt-4 border-t sm:border-t-0 mt-2 sm:mt-0 flex-col-reverse sm:flex-row sm:static -mx-4 sm:mx-0 px-4 sm:px-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 bottom-0">
          {/* <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button> */}
          <Button variant="destructive" onClick={handleDisable}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={tempSelectedModels.length === 0}
          >
            Enable Multi-Model Mode
            {tempSelectedModels.length > 0 && (
              <span className="ml-2 bg-primary-foreground text-primary px-1.5 py-0.5 rounded text-xs">
                {tempSelectedModels.length}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
