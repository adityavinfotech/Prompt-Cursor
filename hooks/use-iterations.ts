import { useState, useCallback, useEffect } from "react"
import type { Analysis } from "@/app/page"
import type { AnalysisIteration } from "@/components/iteration-display"

interface UseIterationsProps {
  initialAnalysis?: Analysis
  requirement: string
  formData?: any
  aiProvider?: string
}

interface UseIterationsReturn {
  iterations: AnalysisIteration[]
  currentIteration: number
  isIterating: boolean
  userFeedback: string
  setUserFeedback: (feedback: string) => void
  createIteration: (feedback?: string) => Promise<boolean>
  selectIteration: (index: number) => void
  markSatisfied: () => void
  getCurrentAnalysis: () => Analysis | null
  hasUnsavedChanges: boolean
  saveCurrentIteration: (analysis: Analysis) => void
  canIterate: () => boolean
  getIterationStats: () => {
    total: number
    satisfied: number
    current: number
  }
}

export function useIterations({ 
  initialAnalysis, 
  requirement, 
  formData,
  aiProvider 
}: UseIterationsProps): UseIterationsReturn {
  const [iterations, setIterations] = useState<AnalysisIteration[]>([])
  const [currentIteration, setCurrentIteration] = useState(0)
  const [isIterating, setIsIterating] = useState(false)
  const [userFeedback, setUserFeedback] = useState("")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Initialize iterations from localStorage or create first iteration
  useEffect(() => {
    const savedIterations = localStorage.getItem("currentIterations")
    const savedCurrentIteration = localStorage.getItem("currentIterationIndex")

    if (savedIterations) {
      const parsedIterations = JSON.parse(savedIterations)
      setIterations(parsedIterations)
      
      if (savedCurrentIteration) {
        setCurrentIteration(parseInt(savedCurrentIteration))
      }
    } else if (initialAnalysis) {
      // Create first iteration
      const firstIteration: AnalysisIteration = {
        id: `iter_${Date.now()}`,
        timestamp: new Date(),
        analysis: initialAnalysis,
        iterationNumber: 1,
        isUserSatisfied: false
      }
      
      setIterations([firstIteration])
      setCurrentIteration(0)
      
      // Save to localStorage
      localStorage.setItem("currentIterations", JSON.stringify([firstIteration]))
      localStorage.setItem("currentIterationIndex", "0")
    }
  }, [initialAnalysis])

  // Save iterations to localStorage whenever they change
  useEffect(() => {
    if (iterations.length > 0) {
      localStorage.setItem("currentIterations", JSON.stringify(iterations))
      localStorage.setItem("currentIterationIndex", currentIteration.toString())
    }
  }, [iterations, currentIteration])

  const createIteration = useCallback(async (feedback?: string): Promise<boolean> => {
    if (!iterations[currentIteration] || isIterating) return false

    setIsIterating(true)
    const feedbackToUse = feedback || userFeedback.trim()

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirement,
          formData,
          provider: aiProvider || "gemini",
          iterationData: {
            previousAnalysis: iterations[currentIteration].analysis,
            userEdits: (iterations[currentIteration] as any).userEdits,
            userFeedback: feedbackToUse || undefined,
            iterationNumber: iterations.length + 1,
          },
        })
      })

      if (response.ok) {
        const { data: newAnalysis } = await response.json()
        
        // Create new iteration
        const newIteration: AnalysisIteration = {
          id: `iter_${Date.now()}`,
          timestamp: new Date(),
          analysis: newAnalysis,
          userFeedback: feedbackToUse || undefined,
          iterationNumber: iterations.length + 1,
          isUserSatisfied: false
        }
        
        const updatedIterations = [...iterations, newIteration]
        const newIterationIndex = updatedIterations.length - 1
        
        setIterations(updatedIterations)
        setCurrentIteration(newIterationIndex)
        setUserFeedback("")
        setHasUnsavedChanges(false)
        
        // Update current analysis in localStorage
        localStorage.setItem("currentAnalysis", JSON.stringify(newAnalysis))
        
        return true
      } else {
        console.error("Failed to create iteration:", await response.text())
        return false
      }
    } catch (error) {
      console.error("Error creating iteration:", error)
      return false
    } finally {
      setIsIterating(false)
    }
  }, [iterations, currentIteration, isIterating, userFeedback, requirement, formData])

  const selectIteration = useCallback((index: number) => {
    if (index >= 0 && index < iterations.length && index !== currentIteration) {
      setCurrentIteration(index)
      setHasUnsavedChanges(false)
      
      // Update current analysis in localStorage
      localStorage.setItem("currentAnalysis", JSON.stringify(iterations[index].analysis))
    }
  }, [iterations, currentIteration])

  const markSatisfied = useCallback(() => {
    if (iterations[currentIteration]) {
      const updatedIterations = [...iterations]
      updatedIterations[currentIteration] = {
        ...updatedIterations[currentIteration],
        isUserSatisfied: true
      }
      setIterations(updatedIterations)
    }
  }, [iterations, currentIteration])

  const getCurrentAnalysis = useCallback((): Analysis | null => {
    return iterations[currentIteration]?.analysis || null
  }, [iterations, currentIteration])

  const saveCurrentIteration = useCallback((analysis: Analysis) => {
    if (iterations[currentIteration]) {
      const updatedIterations = [...iterations]
      updatedIterations[currentIteration] = {
        ...updatedIterations[currentIteration],
        analysis,
        userEdits: analysis // Mark as user-edited
      }
      setIterations(updatedIterations)
      setHasUnsavedChanges(false)
      
      // Update current analysis in localStorage
      localStorage.setItem("currentAnalysis", JSON.stringify(analysis))
    }
  }, [iterations, currentIteration])

  const canIterate = useCallback((): boolean => {
    const current = iterations[currentIteration]
    return !!(current && !current.isUserSatisfied && !isIterating)
  }, [iterations, currentIteration, isIterating])

  const getIterationStats = useCallback(() => {
    return {
      total: iterations.length,
      satisfied: iterations.filter(iter => iter.isUserSatisfied).length,
      current: currentIteration + 1
    }
  }, [iterations, currentIteration])

  return {
    iterations,
    currentIteration,
    isIterating,
    userFeedback,
    setUserFeedback,
    createIteration,
    selectIteration,
    markSatisfied,
    getCurrentAnalysis,
    hasUnsavedChanges,
    saveCurrentIteration,
    canIterate,
    getIterationStats
  }
}
