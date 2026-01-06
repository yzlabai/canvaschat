import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { StackIcon } from "@phosphor-icons/react"
import { useYan } from "@/lib/chat-store/provider"

export function MultiModelButton() {
  const { isMultiModelMode, toggleMultiModelMode, selectedModels } = useYan()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className={cn(
            "border-border dark:bg-secondary size-9 rounded-full border bg-transparent transition-all duration-200",
            isMultiModelMode && "border-[#0091FF]/20 bg-[#E5F3FE] text-[#0091FF] hover:bg-[#E5F3FE] hover:text-[#0091FF]"
          )}
          type="button"
          onClick={toggleMultiModelMode}
          aria-label={isMultiModelMode ? "Disable multi-model mode" : "Enable multi-model mode"}
        >
          <StackIcon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isMultiModelMode 
          ? `Multi-model mode enabled${selectedModels.length > 0 ? ` (${selectedModels.length} models)` : ""}`
          : "Enable multi-model mode"
        }
      </TooltipContent>
    </Tooltip>
  )
}
