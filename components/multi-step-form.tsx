"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Upload, X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
// import removed: large provider toggle UI
import { AIProvider, AI_PROVIDERS } from "@/lib/ai-types"
import type { RequirementFormData } from "@/app/page"

interface MultiStepFormProps {
  formData: RequirementFormData
  onFormDataChange: (data: RequirementFormData) => void
  onSubmit: () => void
  isAnalyzing: boolean
  aiProvider?: AIProvider
  onAIProviderChange?: (provider: AIProvider) => void
}

const TASK_TYPES = [
  "New Code",
  "Extend Existing Code", 
  "Debug/Fix Bug",
  "Refactor Code"
]

const MOCK_FILES = [
  "components/auth/login.tsx",
  "lib/auth.ts",
  "pages/api/auth.ts",
  "utils/validation.ts",
  "types/user.ts"
]

const FORM_STEPS = [
  { id: 1, title: "Task & Goal", description: "Define what you want to build" },
  { id: 2, title: "Components", description: "Specify files and components" },
  { id: 3, title: "Input & Output", description: "Define expected data flow" },
  { id: 4, title: "References", description: "Add supporting materials" },
]

export function MultiStepForm({ 
  formData, 
  onFormDataChange, 
  onSubmit, 
  isAnalyzing, 
  aiProvider = AI_PROVIDERS.GEMINI,
  onAIProviderChange 
}: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [componentInput, setComponentInput] = useState("")

  const updateFormData = (updates: Partial<RequirementFormData>) => {
    onFormDataChange({ ...formData, ...updates })
  }

  const addComponent = (component: string) => {
    if (component && !formData.components?.includes(component)) {
      updateFormData({
        components: [...(formData.components || []), component]
      })
    }
    setComponentInput("")
  }

  const removeComponent = (component: string) => {
    updateFormData({
      components: formData.components?.filter(c => c !== component) || []
    })
  }

  const addReferenceUrl = () => {
    const url = prompt("Enter reference URL:")
    if (url) {
      updateFormData({
        referenceUrls: [...(formData.referenceUrls || []), url]
      })
    }
  }

  const removeReferenceUrl = (url: string) => {
    updateFormData({
      referenceUrls: formData.referenceUrls?.filter(u => u !== url) || []
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const fileContents: { name: string; content: string; type: string }[] = []
    
    // Read file contents
    for (const file of files) {
      const lowerName = file.name.toLowerCase()
      const isCodeFile = [".py", ".js", ".ts", ".jsx", ".tsx", ".md", ".txt"].some(ext => lowerName.endsWith(ext))
      const isImageFile = [".jpg", ".jpeg", ".png", ".svg"].some(ext => lowerName.endsWith(ext))
      
      if (isCodeFile) {
        try {
          const content = await file.text()
          // Limit content size to prevent token overflow
          const truncatedContent = content.length > 50000 
            ? content.substring(0, 50000) + "\n... [Content truncated due to size]"
            : content
          
          fileContents.push({
            name: file.name,
            content: truncatedContent,
            type: file.type || 'text/plain'
          })
        } catch (error) {
          console.error(`Failed to read file ${file.name}:`, error)
        }
      } else if (isImageFile) {
        fileContents.push({
          name: file.name,
          content: `[Image file: ${file.name}]`,
          type: file.type || 'image/*'
        })
      }
    }
    
    const existingContents = formData.referenceFileContents || []
    updateFormData({
      referenceFiles: [...(formData.referenceFiles || []), ...files],
      referenceFileContents: [...existingContents, ...fileContents]
    })
  }

  const removeFile = (index: number) => {
    const newFiles = [...(formData.referenceFiles || [])]
    newFiles.splice(index, 1)
    updateFormData({ referenceFiles: newFiles })
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.taskType && formData.goal
      case 2:
        return true // Components are optional
      case 3:
        return true // Inputs/outputs are optional
      case 4:
        return true // References are optional
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < FORM_STEPS.length) {
      setCurrentStep(currentStep + 1)
    } else {
      onSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Task Type *
              </label>
              <Select 
                value={formData.taskType || ""} 
                onValueChange={(value) => updateFormData({ taskType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="What type of task is this?" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Goal *
              </label>
              <Textarea
                placeholder="Describe what you want to achieve (e.g., 'Implement user authentication with JWT tokens')"
                value={formData.goal || ""}
                onChange={(e) => updateFormData({ goal: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Components/Files Affected
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type component/file name..."
                    value={componentInput}
                    onChange={(e) => setComponentInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addComponent(componentInput)
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={() => addComponent(componentInput)}
                    disabled={!componentInput}
                  >
                    Add
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Suggestions:
                </div>
                <div className="flex flex-wrap gap-2">
                  {MOCK_FILES.map((file) => (
                    <button
                      key={file}
                      onClick={() => addComponent(file)}
                      className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded-md transition-colors"
                    >
                      {file}
                    </button>
                  ))}
                </div>

                {formData.components && formData.components.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.components.map((component) => (
                      <Badge key={component} variant="secondary" className="flex items-center gap-1">
                        {component}
                        <button
                          onClick={() => removeComponent(component)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Expected Inputs
              </label>
              <Textarea
                placeholder="Describe the inputs your solution should handle (e.g., 'user_id (integer), password (string)')"
                value={formData.inputs || ""}
                onChange={(e) => updateFormData({ inputs: e.target.value })}
                className="min-h-[80px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Expected Outputs
              </label>
              <Textarea
                placeholder="Describe the expected outputs (e.g., 'JWT token on success, error message on failure')"
                value={formData.outputs || ""}
                onChange={(e) => updateFormData({ outputs: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Reference Files
              </label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <div className="text-sm text-muted-foreground mb-2">
                  Upload code files, images, or documents
                </div>
                <input
                  type="file"
                  multiple
                  accept=".py,.js,.ts,.jsx,.tsx,.md,.txt,.jpg,.png,.svg"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  Choose Files
                </Button>
              </div>

              {formData.referenceFiles && formData.referenceFiles.length > 0 && (
                <div className="space-y-2">
                  {formData.referenceFiles.map((file: File, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Reference URLs
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={addReferenceUrl}
                className="w-full"
              >
                Add Reference URL
              </Button>

              {formData.referenceUrls && formData.referenceUrls.length > 0 && (
                <div className="space-y-2 mt-3">
                  {formData.referenceUrls.map((url, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm truncate">{url}</span>
                      <button
                        onClick={() => removeReferenceUrl(url)}
                        className="text-destructive hover:text-destructive/80 ml-2"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const currentStepData = FORM_STEPS[currentStep - 1]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {FORM_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  {
                    "bg-primary text-primary-foreground": step.id === currentStep,
                    "bg-primary/20 text-primary": step.id < currentStep,
                    "bg-muted text-muted-foreground": step.id > currentStep,
                  }
                )}
              >
                {step.id}
              </div>
              {index < FORM_STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-12 h-0.5 mx-2 transition-colors",
                    {
                      "bg-primary": step.id < currentStep,
                      "bg-muted": step.id >= currentStep,
                    }
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold">{currentStepData.title}</h2>
          <p className="text-muted-foreground text-sm">{currentStepData.description}</p>
        </div>
      </div>

      {/* Minimal LLM dropdown moved inside the form card below */}

      {/* Form Content */}
      <div className="bg-card rounded-lg border shadow-sm p-6 mb-6">
        {onAIProviderChange && (
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>LLM:</span>
              <Select value={aiProvider} onValueChange={(v) => onAIProviderChange(v as AIProvider)}>
                <SelectTrigger className="h-8 w-[180px] px-2 text-xs">
                  <SelectValue placeholder="Choose model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AI_PROVIDERS.GEMINI}>Google Gemini — fast, concise</SelectItem>
                  <SelectItem value={AI_PROVIDERS.OPENAI}>OpenAI GPT-4 — accurate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <div className="transition-all duration-300 ease-in-out">
          {renderStep()}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed() || isAnalyzing}
          className="flex items-center gap-2"
        >
          {currentStep === FORM_STEPS.length ? (
            isAnalyzing ? "Analyzing..." : "Analyze Requirement"
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
