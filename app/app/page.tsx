"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MultiStepForm } from "@/components/multi-step-form"
import { TopNavigation } from "@/components/top-navigation"
import type { RequirementFormData } from "@/app/page"

export default function AppPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<RequirementFormData>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
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
    if (isMounted) {
      localStorage.setItem("currentFormData", JSON.stringify(formData))
    }
  }, [formData, isMounted])

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
          const fileNames = formData.referenceFiles.map((f: File) => f.name).join(', ')
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

  if (!isMounted) {
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

          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </div>
    )
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
