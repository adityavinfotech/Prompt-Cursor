"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  History, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  GitCompare, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Target,
  Shield,
  Link,
  AlertTriangle,
  Zap
} from "lucide-react"
import type { Analysis } from "@/app/page"

export interface AnalysisIteration {
  id: string
  timestamp: Date
  analysis: Analysis
  userEdits?: Partial<Analysis>
  userFeedback?: string
  iterationNumber: number
  isUserSatisfied: boolean
}

interface IterationDisplayProps {
  iterations: AnalysisIteration[]
  currentIteration: number
  onSelectIteration: (index: number) => void
  onCompareIterations?: (iteration1: number, iteration2: number) => void
}

export function IterationDisplay({ 
  iterations, 
  currentIteration, 
  onSelectIteration,
  onCompareIterations 
}: IterationDisplayProps) {
  const [compareMode, setCompareMode] = useState(false)
  const [compareWith, setCompareWith] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'timeline' | 'comparison'>('timeline')

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    }).format(new Date(timestamp))
  }

  const getIterationStatus = (iteration: AnalysisIteration) => {
    if (iteration.isUserSatisfied) return { color: 'bg-green-500', text: 'Satisfied' }
    if (iteration.userEdits) return { color: 'bg-yellow-500', text: 'Modified' }
    return { color: 'bg-blue-500', text: 'Generated' }
  }

  const renderAnalysisSection = (analysis: Analysis, title: string) => (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-muted-foreground">{title}</h4>
      
      {/* Goals */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">Goals ({analysis.goals.length})</span>
        </div>
        <div className="pl-6 space-y-1">
          {analysis.goals.map((goal, index) => (
            <p key={index} className="text-sm text-muted-foreground">• {goal}</p>
          ))}
        </div>
      </div>

      {/* Constraints */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-medium">Constraints ({analysis.constraints.length})</span>
        </div>
        <div className="pl-6 space-y-1">
          {analysis.constraints.map((constraint, index) => (
            <p key={index} className="text-sm text-muted-foreground">• {constraint}</p>
          ))}
        </div>
      </div>

      {/* Dependencies */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Link className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">Dependencies ({analysis.dependencies.length})</span>
        </div>
        <div className="pl-6 space-y-1">
          {analysis.dependencies.map((dependency, index) => (
            <p key={index} className="text-sm text-muted-foreground">• {dependency}</p>
          ))}
        </div>
      </div>

      {/* Questions & Assumptions Summary */}
      <div className="flex gap-4 text-sm">
        <Badge variant="outline">
          {analysis.questions.length} Questions
        </Badge>
        <Badge variant="outline">
          {analysis.assumptions.length} Assumptions
        </Badge>
        <Badge variant="outline">
          {analysis.assumptions.filter(a => a.accepted).length} Accepted
        </Badge>
      </div>
    </div>
  )

  const renderTimeline = () => (
    <ScrollArea className="h-96">
      <div className="space-y-4 p-4">
        {iterations.map((iteration, index) => {
          const status = getIterationStatus(iteration)
          const isActive = index === currentIteration
          
          return (
            <div
              key={iteration.id}
              className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                isActive ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
              onClick={() => onSelectIteration(index)}
              role="button"
              tabIndex={0}
              aria-label={`Select iteration ${iteration.iterationNumber}, ${status.text}, created ${formatTimestamp(iteration.timestamp)}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectIteration(index)
                }
              }}
            >
              {/* Timeline connector */}
              {index < iterations.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-8 bg-border" />
              )}
              
              <div className="flex items-start gap-3">
                {/* Status indicator */}
                <div className={`w-3 h-3 rounded-full ${status.color} mt-2 flex-shrink-0`} />
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        Iteration {iteration.iterationNumber}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {status.text}
                      </Badge>
                      {isActive && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(iteration.timestamp)}
                    </div>
                  </div>
                  
                  {/* Quick stats */}
                  <div className="flex gap-2 text-xs">
                    <span>{iteration.analysis.goals.length} goals</span>
                    <span>•</span>
                    <span>{iteration.analysis.constraints.length} constraints</span>
                    <span>•</span>
                    <span>{iteration.analysis.questions.length} questions</span>
                  </div>
                  
                  {/* User feedback if available */}
                  {iteration.userFeedback && (
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      Feedback: {iteration.userFeedback}
                    </p>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectIteration(index)
                      }}
                      className="h-7 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    {onCompareIterations && index !== currentIteration && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onCompareIterations(currentIteration, index)
                          setViewMode('comparison')
                        }}
                        className="h-7 text-xs"
                      >
                        <GitCompare className="h-3 w-3 mr-1" />
                        Compare
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )

  const renderComparison = () => {
    if (!compareWith || compareWith === currentIteration) {
      return (
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          <p>Select two different iterations to compare</p>
        </div>
      )
    }

    const current = iterations[currentIteration]
    const compare = iterations[compareWith]

    return (
      <ScrollArea className="h-96">
        <div className="grid grid-cols-2 gap-4 p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Badge variant="default">Current</Badge>
              <span className="text-sm font-medium">
                Iteration {current.iterationNumber}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(current.timestamp)}
              </span>
            </div>
            {renderAnalysisSection(current.analysis, "Current Analysis")}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Badge variant="outline">Compare</Badge>
              <span className="text-sm font-medium">
                Iteration {compare.iterationNumber}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(compare.timestamp)}
              </span>
            </div>
            {renderAnalysisSection(compare.analysis, "Comparison Analysis")}
          </div>
        </div>
      </ScrollArea>
    )
  }

  if (iterations.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No iterations yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Iteration History
            <Badge variant="secondary" className="ml-2">
              {iterations.length} iterations
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectIteration(Math.max(0, currentIteration - 1))}
                disabled={currentIteration === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">
                {currentIteration + 1} of {iterations.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectIteration(Math.min(iterations.length - 1, currentIteration + 1))}
                disabled={currentIteration === iterations.length - 1}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'timeline' | 'comparison')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeline" className="mt-4">
            {renderTimeline()}
          </TabsContent>
          
          <TabsContent value="comparison" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Compare with:</span>
                <select
                  value={compareWith || ''}
                  onChange={(e) => setCompareWith(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="">Select iteration...</option>
                  {iterations.map((iteration, index) => (
                    index !== currentIteration && (
                      <option key={iteration.id} value={index}>
                        Iteration {iteration.iterationNumber} - {formatTimestamp(iteration.timestamp)}
                      </option>
                    )
                  ))}
                </select>
              </div>
              {renderComparison()}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
