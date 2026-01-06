"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

interface InsufficientCreditsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InsufficientCreditsDialog({
  open,
  onOpenChange,
}: InsufficientCreditsDialogProps) {
  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
              <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <DialogTitle>Insufficient Credits</DialogTitle>
              <DialogDescription className="mt-1">
                You don't have enough credits to continue this conversation.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Please contact support to get more credits for your account.
          </p>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
