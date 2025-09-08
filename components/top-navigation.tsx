"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import { clearAllSessionData } from "@/lib/session-utils"

interface TopNavigationProps {
  currentStep: "requirement" | "analyse" | "prompt"
}

const NAVIGATION_STEPS = [
  { key: "requirement", label: "Requirement", path: "/app" },
  { key: "analyse", label: "Analyse", path: "/analyse" },
  { key: "prompt", label: "Prompt", path: "/prompts" },
] as const

export function TopNavigation({ currentStep }: TopNavigationProps) {
  const router = useRouter()

  const getStepIndex = (step: string) => {
    return NAVIGATION_STEPS.findIndex(s => s.key === step)
  }

  const currentIndex = getStepIndex(currentStep)

  const handleStepClick = (step: typeof NAVIGATION_STEPS[number]) => {
    const stepIndex = getStepIndex(step.key)
    
    // Only allow navigation to completed steps or current step
    if (stepIndex <= currentIndex) {
      router.push(step.path)
    }
  }

  const handleNewSession = () => {
    if (confirm("Start a new session? This will clear all current data.")) {
      clearAllSessionData()
      router.push("/app")
      // Force page reload to clear all state
      window.location.reload()
    }
  }

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* App Name */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">AI Prompt Architect</h1>
          </div>

          {/* Navigation Pills */}
          <div className="flex items-center space-x-2 bg-muted p-1 rounded-full">
            {NAVIGATION_STEPS.map((step, index) => {
              const isActive = step.key === currentStep
              const isCompleted = index < currentIndex
              const isAccessible = index <= currentIndex

              return (
                <button
                  key={step.key}
                  onClick={() => handleStepClick(step)}
                  disabled={!isAccessible}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    {
                      // Active step (current)
                      "bg-primary text-primary-foreground shadow-sm": isActive,
                      // Completed steps
                      "bg-background text-foreground hover:bg-background/80": isCompleted && !isActive,
                      // Future steps (disabled)
                      "text-muted-foreground cursor-not-allowed": !isAccessible,
                      // Accessible but not active
                      "text-muted-foreground hover:text-foreground hover:bg-background/50": isAccessible && !isActive && !isCompleted,
                    }
                  )}
                >
                  {step.label}
                </button>
              )
            })}
          </div>

          {/* New Session Button and Progress */}
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewSession}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>New Session</span>
            </Button>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Step {currentIndex + 1} of {NAVIGATION_STEPS.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
