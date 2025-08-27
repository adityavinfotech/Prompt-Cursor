"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MultiStepForm } from "@/components/multi-step-form"
import { TopNavigation } from "@/components/top-navigation"

export interface RequirementFormData {
  taskType?: string
  goal?: string
  components?: string[]
  inputs?: string
  outputs?: string
  referenceFiles?: File[]
  referenceUrls?: string[]
  requirement?: string
  context?: string
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

export interface Analysis {
  goals: string[]
  constraints: string[]
  dependencies: string[]
  edgeCases: string[]
  acceptanceCriteria: string[]
  questions: Question[]
  assumptions: Assumption[]
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
  formData?: RequirementFormData
  analysis?: Analysis
  prompts?: GeneratedPrompts
  editedPrompts?: EditedPrompts
}

export default function Home() {
  const router = useRouter()
  const [formData, setFormData] = useState<RequirementFormData>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    // Load saved form data from localStorage
    const savedFormData = localStorage.getItem("currentFormData")
    if (savedFormData) {
      try {
        setFormData(JSON.parse(savedFormData))
      } catch (error) {
        console.error("Failed to parse saved form data:", error)
      }
    }
  }, [])

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("currentFormData", JSON.stringify(formData))
  }, [formData])

  const handleAnalyze = async () => {
    setIsAnalyzing(true)

    try {
      // Build requirement text from form data if needed
      let requirementText = ""
      if (formData.goal) {
        const parts: string[] = []
        if (formData.taskType) parts.push(`Task Type: ${formData.taskType}`)
        if (formData.goal) parts.push(`Goal: ${formData.goal}`)
        if (formData.components && formData.components.length > 0) {
          parts.push(`Components/Files Affected: ${formData.components.join(', ')}`)
        }
        if (formData.inputs) parts.push(`Expected Inputs: ${formData.inputs}`)
        if (formData.outputs) parts.push(`Expected Outputs: ${formData.outputs}`)
        if (formData.referenceUrls && formData.referenceUrls.length > 0) {
          parts.push(`Reference URLs: ${formData.referenceUrls.join(', ')}`)
        }
        if (formData.referenceFiles && formData.referenceFiles.length > 0) {
          const fileNames = formData.referenceFiles.map(f => f.name).join(', ')
          parts.push(`Reference Files: ${fileNames}`)
        }
        requirementText = parts.join('\n')
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirement: requirementText,
          context: "",
          formData,
        }),
      })

      if (response.ok) {
        const { data: analysis } = await response.json()
        
        // Save analysis and requirement data to localStorage
        localStorage.setItem("currentAnalysis", JSON.stringify(analysis))
        localStorage.setItem("currentRequirement", requirementText)
        
        // Navigate to analysis page
        router.push("/analyse")
      } else {
        const error = await response.json()
        console.error("Analysis failed:", error)
        alert("Analysis failed. Please try again.")
      }
    } catch (error) {
      console.error("Analysis error:", error)
      alert("Analysis failed. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation currentStep="requirement" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Prompt Architect</h1>
          <p className="text-muted-foreground">
            Transform your ideas into structured, IDE-optimized prompts
          </p>
        </div>

        <MultiStepForm
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={handleAnalyze}
          isAnalyzing={isAnalyzing}
        />
      </div>
    </div>
  )
}
