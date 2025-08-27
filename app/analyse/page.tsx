"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AnalysisPanel } from "@/components/analysis-panel"
import { TopNavigation } from "@/components/top-navigation"
import type { Analysis, RequirementFormData } from "@/app/page"

export default function AnalysePage() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [requirement, setRequirement] = useState("")
  const [formData, setFormData] = useState<RequirementFormData>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load data from localStorage
    const savedAnalysis = localStorage.getItem("currentAnalysis")
    const savedRequirement = localStorage.getItem("currentRequirement")
    const savedFormData = localStorage.getItem("currentFormData")

    if (savedAnalysis) {
      setAnalysis(JSON.parse(savedAnalysis))
    }
    if (savedRequirement) {
      setRequirement(savedRequirement)
    }
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData))
    }

    setIsLoading(false)

    // If no analysis data, redirect to home
    if (!savedAnalysis) {
      router.push("/")
    }
  }, [router])

  const handleAnalysisUpdate = (updatedAnalysis: Analysis) => {
    setAnalysis(updatedAnalysis)
    localStorage.setItem("currentAnalysis", JSON.stringify(updatedAnalysis))
  }

  const handleGeneratePrompts = async () => {
    if (!analysis) return

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
        }),
      })

      if (response.ok) {
        const { data: prompts } = await response.json()
        localStorage.setItem("currentPrompts", JSON.stringify(prompts))
        router.push("/prompts")
      }
    } catch (error) {
      console.error("Failed to generate prompts:", error)
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
          <p className="text-muted-foreground">
            Review and refine your requirement analysis
          </p>
        </div>

        <div className="bg-card rounded-lg border shadow-sm">
          <AnalysisPanel
            analysis={analysis}
            onUpdate={handleAnalysisUpdate}
            onGeneratePrompts={handleGeneratePrompts}
            isGenerating={false}
          />
        </div>
      </div>
    </div>
  )
}
