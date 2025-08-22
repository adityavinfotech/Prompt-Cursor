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
import { Loader2, Sparkles } from "lucide-react"
import type { Analysis } from "@/app/page"

interface ImprovePromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  originalPrompt: string
  ideType: string
  onPromptImproved: (improvedPrompt: string) => void
  requirement?: string
  analysis?: Analysis
}

export function ImprovePromptDialog({
  open,
  onOpenChange,
  originalPrompt,
  ideType,
  onPromptImproved,
  requirement,
  analysis,
}: ImprovePromptDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Improve {ideType.charAt(0).toUpperCase() + ideType.slice(1)} Prompt
          </DialogTitle>
          <DialogDescription>
            Describe how you'd like to enhance or modify this prompt. The AI will generate an improved version based on your feedback.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="original-prompt">Current Prompt</Label>
            <Textarea
              id="original-prompt"
              value={originalPrompt}
              readOnly
              className="min-h-[200px] font-mono text-sm resize-none bg-muted mt-2"
            />
          </div>

          <div>
            <Label htmlFor="improvement-instructions">Improvement Instructions</Label>
            <Textarea
              id="improvement-instructions"
              value={improvementInstructions}
              onChange={(e) => setImprovementInstructions(e.target.value)}
              placeholder="Example: Make it more specific for React development, add error handling details, focus more on testing, make it shorter and more concise, etc."
              className="min-h-[120px] mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImproving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImprove}
            disabled={isImproving || !improvementInstructions.trim()}
          >
            {isImproving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Improving...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Improve Prompt
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
