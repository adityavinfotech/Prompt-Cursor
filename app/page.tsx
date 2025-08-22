"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { RequirementInput } from "@/components/requirement-input"
import { AnalysisPanel } from "@/components/analysis-panel"
import { PromptsPanel } from "@/components/prompts-panel"
import { HistoryPanel } from "@/components/history-panel"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, History, AlertCircle } from "lucide-react"

export interface Analysis {
  goals: string[]
  constraints: string[]
  dependencies: string[]
  edgeCases: string[]
  acceptanceCriteria: string[]
  questions: Question[]
  assumptions: Assumption[]
}

export interface Question {
  id: string
  text: string
  priority: "critical" | "important" | "nice-to-have"
  answer?: string
}

export interface Assumption {
  id: string
  text: string
  confidence: number
  accepted: boolean
}

export interface GeneratedPrompts {
  cursor: string
  copilot: string
  warp: string
  windsurf: string
}

export interface EditedPrompts {
  cursor?: string
  copilot?: string
  warp?: string
  windsurf?: string
}

export interface Session {
  id: string
  timestamp: Date
  requirement: string
  analysis?: Analysis
  prompts?: GeneratedPrompts
  editedPrompts?: EditedPrompts
}

export default function Home() {
  const [requirement, setRequirement] = useState("")
  const [context, setContext] = useState("")
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [prompts, setPrompts] = useState<GeneratedPrompts | null>(null)
  const [editedPrompts, setEditedPrompts] = useState<EditedPrompts>({})
  const [sessions, setSessions] = useState<Session[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeView, setActiveView] = useState<"main" | "history">("main")
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!requirement.trim()) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requirement, context }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze requirement')
      }

      setAnalysis(result.data)
    } catch (error) {
      console.error('Analysis error:', error)
      setError(error instanceof Error ? error.message : 'Failed to analyze requirement. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGeneratePrompts = async () => {
    if (!analysis) return

    setIsGenerating(true)
    setError(null)

    try {
      // Get answered questions and accepted assumptions
      const answeredQuestions = analysis.questions.filter(q => q.answer?.trim())
      const acceptedAssumptions = analysis.assumptions.filter(a => a.accepted)

      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requirement,
          analysis,
          answeredQuestions,
          acceptedAssumptions,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate prompts')
      }

      setPrompts(result.data)

      // Add to session history
      const newSession: Session = {
        id: Date.now().toString(),
        timestamp: new Date(),
        requirement,
        analysis,
        prompts: result.data,
        editedPrompts: {}, // Start with empty edited prompts
      }
      setSessions((prev) => [newSession, ...prev])
    } catch (error) {
      console.error('Prompt generation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate prompts. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUpdateAnalysis = (updatedAnalysis: Analysis) => {
    setAnalysis(updatedAnalysis)
    setPrompts(null) // Clear prompts when analysis changes
    setEditedPrompts({}) // Clear edited prompts when analysis changes
  }

  const handleEditPrompt = (ideType: keyof GeneratedPrompts, editedContent: string) => {
    setEditedPrompts(prev => ({
      ...prev,
      [ideType]: editedContent
    }))
  }

  const handleImprovePrompt = (ideType: keyof GeneratedPrompts, improvedPrompt: string) => {
    setEditedPrompts(prev => ({
      ...prev,
      [ideType]: improvedPrompt
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeView === "main" ? "default" : "outline"}
            onClick={() => setActiveView("main")}
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            Prompt Generator
          </Button>
          <Button
            variant={activeView === "history" ? "default" : "outline"}
            onClick={() => setActiveView("history")}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            History ({sessions.length})
          </Button>
        </div>

        {activeView === "main" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <RequirementInput
                value={requirement}
                onChange={setRequirement}
                context={context}
                onContextChange={setContext}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {analysis && (
                <AnalysisPanel
                  analysis={analysis}
                  onUpdate={handleUpdateAnalysis}
                  onGeneratePrompts={handleGeneratePrompts}
                  isGenerating={isGenerating}
                />
              )}
            </div>

            <div>
              {prompts && (
                <PromptsPanel
                  prompts={prompts}
                  editedPrompts={editedPrompts}
                  onEditPrompt={handleEditPrompt}
                  onImprovePrompt={handleImprovePrompt}
                  requirement={requirement}
                  analysis={analysis}
                />
              )}
            </div>
          </div>
        ) : (
          <HistoryPanel
            sessions={sessions}
            onLoadSession={(session) => {
              setRequirement(session.requirement)
              setAnalysis(session.analysis || null)
              setPrompts(session.prompts || null)
              setEditedPrompts(session.editedPrompts || {})
              setActiveView("main")
            }}
          />
        )}
      </div>
    </div>
  )
}
