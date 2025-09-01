"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { AnalysisPanel } from "@/components/analysis-panel"
import { EditSection } from "@/components/edit-section"
import { IterationDisplay, type AnalysisIteration } from "@/components/iteration-display"
import { IterationTimeline } from "@/components/iteration-timeline"
import { GuidedFeedback } from "@/components/guided-feedback"
import { TopNavigation } from "@/components/top-navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useIterations } from "@/hooks/use-iterations"
import { compareAnalyses, getIterationSummary, calculateIterationMetrics } from "@/lib/iteration-utils"
import { Loader2, RefreshCw, CheckCircle2, Download } from "lucide-react"
import { AIProvider, AI_PROVIDERS } from "@/lib/ai-types"
import type { Analysis, RequirementFormData } from "@/app/page"

export default function AnalysePage() {
  const router = useRouter()
  const { toast } = useToast()
  const syncInProgress = useRef(false)
  
  // Original state
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [requirement, setRequirement] = useState("")
  const [formData, setFormData] = useState<RequirementFormData>({})
  const [aiProvider, setAIProvider] = useState<AIProvider>(AI_PROVIDERS.GEMINI)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false)
  const [activeTab, setActiveTab] = useState("analysis")
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  
  // Use the iterations hook for enhanced state management
  const {
    iterations,
    currentIteration,
    isIterating,
    userFeedback,
    setUserFeedback,
    createIteration,
    selectIteration,
    markSatisfied,
    getCurrentAnalysis,
    hasUnsavedChanges,
    saveCurrentIteration,
    canIterate,
    getIterationStats
  } = useIterations({ initialAnalysis: analysis || undefined, requirement, formData, aiProvider })

  useEffect(() => {
    // Load data from localStorage
    const savedAnalysis = localStorage.getItem("currentAnalysis")
    const savedRequirement = localStorage.getItem("currentRequirement")
    const savedFormData = localStorage.getItem("currentFormData")
    const savedAIProvider = localStorage.getItem("currentAIProvider")

    if (savedAnalysis) {
      setAnalysis(JSON.parse(savedAnalysis))
    }
    if (savedRequirement) {
      setRequirement(savedRequirement)
    }
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData))
    }
    if (savedAIProvider && (savedAIProvider === AI_PROVIDERS.GEMINI || savedAIProvider === AI_PROVIDERS.OPENAI)) {
      setAIProvider(savedAIProvider as AIProvider)
    }

    setIsLoading(false)
    setIsDataLoaded(true)

    // If no analysis data, redirect to home
    if (!savedAnalysis) {
      router.push("/")
    }
  }, [router])

  // Sync analysis with current iteration - Fixed race condition
  useEffect(() => {
    if (!isDataLoaded || syncInProgress.current) return
    
    const currentAnalysis = getCurrentAnalysis()
    if (currentAnalysis) {
      const currentStr = JSON.stringify(currentAnalysis)
      const analysisStr = JSON.stringify(analysis)
      
      if (currentStr !== analysisStr) {
        setAnalysis(currentAnalysis)
      }
    }
  }, [currentIteration, isDataLoaded])

  const handleAnalysisUpdate = (updatedAnalysis: Analysis) => {
    setAnalysis(updatedAnalysis)
    saveCurrentIteration(updatedAnalysis)
  }

  const handleEditSave = (editedAnalysis: Partial<Analysis>) => {
    if (!analysis) return
    
    // Handle both partial and complete analysis updates
    const updatedAnalysis: Analysis = {
      goals: editedAnalysis.goals || analysis.goals,
      constraints: editedAnalysis.constraints || analysis.constraints,
      dependencies: editedAnalysis.dependencies || analysis.dependencies,
      edgeCases: editedAnalysis.edgeCases || analysis.edgeCases,
      acceptanceCriteria: editedAnalysis.acceptanceCriteria || analysis.acceptanceCriteria,
      questions: editedAnalysis.questions || analysis.questions,
      assumptions: editedAnalysis.assumptions || analysis.assumptions,
    }
    
    handleAnalysisUpdate(updatedAnalysis)
    // Persist user edits on the current iteration so the next iteration incorporates them
    try {
      const savedIterations = localStorage.getItem("currentIterations")
      if (savedIterations) {
        const parsed = JSON.parse(savedIterations)
        if (parsed?.[currentIteration]) {
          parsed[currentIteration].userEdits = editedAnalysis
          localStorage.setItem("currentIterations", JSON.stringify(parsed))
        }
      }
    } catch {}
    
    toast({
      title: "Analysis Updated",
      description: "Your changes have been saved successfully."
    })
  }

  const handleIterate = async () => {
    const success = await createIteration()
    
    if (success) {
      const stats = getIterationStats()
      toast({
        title: "Analysis Iterated",
        description: `Created iteration ${stats.current} with refined analysis.`
      })
      setActiveTab("analysis") // Switch back to analysis tab
    } else {
      toast({
        title: "Iteration Failed",
        description: "Failed to create new iteration. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleSelectIteration = (index: number) => {
    selectIteration(index)
    setActiveTab("analysis") // Switch to analysis tab when selecting iteration
  }

  const handleMarkSatisfied = () => {
    markSatisfied()
    toast({
      title: "Analysis Approved",
      description: "You've marked this analysis as satisfactory."
    })
  }

  const handleExportHistory = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      requirement,
      formData,
      iterations: iterations.map(iter => ({
        iterationNumber: iter.iterationNumber,
        timestamp: iter.timestamp,
        isUserSatisfied: iter.isUserSatisfied,
        userFeedback: iter.userFeedback,
        summary: getIterationSummary(iter),
        analysis: iter.analysis
      }))
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analysis-iterations-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Export Complete",
      description: "Iteration history has been exported successfully."
    })
  }

  const handleCompareIterations = (iter1: number, iter2: number) => {
    if (iter1 < iterations.length && iter2 < iterations.length) {
      const comparison = compareAnalyses(iterations[iter1].analysis, iterations[iter2].analysis)
      console.log('Iteration comparison:', comparison)
      // You could show this in a modal or dedicated comparison view
      toast({
        title: "Comparison Ready",
        description: `Comparing iteration ${iter1 + 1} with iteration ${iter2 + 1}`
      })
    }
  }

  const handleGeneratePrompts = async () => {
    if (!analysis) return

    setIsGeneratingPrompts(true)
    
    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirement,
          formData,
          analysis,
          answeredQuestions: analysis.questions.filter(q => q.answer?.trim()),
          acceptedAssumptions: analysis.assumptions.filter(a => a.accepted),
          provider: aiProvider,
        }),
      })

      if (response.ok) {
        const { data: prompts } = await response.json()
        localStorage.setItem("currentPrompts", JSON.stringify(prompts))
        
        toast({
          title: "Prompts Generated",
          description: "IDE-specific prompts have been generated successfully!"
        })
        
        router.push("/prompts")
      } else {
        throw new Error("Failed to generate prompts")
      }
    } catch (error) {
      console.error("Failed to generate prompts:", error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate IDE prompts. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingPrompts(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">Loading analysis...</div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No analysis data found</p>
            <button 
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Start New Analysis
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation currentStep="analyse" />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2">Analysis</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Review and refine your analysis
          </p>
        </div>

        {/* Simplified Iteration Timeline */}
        <IterationTimeline 
          iterations={iterations}
          currentIteration={currentIteration}
          onSelectIteration={handleSelectIteration}
        />

        {/* Simplified Alert */}
        {hasUnsavedChanges && (
          <div className="text-sm text-amber-600 dark:text-amber-400 mb-6 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md">
            Unsaved changes will be included in the next iteration
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="analysis" className="text-sm">Analysis</TabsTrigger>
            <TabsTrigger value="edit" className="text-sm relative">
              Edit
              {hasUnsavedChanges && (
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="text-sm">History</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6">
            <div className="bg-card rounded-lg border">
              <AnalysisPanel
                analysis={analysis}
                onUpdate={handleAnalysisUpdate}
                onGeneratePrompts={handleGeneratePrompts}
                isGenerating={isGeneratingPrompts}
              />
            </div>
            
            {/* Simplified Iteration Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Refine Analysis</h3>
                {iterations[currentIteration]?.isUserSatisfied ? (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Complete
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkSatisfied}
                    disabled={!canIterate()}
                    className="h-8 text-xs"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Mark Complete
                  </Button>
                )}
              </div>
              
              <GuidedFeedback
                value={userFeedback}
                onChange={setUserFeedback}
                disabled={!canIterate()}
              />
              
              <Button
                onClick={handleIterate}
                disabled={!canIterate()}
                className="w-full h-10"
              >
                {isIterating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Create Iteration {iterations.length + 1}
                  </>
                )}
              </Button>
              
              {!canIterate() && iterations[currentIteration]?.isUserSatisfied && (
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-md">
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Analysis complete! Ready to generate prompts.
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="edit">
            <EditSection
              analysis={analysis}
              onSave={handleEditSave}
              onCancel={() => setIsEditing(false)}
              isEditing={isEditing}
              onToggleEdit={() => setIsEditing(!isEditing)}
            />
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Version History</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportHistory}
                  disabled={iterations.length === 0}
                  className="h-8 text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
              <IterationDisplay
                iterations={iterations}
                currentIteration={currentIteration}
                onSelectIteration={handleSelectIteration}
                onCompareIterations={handleCompareIterations}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
