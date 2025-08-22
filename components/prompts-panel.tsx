"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Copy, Download, Share, Code, Terminal, Zap, CheckCircle, Edit, Save, X, Sparkles } from "lucide-react"
import { ImprovePromptDialog } from "@/components/improve-prompt-dialog"
import type { GeneratedPrompts, EditedPrompts, Analysis } from "@/app/page"

interface PromptsPanelProps {
  prompts: GeneratedPrompts
  editedPrompts: EditedPrompts
  onEditPrompt: (ideType: keyof GeneratedPrompts, editedContent: string) => void
  onImprovePrompt: (ideType: keyof GeneratedPrompts, improvedPrompt: string) => void
  requirement?: string
  analysis?: Analysis | null
}

export function PromptsPanel({ 
  prompts, 
  editedPrompts, 
  onEditPrompt, 
  onImprovePrompt, 
  requirement, 
  analysis 
}: PromptsPanelProps) {
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<Record<string, boolean>>({})
  const [tempEditContent, setTempEditContent] = useState<Record<string, string>>({})
  const [improveDialogOpen, setImproveDialogOpen] = useState(false)
  const [currentImproveIde, setCurrentImproveIde] = useState<keyof GeneratedPrompts | null>(null)
  const { toast } = useToast()

  const getCurrentContent = (ide: keyof GeneratedPrompts): string => {
    return editedPrompts[ide] || prompts[ide]
  }

  const handleCopy = async (promptType: keyof GeneratedPrompts, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedPrompt(promptType)
      toast({
        title: "Copied to clipboard",
        description: `${promptType.charAt(0).toUpperCase() + promptType.slice(1)} prompt copied successfully`,
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

  const handleEditToggle = (ide: keyof GeneratedPrompts) => {
    const isEditing = editMode[ide]
    if (isEditing) {
      // Save the edit
      const newContent = tempEditContent[ide] || getCurrentContent(ide)
      onEditPrompt(ide, newContent)
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
      onImprovePrompt(currentImproveIde, improvedPrompt)
    }
  }

  const handleExport = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      prompts,
      editedPrompts,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ide-prompts-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Export successful",
      description: "Prompts exported as JSON file",
    })
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Generated Prompts
            </CardTitle>
            <CardDescription>IDE-specific prompts optimized for each tool's capabilities</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
                      onClick={() => handleCopy(ideKey, currentContent)}
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
                  </div>
                </div>

                <Textarea 
                  value={isEditing ? (tempEditContent[ide] || currentContent) : currentContent}
                  onChange={(e) => isEditing && setTempEditContent(prev => ({ ...prev, [ide]: e.target.value }))}
                  readOnly={!isEditing}
                  className={`min-h-[300px] font-mono text-sm resize-none ${
                    isEditing ? 'border-primary' : ''
                  } ${
                    isEdited && !isEditing ? 'bg-yellow-50/50 border-yellow-200' : ''
                  }`}
                />
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
      
      <ImprovePromptDialog
        open={improveDialogOpen}
        onOpenChange={setImproveDialogOpen}
        originalPrompt={currentImproveIde ? getCurrentContent(currentImproveIde) : ""}
        ideType={currentImproveIde || "cursor"}
        onPromptImproved={handlePromptImproved}
        requirement={requirement}
        analysis={analysis}
      />
    </Card>
  )
}
