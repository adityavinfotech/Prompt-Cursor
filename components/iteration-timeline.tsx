"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnalysisIteration } from "@/components/iteration-display"

interface IterationTimelineProps {
  iterations: AnalysisIteration[]
  currentIteration: number
  onSelectIteration: (index: number) => void
}

export function IterationTimeline({ iterations, currentIteration, onSelectIteration }: IterationTimelineProps) {
  if (iterations.length === 0) return null

  return (
    <div className="flex items-center justify-between p-4 mb-6 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Version</span>
        <div className="flex items-center gap-1">
          {iterations.map((iteration, index) => (
            <div key={index} className="flex items-center gap-1">
              <Button
                variant={index === currentIteration ? "default" : "ghost"}
                size="sm"
                onClick={() => onSelectIteration(index)}
                className={cn(
                  "h-8 px-3 text-sm",
                  index === currentIteration && "shadow-sm"
                )}
              >
                {iteration.isUserSatisfied ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <Circle className="h-3 w-3 mr-1" />
                )}
                {iteration.iterationNumber}
              </Button>
              {index < iterations.length - 1 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
              )}
            </div>
          ))}
        </div>
      </div>
      
      <Badge variant="outline" className="text-xs">
        {iterations.filter(i => i.isUserSatisfied).length} satisfied
      </Badge>
    </div>
  )
}
