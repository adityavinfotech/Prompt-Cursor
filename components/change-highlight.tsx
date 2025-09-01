"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Minus, Edit3, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Analysis } from "@/app/page"

interface ChangeHighlightProps {
  title: string
  before: string[] | undefined
  after: string[] | undefined
  className?: string
}

interface ChangeItem {
  text: string
  type: 'added' | 'removed' | 'modified' | 'unchanged'
  originalIndex?: number
}

function detectChanges(before: string[] = [], after: string[] = []): ChangeItem[] {
  const changes: ChangeItem[] = []
  
  // Find removed items
  before.forEach((item, index) => {
    if (!after.includes(item)) {
      changes.push({ text: item, type: 'removed', originalIndex: index })
    }
  })
  
  // Find added and unchanged items
  after.forEach((item, index) => {
    if (!before.includes(item)) {
      changes.push({ text: item, type: 'added' })
    } else {
      changes.push({ text: item, type: 'unchanged', originalIndex: before.indexOf(item) })
    }
  })
  
  return changes.sort((a, b) => {
    // Sort by original index, then by type
    if (a.originalIndex !== undefined && b.originalIndex !== undefined) {
      return a.originalIndex - b.originalIndex
    }
    if (a.originalIndex !== undefined) return -1
    if (b.originalIndex !== undefined) return 1
    return 0
  })
}

export function ChangeHighlight({ title, before, after, className }: ChangeHighlightProps) {
  const changes = detectChanges(before, after)
  const hasChanges = changes.some(c => c.type !== 'unchanged')
  
  if (!hasChanges && (!before?.length && !after?.length)) {
    return null
  }

  const addedCount = changes.filter(c => c.type === 'added').length
  const removedCount = changes.filter(c => c.type === 'removed').length
  const modifiedCount = changes.filter(c => c.type === 'modified').length

  return (
    <Card className={cn("transition-all duration-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {addedCount > 0 && (
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-950/30 dark:text-green-300 dark:border-green-700">
                <Plus className="h-3 w-3 mr-1" />
                +{addedCount}
              </Badge>
            )}
            {removedCount > 0 && (
              <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50 dark:bg-red-950/30 dark:text-red-300 dark:border-red-700">
                <Minus className="h-3 w-3 mr-1" />
                -{removedCount}
              </Badge>
            )}
            {modifiedCount > 0 && (
              <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-700">
                <Edit3 className="h-3 w-3 mr-1" />
                ~{modifiedCount}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {!hasChanges ? (
          <div className="text-sm text-muted-foreground italic py-2">No changes</div>
        ) : (
          <div className="space-y-2">
            {changes.map((change, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-md text-sm transition-colors border-l-3",
                  change.type === 'added' && "bg-green-50 border-l-green-500 text-green-800 dark:bg-green-950/20 dark:text-green-200 dark:border-l-green-400",
                  change.type === 'removed' && "bg-red-50 border-l-red-500 text-red-800 dark:bg-red-950/20 dark:text-red-200 dark:border-l-red-400 line-through opacity-75",
                  change.type === 'modified' && "bg-blue-50 border-l-blue-500 text-blue-800 dark:bg-blue-950/20 dark:text-blue-200 dark:border-l-blue-400",
                  change.type === 'unchanged' && "bg-muted/30 border-l-muted-foreground/30 text-muted-foreground"
                )}
              >
                <div className="flex items-start gap-2">
                  {change.type === 'added' && <Plus className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />}
                  {change.type === 'removed' && <Minus className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />}
                  {change.type === 'modified' && <Edit3 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />}
                  <span className="leading-relaxed">
                    {change.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface AnalysisComparisonProps {
  before: Analysis | undefined
  after: Analysis
  className?: string
}

export function AnalysisComparison({ before, after, className }: AnalysisComparisonProps) {
  if (!before) {
    return (
      <div className={cn("text-center p-8 text-muted-foreground bg-muted/30 rounded-lg", className)}>
        <div className="text-sm">This is the initial analysis - no previous version to compare</div>
      </div>
    )
  }

  // Calculate total changes across all sections
  const sections = [
    { title: "Goals", before: before.goals, after: after.goals },
    { title: "Constraints", before: before.constraints, after: after.constraints },
    { title: "Dependencies", before: before.dependencies, after: after.dependencies },
    { title: "Edge Cases", before: before.edgeCases, after: after.edgeCases },
    { title: "Acceptance Criteria", before: before.acceptanceCriteria, after: after.acceptanceCriteria }
  ]

  const totalChanges = sections.reduce((acc, section) => {
    const changes = detectChanges(section.before, section.after)
    const added = changes.filter(c => c.type === 'added').length
    const removed = changes.filter(c => c.type === 'removed').length
    const modified = changes.filter(c => c.type === 'modified').length
    return {
      added: acc.added + added,
      removed: acc.removed + removed,
      modified: acc.modified + modified
    }
  }, { added: 0, removed: 0, modified: 0 })

  const hasAnyChanges = totalChanges.added > 0 || totalChanges.removed > 0 || totalChanges.modified > 0

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Header */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowRight className="h-4 w-4" />
          <span>Changes from previous iteration</span>
        </div>
        <div className="flex items-center gap-2">
          {totalChanges.added > 0 && (
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-950/30 dark:text-green-300 dark:border-green-700">
              <Plus className="h-3 w-3 mr-1" />
              {totalChanges.added} added
            </Badge>
          )}
          {totalChanges.removed > 0 && (
            <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50 dark:bg-red-950/30 dark:text-red-300 dark:border-red-700">
              <Minus className="h-3 w-3 mr-1" />
              {totalChanges.removed} removed
            </Badge>
          )}
          {totalChanges.modified > 0 && (
            <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-700">
              <Edit3 className="h-3 w-3 mr-1" />
              {totalChanges.modified} modified
            </Badge>
          )}
        </div>
      </div>

      {!hasAnyChanges ? (
        <div className="text-center p-8 text-muted-foreground bg-muted/30 rounded-lg">
          <div className="text-sm">No changes detected in this iteration</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {sections.map((section) => (
            <ChangeHighlight 
              key={section.title}
              title={section.title} 
              before={section.before} 
              after={section.after} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
