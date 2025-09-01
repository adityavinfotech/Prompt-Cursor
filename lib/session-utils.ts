// Session management utility to handle localStorage operations consistently
export const SESSION_KEYS = {
  ANALYSIS: "currentAnalysis",
  REQUIREMENT: "currentRequirement", 
  FORM_DATA: "currentFormData",
  PROMPTS: "currentPrompts",
  EDITED_PROMPTS: "currentEditedPrompts",
  ITERATIONS: "currentIterations",
  ITERATION_INDEX: "currentIterationIndex",
  AI_PROVIDER: "currentAIProvider",
} as const

export function clearAllSessionData(): void {
  Object.values(SESSION_KEYS).forEach(key => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to remove localStorage key: ${key}`, error)
    }
  })
}

export function clearSessionDataExcept(keysToKeep: string[] = []): void {
  Object.values(SESSION_KEYS).forEach(key => {
    if (!keysToKeep.includes(key)) {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn(`Failed to remove localStorage key: ${key}`, error)
      }
    }
  })
}

export function getSessionData<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.warn(`Failed to parse localStorage data for key: ${key}`, error)
    return null
  }
}

export function setSessionData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.warn(`Failed to save to localStorage for key: ${key}`, error)
  }
}
