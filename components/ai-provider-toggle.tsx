"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bot, Brain, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { AIProvider, AI_PROVIDERS } from "@/lib/ai-types"

interface AIProviderToggleProps {
  provider: AIProvider
  onProviderChange: (provider: AIProvider) => void
  className?: string
}

export function AIProviderToggle({ provider, onProviderChange, className }: AIProviderToggleProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleProvider = () => {
    const newProvider = provider === AI_PROVIDERS.GEMINI ? AI_PROVIDERS.OPENAI : AI_PROVIDERS.GEMINI
    onProviderChange(newProvider)
  }

  const getProviderInfo = (provider: AIProvider) => {
    switch (provider) {
      case AI_PROVIDERS.GEMINI:
        return {
          name: "Google Gemini",
          icon: <Bot className="w-4 h-4" />,
          color: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-950/20",
          borderColor: "border-blue-200 dark:border-blue-800",
          description: "Advanced AI model for comprehensive analysis"
        }
      case AI_PROVIDERS.OPENAI:
        return {
          name: "OpenAI GPT-4",
          icon: <Brain className="w-4 h-4" />,
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-950/20",
          borderColor: "border-green-200 dark:border-green-800",
          description: "Powerful language model for detailed insights"
        }
      default:
        return {
          name: "Unknown",
          icon: <Sparkles className="w-4 h-4" />,
          color: "text-gray-600",
          bgColor: "bg-gray-50 dark:bg-gray-950/20",
          borderColor: "border-gray-200 dark:border-gray-800",
          description: "AI provider not specified"
        }
    }
  }

  const currentProviderInfo = getProviderInfo(provider)

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-muted-foreground">
          AI Provider
        </Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 px-2 text-xs"
        >
          {isOpen ? "Hide Details" : "Show Details"}
        </Button>
      </div>

      {/* Main Toggle */}
      <Card className={cn(
        "border-2 transition-all duration-200 hover:shadow-md",
        currentProviderInfo.borderColor,
        currentProviderInfo.bgColor
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", currentProviderInfo.bgColor)}>
                <span className={currentProviderInfo.color}>
                  {currentProviderInfo.icon}
                </span>
              </div>
              <div>
                <div className="font-medium text-sm">{currentProviderInfo.name}</div>
                <div className="text-xs text-muted-foreground">
                  {currentProviderInfo.description}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={provider === AI_PROVIDERS.OPENAI}
                onCheckedChange={toggleProvider}
                className="data-[state=checked]:bg-green-600"
              />
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs",
                  provider === AI_PROVIDERS.GEMINI ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                  "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                )}
              >
                {provider === AI_PROVIDERS.GEMINI ? "Gemini" : "GPT-4"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information */}
      {isOpen && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Card className={cn(
              "border-2 transition-all duration-200",
              provider === AI_PROVIDERS.GEMINI 
                ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20" 
                : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20"
            )}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Google Gemini</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>• Fast response times</div>
                  <div>• Cost-effective</div>
                  <div>• Good for analysis</div>
                </div>
              </CardContent>
            </Card>

            <Card className={cn(
              "border-2 transition-all duration-200",
              provider === AI_PROVIDERS.OPENAI 
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20" 
                : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20"
            )}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">OpenAI GPT-4</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>• High accuracy</div>
                  <div>• Advanced reasoning</div>
                  <div>• Premium quality</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            <Zap className="w-3 h-3 inline mr-1" />
            Switch between providers to compare results and find the best fit for your needs
          </div>
        </div>
      )}
    </div>
  )
}
