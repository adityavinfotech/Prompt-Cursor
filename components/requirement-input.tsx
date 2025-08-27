"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2, Sparkles, Upload, X, FileText, Image } from "lucide-react"

interface RequirementFormData {
  taskType?: string
  goal?: string
  components?: string[]
  inputs?: string
  outputs?: string
  referenceFiles?: File[]
  referenceUrls?: string[]
  // Legacy support
  requirement?: string
  context?: string
}

interface RequirementInputProps {
  value: string
  onChange: (value: string) => void
  context?: string
  onContextChange?: (value: string) => void
  onAnalyze: () => void
  isAnalyzing: boolean
  // New props for structured data
  formData?: RequirementFormData
  onFormDataChange?: (data: RequirementFormData) => void
}

export function RequirementInput({ 
  value, 
  onChange, 
  context = "", 
  onContextChange, 
  onAnalyze, 
  isAnalyzing,
  formData = {},
  onFormDataChange
}: RequirementInputProps) {
  const [charCount, setCharCount] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [componentInput, setComponentInput] = useState("")
  const [urlInput, setUrlInput] = useState("")

  // Mock file suggestions for autocomplete
  const mockFiles = [
    "components/auth/login.tsx",
    "pages/api/auth/route.ts", 
    "lib/database.ts",
    "utils/validation.ts",
    "types/user.ts",
    "hooks/useAuth.ts"
  ]

  const handleFormDataChange = (field: keyof RequirementFormData, value: any) => {
    const newData = { ...formData, [field]: value }
    onFormDataChange?.(newData)
    
    // Update character count based on all text fields
    const textContent = [
      newData.goal || "",
      newData.inputs || "",
      newData.outputs || "",
      ...(newData.components || []),
      ...(newData.referenceUrls || [])
    ].join(" ")
    setCharCount(textContent.length)
  }

  const handleFileUpload = async (files: FileList) => {
    setUploadError(null)
    const validFiles: File[] = []
    
    for (const file of Array.from(files)) {
      const lowerName = file.name.toLowerCase()
      const isCodeFile = [".py", ".js", ".ts", ".jsx", ".tsx", ".md", ".txt"].some(ext => lowerName.endsWith(ext))
      const isImageFile = [".jpg", ".jpeg", ".png", ".svg"].some(ext => lowerName.endsWith(ext))
      
      if (!isCodeFile && !isImageFile) {
        setUploadError(`Unsupported file type: ${file.name}`)
        continue
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`File too large: ${file.name} (max 10MB)`)
        continue
      }
      
      validFiles.push(file)
    }
    
    if (validFiles.length > 0) {
      const newFiles = [...uploadedFiles, ...validFiles]
      setUploadedFiles(newFiles)
      handleFormDataChange("referenceFiles", newFiles)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    handleFormDataChange("referenceFiles", newFiles)
  }

  const addComponent = (component: string) => {
    if (component.trim()) {
      const currentComponents = formData.components || []
      if (!currentComponents.includes(component.trim())) {
        handleFormDataChange("components", [...currentComponents, component.trim()])
      }
      setComponentInput("")
    }
  }

  const removeComponent = (index: number) => {
    const currentComponents = formData.components || []
    handleFormDataChange("components", currentComponents.filter((_, i) => i !== index))
  }

  const addUrl = () => {
    if (urlInput.trim()) {
      const currentUrls = formData.referenceUrls || []
      if (!currentUrls.includes(urlInput.trim())) {
        handleFormDataChange("referenceUrls", [...currentUrls, urlInput.trim()])
      }
      setUrlInput("")
    }
  }

  const removeUrl = (index: number) => {
    const currentUrls = formData.referenceUrls || []
    handleFormDataChange("referenceUrls", currentUrls.filter((_, i) => i !== index))
  }

  const isValid = charCount >= 10 || (formData.goal && formData.goal.length >= 5)

  const getFileIcon = (fileName: string) => {
    const lowerName = fileName.toLowerCase()
    if ([".jpg", ".jpeg", ".png", ".svg"].some(ext => lowerName.endsWith(ext))) {
      return <Image className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Structured Requirement Input
        </CardTitle>
        <CardDescription>
          Provide detailed information about your development task. All fields are optional but encouraged for better analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Task Type */}
        <div className="space-y-2">
          <Label htmlFor="taskType">Task Type</Label>
          <Select value={formData.taskType || ""} onValueChange={(value) => handleFormDataChange("taskType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select the type of development task" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new-code">New Code</SelectItem>
              <SelectItem value="extend-existing">Extend Existing Code</SelectItem>
              <SelectItem value="debug-fix">Debug/Fix Bug</SelectItem>
              <SelectItem value="refactor">Refactor Code</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Goal */}
        <div className="space-y-2">
          <Label htmlFor="goal">Goal</Label>
          <Input
            id="goal"
            placeholder="e.g., Implement user authentication via OAuth"
            value={formData.goal || ""}
            onChange={(e) => handleFormDataChange("goal", e.target.value)}
            disabled={isAnalyzing}
          />
        </div>

        {/* Component/Files Affected */}
        <div className="space-y-2">
          <Label htmlFor="components">Component/File(s) Affected</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Type file path or select from suggestions..."
                value={componentInput}
                onChange={(e) => setComponentInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addComponent(componentInput)}
                disabled={isAnalyzing}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => addComponent(componentInput)}
                disabled={!componentInput.trim() || isAnalyzing}
              >
                Add
              </Button>
            </div>
            
            {/* File suggestions */}
            {componentInput && (
              <div className="flex flex-wrap gap-1">
                {mockFiles
                  .filter(file => file.toLowerCase().includes(componentInput.toLowerCase()))
                  .slice(0, 5)
                  .map(file => (
                    <Badge 
                      key={file}
                      variant="outline" 
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => addComponent(file)}
                    >
                      {file}
                    </Badge>
                  ))}
              </div>
            )}
            
            {/* Selected components */}
            {formData.components && formData.components.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.components.map((component, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {component}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeComponent(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-2">
          <Label htmlFor="inputs">Input(s)</Label>
          <Textarea
            id="inputs"
            placeholder="e.g., user_id (integer), password (string)"
            value={formData.inputs || ""}
            onChange={(e) => handleFormDataChange("inputs", e.target.value)}
            className="min-h-[80px] resize-none"
            disabled={isAnalyzing}
          />
        </div>

        {/* Expected Outputs */}
        <div className="space-y-2">
          <Label htmlFor="outputs">Expected Output(s)</Label>
          <Textarea
            id="outputs"
            placeholder="e.g., a JSON object with user details or an HTTP 401 error"
            value={formData.outputs || ""}
            onChange={(e) => handleFormDataChange("outputs", e.target.value)}
            className="min-h-[80px] resize-none"
            disabled={isAnalyzing}
          />
        </div>

        {/* Reference Code/Files */}
        <div className="space-y-4">
          <Label>Reference Code/Files</Label>
          
          {/* File Upload */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".py,.js,.ts,.jsx,.tsx,.md,.txt,.jpg,.jpeg,.png,.svg"
                multiple
                disabled={isAnalyzing}
                onChange={(e) => {
                  if (e.target.files) handleFileUpload(e.target.files)
                }}
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
          </div>

          {/* URL Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add documentation URL or reference link..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addUrl()}
              disabled={isAnalyzing}
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={addUrl}
              disabled={!urlInput.trim() || isAnalyzing}
            >
              Add URL
            </Button>
          </div>

          {/* Uploaded Files Display */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Uploaded Files:</p>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-2">
                    {getFileIcon(file.name)}
                    <span className="max-w-[200px] truncate">{file.name}</span>
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeFile(index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reference URLs Display */}
          {formData.referenceUrls && formData.referenceUrls.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Reference URLs:</p>
              <div className="space-y-1">
                {formData.referenceUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1 text-sm truncate">{url}</span>
                    <X 
                      className="h-4 w-4 cursor-pointer hover:text-destructive" 
                      onClick={() => removeUrl(index)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Legacy Support - Free Text Input */}
        <div className="space-y-2">
          <Label htmlFor="freeText">Additional Details (Optional)</Label>
          <Textarea
            id="freeText"
            placeholder="Any additional context, requirements, or specific details..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[100px] resize-none"
            disabled={isAnalyzing}
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {charCount < 10 && charCount > 0 && <Badge variant="destructive">Too short</Badge>}
              {isValid && <Badge variant="secondary">Ready to analyze</Badge>}
            </div>
            <span>{charCount} characters</span>
          </div>
        </div>

        <Button onClick={onAnalyze} disabled={!isValid || isAnalyzing} className="w-full" size="lg">
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Requirement...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Requirement
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
