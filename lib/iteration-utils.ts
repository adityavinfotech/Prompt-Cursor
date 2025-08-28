import type { Analysis } from "@/app/page"
import type { AnalysisIteration } from "@/components/iteration-display"

export interface AnalysisComparison {
  field: string
  oldValue: string[]
  newValue: string[]
  changeType: 'added' | 'removed' | 'modified' | 'unchanged'
}

export interface IterationComparison {
  goals: AnalysisComparison
  constraints: AnalysisComparison
  dependencies: AnalysisComparison
  edgeCases: AnalysisComparison
  acceptanceCriteria: AnalysisComparison
  questions: {
    added: number
    removed: number
    modified: number
    total: number
  }
  assumptions: {
    added: number
    removed: number
    modified: number
    total: number
  }
}

export function compareAnalyses(oldAnalysis: Analysis, newAnalysis: Analysis): IterationComparison {
  const compareArrayFields = (
    oldArray: string[], 
    newArray: string[], 
    fieldName: string
  ): AnalysisComparison => {
    const added = newArray.filter(item => !oldArray.includes(item))
    const removed = oldArray.filter(item => !newArray.includes(item))
    
    let changeType: 'added' | 'removed' | 'modified' | 'unchanged' = 'unchanged'
    if (added.length > 0 && removed.length > 0) {
      changeType = 'modified'
    } else if (added.length > 0) {
      changeType = 'added'
    } else if (removed.length > 0) {
      changeType = 'removed'
    }

    return {
      field: fieldName,
      oldValue: oldArray,
      newValue: newArray,
      changeType
    }
  }

  const compareQuestions = () => {
    const oldQuestions = oldAnalysis.questions.map(q => q.text)
    const newQuestions = newAnalysis.questions.map(q => q.text)
    
    return {
      added: newQuestions.filter(q => !oldQuestions.includes(q)).length,
      removed: oldQuestions.filter(q => !newQuestions.includes(q)).length,
      modified: 0, // For now, we'll consider text changes as add/remove
      total: newAnalysis.questions.length
    }
  }

  const compareAssumptions = () => {
    const oldAssumptions = oldAnalysis.assumptions.map(a => a.text)
    const newAssumptions = newAnalysis.assumptions.map(a => a.text)
    
    return {
      added: newAssumptions.filter(a => !oldAssumptions.includes(a)).length,
      removed: oldAssumptions.filter(a => !newAssumptions.includes(a)).length,
      modified: 0, // For now, we'll consider text changes as add/remove
      total: newAnalysis.assumptions.length
    }
  }

  return {
    goals: compareArrayFields(oldAnalysis.goals, newAnalysis.goals, 'goals'),
    constraints: compareArrayFields(oldAnalysis.constraints, newAnalysis.constraints, 'constraints'),
    dependencies: compareArrayFields(oldAnalysis.dependencies, newAnalysis.dependencies, 'dependencies'),
    edgeCases: compareArrayFields(oldAnalysis.edgeCases, newAnalysis.edgeCases, 'edgeCases'),
    acceptanceCriteria: compareArrayFields(oldAnalysis.acceptanceCriteria, newAnalysis.acceptanceCriteria, 'acceptanceCriteria'),
    questions: compareQuestions(),
    assumptions: compareAssumptions()
  }
}

export function getIterationSummary(iteration: AnalysisIteration): string {
  const { analysis } = iteration
  const totalItems = analysis.goals.length + 
                    analysis.constraints.length + 
                    analysis.dependencies.length + 
                    analysis.edgeCases.length + 
                    analysis.acceptanceCriteria.length

  const questionsSummary = analysis.questions.length > 0 
    ? `${analysis.questions.length} questions` 
    : 'no questions'
  
  const assumptionsSummary = analysis.assumptions.length > 0 
    ? `${analysis.assumptions.length} assumptions (${analysis.assumptions.filter(a => a.accepted).length} accepted)`
    : 'no assumptions'

  return `${totalItems} analysis items, ${questionsSummary}, ${assumptionsSummary}`
}

export function validateIterationData(iteration: AnalysisIteration): boolean {
  if (!iteration.id || !iteration.analysis || !iteration.timestamp) {
    return false
  }

  const { analysis } = iteration
  
  // Check if analysis has required structure
  const requiredFields = ['goals', 'constraints', 'dependencies', 'edgeCases', 'acceptanceCriteria', 'questions', 'assumptions']
  
  for (const field of requiredFields) {
    if (!(field in analysis) || !Array.isArray(analysis[field as keyof Analysis])) {
      return false
    }
  }

  return true
}

export function exportIterationHistory(iterations: AnalysisIteration[]): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    totalIterations: iterations.length,
    iterations: iterations.map(iteration => ({
      iterationNumber: iteration.iterationNumber,
      timestamp: iteration.timestamp,
      isUserSatisfied: iteration.isUserSatisfied,
      userFeedback: iteration.userFeedback,
      summary: getIterationSummary(iteration),
      analysis: iteration.analysis
    }))
  }

  return JSON.stringify(exportData, null, 2)
}

export function calculateIterationMetrics(iterations: AnalysisIteration[]) {
  if (iterations.length === 0) {
    return {
      totalIterations: 0,
      satisfiedIterations: 0,
      averageItemsPerIteration: 0,
      iterationTrend: 'stable' as 'increasing' | 'decreasing' | 'stable'
    }
  }

  const satisfiedIterations = iterations.filter(iter => iter.isUserSatisfied).length
  
  const itemCounts = iterations.map(iter => {
    const { analysis } = iter
    return analysis.goals.length + 
           analysis.constraints.length + 
           analysis.dependencies.length + 
           analysis.edgeCases.length + 
           analysis.acceptanceCriteria.length
  })

  const averageItemsPerIteration = itemCounts.reduce((sum, count) => sum + count, 0) / itemCounts.length

  // Determine trend (simple comparison of first half vs second half)
  let iterationTrend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (itemCounts.length >= 4) {
    const midpoint = Math.floor(itemCounts.length / 2)
    const firstHalfAvg = itemCounts.slice(0, midpoint).reduce((sum, count) => sum + count, 0) / midpoint
    const secondHalfAvg = itemCounts.slice(midpoint).reduce((sum, count) => sum + count, 0) / (itemCounts.length - midpoint)
    
    if (secondHalfAvg > firstHalfAvg * 1.1) {
      iterationTrend = 'increasing'
    } else if (secondHalfAvg < firstHalfAvg * 0.9) {
      iterationTrend = 'decreasing'
    }
  }

  return {
    totalIterations: iterations.length,
    satisfiedIterations,
    averageItemsPerIteration: Math.round(averageItemsPerIteration * 10) / 10,
    iterationTrend
  }
}
