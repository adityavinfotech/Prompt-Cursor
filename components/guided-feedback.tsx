"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Lightbulb, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface GuidedFeedbackProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

const QUICK_PROMPTS = [
  "Add more details about",
  "Simplify the complexity of",
  "Consider edge cases for",
  "Clarify the requirements for"
]

export function GuidedFeedback({ value, onChange, disabled, className }: GuidedFeedbackProps) {
  const [showPrompts, setShowPrompts] = useState(false)

  const handlePromptClick = (prompt: string) => {
    const newValue = value ? `${value}\n${prompt} ` : `${prompt} `
    onChange(newValue)
    setShowPrompts(false)
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Feedback</label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPrompts(!showPrompts)}
          disabled={disabled}
          className="h-7 px-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Quick add
        </Button>
      </div>

      {showPrompts && (
        <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-md">
          {QUICK_PROMPTS.map((prompt, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handlePromptClick(prompt)}
              disabled={disabled}
              className="justify-start h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              {prompt}
            </Button>
          ))}
        </div>
      )}

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What would you like to improve in the next iteration?"
        className="min-h-[80px] resize-none text-sm"
        disabled={disabled}
      />
      
      {value.length > 0 && (
        <div className="text-xs text-muted-foreground text-right">
          {value.length} characters
        </div>
      )}
    </div>
  )
}
