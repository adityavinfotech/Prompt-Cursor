"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TopNavigation } from "@/components/top-navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Copy, Download, Edit, Save, X, Sparkles, CheckCircle, Code, Terminal, Zap } from "lucide-react"
import type { GeneratedPrompts, EditedPrompts, Analysis } from "@/app/page"
import { ImprovePromptInputDialog } from "@/components/improve-prompt-input-dialog"

const IDE_OPTIONS = [
  { value: "cursor", label: "Cursor IDE" },
  { value: "copilot", label: "GitHub Copilot" },
  { value: "warp", label: "Warp Terminal" },
  { value: "windsurf", label: "Windsurf IDE" },
]

export default function PromptsPage() {
  const router = useRouter()
  const [prompts, setPrompts] = useState<GeneratedPrompts | null>(null)
  const [editedPrompts, setEditedPrompts] = useState<EditedPrompts>({})
  const [selectedIDE, setSelectedIDE] = useState<string>("cursor")
  const [isLoading, setIsLoading] = useState(true)
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<Record<string, boolean>>({})
  const [tempEditContent, setTempEditContent] = useState<Record<string, string>>({})
  const [improveDialogOpen, setImproveDialogOpen] = useState(false)
  const [currentImproveIde, setCurrentImproveIde] = useState<keyof GeneratedPrompts | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Load prompts from localStorage
    const savedPrompts = localStorage.getItem("currentPrompts")
    const savedEditedPrompts = localStorage.getItem("currentEditedPrompts")

    if (savedPrompts) {
      setPrompts(JSON.parse(savedPrompts))
    }
    if (savedEditedPrompts) {
      setEditedPrompts(JSON.parse(savedEditedPrompts))
    }

    setIsLoading(false)

    // If no prompts data, redirect to home
    if (!savedPrompts) {
      router.push("/")
    }
  }, [router])

  // Save edited prompts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("currentEditedPrompts", JSON.stringify(editedPrompts))
  }, [editedPrompts])

  const getCurrentPrompt = () => {
    if (!prompts) return ""
    const ideKey = selectedIDE as keyof GeneratedPrompts
    return editedPrompts[ideKey] || prompts[ideKey] || ""
  }

  const getCurrentContent = (ide: keyof GeneratedPrompts): string => {
    if (!prompts) return ""
    return editedPrompts[ide] || prompts[ide] || ""
  }

  const handleCopyPrompt = async (ideType?: keyof GeneratedPrompts) => {
    const prompt = ideType ? getCurrentContent(ideType) : getCurrentPrompt()
    const type = ideType || selectedIDE
    
    if (prompt) {
      try {
        await navigator.clipboard.writeText(prompt)
        setCopiedPrompt(type)
        toast({
          title: "Copied to clipboard",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} prompt copied successfully`,
        })
        setTimeout(() => setCopiedPrompt(null), 2000)
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Failed to copy prompt to clipboard",
          variant: "destructive",
        })
      }
    }
  }

  const handleDownloadPrompt = () => {
    const prompt = getCurrentPrompt()
    const selectedIDEData = IDE_OPTIONS.find(ide => ide.value === selectedIDE)
    
    if (prompt && selectedIDEData) {
      const blob = new Blob([prompt], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${selectedIDEData.label.replace(" ", "_")}_prompt.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleEditToggle = (ide: keyof GeneratedPrompts) => {
    const isEditing = editMode[ide]
    if (isEditing) {
      // Save the edit
      const newContent = tempEditContent[ide] || getCurrentContent(ide)
      setEditedPrompts(prev => ({ ...prev, [ide]: newContent }))
      setEditMode(prev => ({ ...prev, [ide]: false }))
      toast({
        title: "Changes saved",
        description: `${ide.charAt(0).toUpperCase() + ide.slice(1)} prompt has been updated`,
      })
    } else {
      // Start editing
      setTempEditContent(prev => ({ ...prev, [ide]: getCurrentContent(ide) }))
      setEditMode(prev => ({ ...prev, [ide]: true }))
    }
  }

  const handleCancelEdit = (ide: keyof GeneratedPrompts) => {
    setEditMode(prev => ({ ...prev, [ide]: false }))
    setTempEditContent(prev => ({ ...prev, [ide]: getCurrentContent(ide) }))
  }

  const handleImproveClick = (ide: keyof GeneratedPrompts) => {
    setCurrentImproveIde(ide)
    setImproveDialogOpen(true)
  }

  const handlePromptImproved = (improvedPrompt: string) => {
    if (currentImproveIde) {
      setEditedPrompts(prev => ({ ...prev, [currentImproveIde]: improvedPrompt }))
    }
  }

  const handleStartOver = () => {
    // Clear all localStorage data
    localStorage.removeItem("currentAnalysis")
    localStorage.removeItem("currentRequirement")
    localStorage.removeItem("currentFormData")
    localStorage.removeItem("currentPrompts")
    localStorage.removeItem("currentEditedPrompts")
    router.push("/")
  }

  const getIdeIcon = (ide: string) => {
    switch (ide) {
      case "cursor":
        return <Code className="h-4 w-4" />
      case "copilot":
        return <Zap className="h-4 w-4" />
      case "warp":
        return <Terminal className="h-4 w-4" />
      case "windsurf":
        return <Code className="h-4 w-4" />
      default:
        return <Code className="h-4 w-4" />
    }
  }

  const getIdeColor = (ide: string) => {
    switch (ide) {
      case "cursor":
        return "bg-blue-500"
      case "copilot":
        return "bg-green-500"
      case "warp":
        return "bg-purple-500"
      case "windsurf":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation currentStep="prompt" />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">Loading prompts...</div>
        </div>
      </div>
    )
  }

  if (!prompts) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation currentStep="prompt" />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No prompts found</p>
            <button 
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Start New Session
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation currentStep="prompt" />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Generated Prompts</h1>
          <p className="text-muted-foreground">
            Edit, improve, and copy IDE-optimized prompts
          </p>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-6">
          {/* Quick IDE Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Quick Select IDE
            </label>
            <Select value={selectedIDE} onValueChange={setSelectedIDE}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Choose your IDE" />
              </SelectTrigger>
              <SelectContent>
                {IDE_OPTIONS.map((ide) => (
                  <SelectItem key={ide.value} value={ide.value}>
                    {ide.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs for All IDEs */}
          <Tabs defaultValue="cursor" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              {Object.keys(prompts).map((ide) => (
                <TabsTrigger key={ide} value={ide} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getIdeColor(ide)}`} />
                  {ide.charAt(0).toUpperCase() + ide.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(prompts).map(([ide, content]) => {
              const ideKey = ide as keyof GeneratedPrompts
              const currentContent = getCurrentContent(ideKey)
              const isEdited = !!editedPrompts[ideKey]
              const isEditing = editMode[ide]
              
              return (
                <TabsContent key={ide} value={ide} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getIdeIcon(ide)}
                      <h3 className="font-medium">{ide.charAt(0).toUpperCase() + ide.slice(1)} Prompt</h3>
                      <Badge variant="secondary" className="text-xs">
                        {currentContent.length} chars
                      </Badge>
                      {isEdited && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                          Modified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleImproveClick(ideKey)}
                        className="flex items-center gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        Improve
                      </Button>
                      {isEditing ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelEdit(ideKey)}
                            className="flex items-center gap-2"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleEditToggle(ideKey)}
                            className="flex items-center gap-2"
                          >
                            <Save className="h-4 w-4" />
                            Save
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditToggle(ideKey)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyPrompt(ideKey)}
                        className="flex items-center gap-2"
                      >
                        {copiedPrompt === ide ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadPrompt}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <Textarea 
                    value={isEditing ? (tempEditContent[ide] || currentContent) : currentContent}
                    onChange={(e) => isEditing && setTempEditContent(prev => ({ ...prev, [ide]: e.target.value }))}
                    readOnly={!isEditing}
                    className={`min-h-[400px] font-mono text-sm resize-none ${
                      isEditing ? 'border-primary' : ''
                    } ${
                      isEdited && !isEditing ? 'bg-yellow-50/50 border-yellow-200' : ''
                    }`}
                  />
                </TabsContent>
              )
            })}
          </Tabs>

          {/* Actions */}
          <div className="flex justify-center gap-4 mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => router.push("/analyse")}
            >
              Back to Analysis
            </Button>
            <Button
              variant="outline"
              onClick={handleStartOver}
            >
              Start New Session
            </Button>
          </div>
        </div>
      </div>

      <ImprovePromptInputDialog
        open={improveDialogOpen}
        onOpenChange={setImproveDialogOpen}
        originalPrompt={currentImproveIde ? getCurrentContent(currentImproveIde) : ""}
        ideType={currentImproveIde || "cursor"}
        onPromptImproved={handlePromptImproved}
        requirement=""
        analysis={undefined}
      />
    </div>
  )
}
