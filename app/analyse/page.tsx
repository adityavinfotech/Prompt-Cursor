"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { AnalysisPanel } from "@/components/analysis-panel"
import { EditSection } from "@/components/edit-section"
import { IterationDisplay, type AnalysisIteration } from "@/components/iteration-display"
import { TopNavigation } from "@/components/top-navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useIterations } from "@/hooks/use-iterations"
import { compareAnalyses, getIterationSummary, calculateIterationMetrics } from "@/lib/iteration-utils"
import { Loader2, RefreshCw, CheckCircle2, TrendingUp, Download, AlertCircle } from "lucide-react"
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
          <h1 className="text-3xl font-bold mb-2">Analysis Results</h1>
          <p className="text-muted-foreground mb-4">
            Review and refine your requirement analysis
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm">
            <span className="text-muted-foreground">Powered by</span>
            <Badge variant="outline" className={cn(
              aiProvider === AI_PROVIDERS.GEMINI 
                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800"
                : "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800"
            )}>
              {aiProvider === AI_PROVIDERS.GEMINI ? "🤖 Google Gemini" : "🧠 OpenAI GPT-4"}
            </Badge>
          </div>
        </div>

        {/* Iteration Stats */}
        {iterations.length > 0 && (
          <div className="bg-card rounded-lg border p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-medium">Iteration:</span>
                  <Badge variant="outline" className="ml-2">
                    {getIterationStats().current} of {getIterationStats().total}
                  </Badge>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Satisfied:</span>
                  <Badge variant={getIterationStats().satisfied > 0 ? "default" : "secondary"} className="ml-2">
                    {getIterationStats().satisfied}
                  </Badge>
                </div>
                {hasUnsavedChanges && (
                  <Alert className="py-2 px-3 w-auto">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm ml-2">
                      You have unsaved changes
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportHistory}
                  disabled={iterations.length === 0}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="edit" className="relative">
              Edit
              {hasUnsavedChanges && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="relative">
              History
              {iterations.length > 1 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {iterations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6">
            <div className="bg-card rounded-lg border shadow-sm">
              <AnalysisPanel
                analysis={analysis}
                onUpdate={handleAnalysisUpdate}
                onGeneratePrompts={handleGeneratePrompts}
                isGenerating={isGeneratingPrompts}
              />
            </div>
            
            {/* Enhanced Iteration Controls */}
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      Iteration Controls
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {iterations[currentIteration] ? getIterationSummary(iterations[currentIteration]) : 'No iteration data'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {iterations[currentIteration]?.isUserSatisfied ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Satisfied
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkSatisfied}
                        disabled={!canIterate()}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Mark as Satisfied
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Iteration Metrics */}
                {iterations.length > 1 && (
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="text-xs text-muted-foreground mb-2">Iteration Metrics:</div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium">{calculateIterationMetrics(iterations).totalIterations}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div>
                        <div className="font-medium">{calculateIterationMetrics(iterations).satisfiedIterations}</div>
                        <div className="text-xs text-muted-foreground">Satisfied</div>
                      </div>
                      <div>
                        <div className="font-medium">{calculateIterationMetrics(iterations).averageItemsPerIteration}</div>
                        <div className="text-xs text-muted-foreground">Avg Items</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Feedback for next iteration (optional):</label>
                  <textarea
                    value={userFeedback}
                    onChange={(e) => setUserFeedback(e.target.value)}
                    placeholder="Describe what you'd like to improve or refine..."
                    className="w-full p-2 border rounded-md text-sm min-h-[80px] resize-none"
                    disabled={!canIterate()}
                  />
                </div>
                
                <Button
                  onClick={handleIterate}
                  disabled={!canIterate()}
                  className="w-full"
                >
                  {isIterating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Iteration...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Create New Iteration
                    </>
                  )}
                </Button>
                
                {!canIterate() && iterations[currentIteration]?.isUserSatisfied && (
                  <p className="text-sm text-muted-foreground text-center">
                    This iteration is marked as satisfied. No further iterations needed.
                  </p>
                )}
              </div>
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
            <IterationDisplay
              iterations={iterations}
              currentIteration={currentIteration}
              onSelectIteration={handleSelectIteration}
              onCompareIterations={handleCompareIterations}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
