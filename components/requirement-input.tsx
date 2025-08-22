"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Sparkles } from "lucide-react"

interface RequirementInputProps {
  value: string
  onChange: (value: string) => void
  context?: string
  onContextChange?: (value: string) => void
  onAnalyze: () => void
  isAnalyzing: boolean
}

export function RequirementInput({ value, onChange, context = "", onContextChange, onAnalyze, isAnalyzing }: RequirementInputProps) {
  const [charCount, setCharCount] = useState(0)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleChange = (newValue: string) => {
    onChange(newValue)
    setCharCount(newValue.length)
  }

  const isValid = value.trim().length >= 10 && value.trim().length <= 200000

  const handleFileUpload = async (file: File) => {
    setUploadError(null)
    const lowerName = file.name.toLowerCase()
    const isAllowedExt = lowerName.endsWith(".md") || lowerName.endsWith(".txt")
    if (!isAllowedExt) {
      setUploadError("Only .md or .txt files are supported")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("File too large (max 2 MB)")
      return
    }
    try {
      const text = await file.text()
      // Treat uploaded file as supplemental context, not the main requirement
      onContextChange?.(text)
      setCharCount((value || "").length + text.length)
      setUploadedFileName(file.name)
    } catch (e) {
      setUploadError("Failed to read file")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Requirement Input
        </CardTitle>
        <CardDescription>
          Paste your plain-text feature requirement. Be as detailed as possible for better analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".md,.txt,text/markdown,text/plain"
              disabled={isAnalyzing}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileUpload(f)
              }}
            />
            {uploadedFileName && (
              <Badge variant="secondary" className="whitespace-nowrap max-w-[50%] overflow-hidden text-ellipsis">
                {uploadedFileName}
              </Badge>
            )}
            {uploadedFileName && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUploadedFileName(null)
                  setUploadError(null)
                }}
              >
                Clear
              </Button>
            )}
          </div>
          {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
          <Textarea
            placeholder="Example: Add OAuth login with Google and GitHub. Users should be able to sign in securely and be redirected to their dashboard. Include proper error handling for failed authentication attempts."
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="min-h-[120px] resize-none"
            disabled={isAnalyzing}
          />
          {onContextChange && (
            <Textarea
              placeholder="Optional: additional context from README or docs (auto-filled on upload)"
              value={context}
              onChange={(e) => onContextChange(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isAnalyzing}
            />
          )}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {charCount < 10 && charCount > 0 && <Badge variant="destructive">Too short</Badge>}
              {charCount > 200000 && <Badge variant="destructive">Too long</Badge>}
              {isValid && <Badge variant="secondary">Ready to analyze</Badge>}
            </div>
            <span>{charCount}/200000</span>
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
