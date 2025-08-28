"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Sparkles, Send } from "lucide-react"
import type { Analysis } from "@/app/page"

interface ImprovePromptInputDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  originalPrompt: string
  ideType: string
  onPromptImproved: (improvedPrompt: string) => void
  requirement?: string
  analysis?: Analysis
}

export function ImprovePromptInputDialog({
  open,
  onOpenChange,
  originalPrompt,
  ideType,
  onPromptImproved,
  requirement,
  analysis,
}: ImprovePromptInputDialogProps) {
  const [improvementInstructions, setImprovementInstructions] = useState("")
  const [isImproving, setIsImproving] = useState(false)
  const { toast } = useToast()

  const handleImprove = async () => {
    if (!improvementInstructions.trim()) {
      toast({
        title: "Missing instructions",
        description: "Please provide instructions for how to improve the prompt.",
        variant: "destructive",
      })
      return
    }

    setIsImproving(true)

    try {
      const response = await fetch('/api/prompts/improve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalPrompt,
          ideType,
          improvementInstructions,
          requirement,
          analysis,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to improve prompt')
      }

      onPromptImproved(result.data.improvedPrompt)
      setImprovementInstructions("")
      onOpenChange(false)

      toast({
        title: "Prompt improved!",
        description: `${ideType.charAt(0).toUpperCase() + ideType.slice(1)} prompt has been enhanced based on your feedback.`,
      })
    } catch (error) {
      console.error('Improve prompt error:', error)
      toast({
        title: "Improvement failed",
        description: error instanceof Error ? error.message : "Failed to improve prompt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsImproving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleImprove()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Improve {ideType.charAt(0).toUpperCase() + ideType.slice(1)} Prompt
          </DialogTitle>
          <DialogDescription className="text-sm">
            Tell us how you'd like to enhance this prompt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="improvement-instructions" className="text-sm font-medium">
              What would you like to improve?
            </Label>
            <Textarea
              id="improvement-instructions"
              value={improvementInstructions}
              onChange={(e) => setImprovementInstructions(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Make it more specific for React, add error handling, focus on testing..."
              className="min-h-[100px] mt-2 text-sm resize-none"
              disabled={isImproving}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Press Ctrl+Enter to submit
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImproving}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImprove}
            disabled={isImproving || !improvementInstructions.trim()}
            size="sm"
          >
            {isImproving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Improving...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Improve
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
