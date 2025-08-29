"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, AlertCircle, HelpCircle, Target, Shield, Link, AlertTriangle, Zap, Loader2 } from "lucide-react"
import type { Analysis, Question } from "@/app/page"

interface AnalysisPanelProps {
  analysis: Analysis
  onUpdate: (analysis: Analysis) => void
  onGeneratePrompts: () => void
  isGenerating: boolean
}

export function AnalysisPanel({ analysis, onUpdate, onGeneratePrompts, isGenerating }: AnalysisPanelProps) {
  const [localAnalysis, setLocalAnalysis] = useState(analysis)

  // Keep local state in sync when parent analysis changes (e.g., after edits or iterations)
  // Only update if there are actual structural changes, not just user interactions
  useEffect(() => {
    // Only sync if the analysis has meaningfully changed (not just user input changes)
    const hasStructuralChanges = JSON.stringify(analysis) !== JSON.stringify(localAnalysis)
    if (hasStructuralChanges) {
      setLocalAnalysis(analysis)
    }
  }, [analysis]) // Removed localAnalysis from deps to prevent infinite loops

  const handleQuestionAnswer = (questionId: string, answer: string) => {
    const updatedQuestions = localAnalysis.questions.map((q) => (q.id === questionId ? { ...q, answer } : q))
    const updated = { ...localAnalysis, questions: updatedQuestions }
    setLocalAnalysis(updated)
    onUpdate(updated)
  }

  const handleAssumptionToggle = (assumptionId: string, accepted: boolean) => {
    const updatedAssumptions = localAnalysis.assumptions.map((a) => (a.id === assumptionId ? { ...a, accepted } : a))
    const updated = { ...localAnalysis, assumptions: updatedAssumptions }
    setLocalAnalysis(updated)
    onUpdate(updated)
  }

  const getPriorityColor = (priority: Question["priority"]) => {
    switch (priority) {
      case "critical":
        return "destructive"
      case "important":
        return "default"
      case "nice-to-have":
        return "secondary"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600"
    if (confidence >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const answeredQuestions = localAnalysis.questions.filter((q) => q.answer?.trim()).length
  const totalQuestions = localAnalysis.questions.length
  const acceptedAssumptions = localAnalysis.assumptions.filter((a) => a.accepted).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Analysis Results
        </CardTitle>
        <CardDescription>Review extracted information and answer clarifying questions</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="questions" className="relative">
              Questions
              {totalQuestions > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {answeredQuestions}/{totalQuestions}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="assumptions">
              Assumptions
              <Badge variant="secondary" className="ml-2 text-xs">
                {acceptedAssumptions}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Goals</h4>
                </div>
                <ul className="space-y-1 text-sm">
                  {localAnalysis.goals.map((goal, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <h4 className="font-medium">Constraints</h4>
                </div>
                <ul className="space-y-1 text-sm">
                  {localAnalysis.constraints.map((constraint, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
                      {constraint}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium">Dependencies</h4>
                </div>
                <ul className="space-y-1 text-sm">
                  {localAnalysis.dependencies.map((dependency, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Link className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                      {dependency}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <h4 className="font-medium">Edge Cases</h4>
                </div>
                <ul className="space-y-1 text-sm">
                  {localAnalysis.edgeCases.map((edgeCase, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                      {edgeCase}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            {localAnalysis.questions.map((question) => (
              <div key={question.id} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium">{question.text}</p>
                      <Badge variant={getPriorityColor(question.priority)} className="text-xs">
                        {question.priority}
                      </Badge>
                    </div>
                    <Input
                      placeholder="Your answer..."
                      value={question.answer || ""}
                      onChange={(e) => handleQuestionAnswer(question.id, e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            {localAnalysis.questions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No clarifying questions needed. The requirement is clear!
              </p>
            )}
          </TabsContent>

          <TabsContent value="assumptions" className="space-y-4">
            {localAnalysis.assumptions.map((assumption) => (
              <div key={assumption.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <Switch
                  checked={assumption.accepted}
                  onCheckedChange={(checked) => handleAssumptionToggle(assumption.id, checked)}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">{assumption.text}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Confidence:</span>
                    <span className={`text-xs font-medium ${getConfidenceColor(assumption.confidence)}`}>
                      {Math.round(assumption.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        <Button onClick={onGeneratePrompts} disabled={isGenerating} className="w-full" size="lg">
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating IDE Prompts...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Generate IDE Prompts
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
