import { geminiService, GeminiError } from "./gemini"
import { openaiService, OpenAIError } from "./openai"
import { AIProvider } from "./ai-types"

export class AIError extends Error {
  constructor(message: string, public code?: string, public provider?: AIProvider) {
    super(message)
    this.name = "AIError"
  }
}

export interface AIServiceInterface {
  generateResponse(prompt: string): Promise<string>
  generateStructuredResponse<T>(prompt: string, schema?: string): Promise<T>
}

export class UnifiedAIService implements AIServiceInterface {
  private provider: AIProvider

  constructor(provider: AIProvider = "gemini") {
    this.provider = provider
  }

  setProvider(provider: AIProvider) {
    console.log(`[AI Service] Switching from ${this.provider} to ${provider}`)
    this.provider = provider
  }

  getProvider(): AIProvider {
    return this.provider
  }

  async generateResponse(prompt: string): Promise<string> {
    const startTime = Date.now()
    console.log(`[AI Service] Generating response with ${this.provider}`)
    
    try {
      let response: string
      
      if (this.provider === "gemini") {
        response = await geminiService.generateResponse(prompt)
      } else {
        response = await openaiService.generateResponse(prompt)
      }
      
      const duration = Date.now() - startTime
      console.log(`[AI Service] ${this.provider} response generated in ${duration}ms`)
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[AI Service] ${this.provider} error after ${duration}ms:`, error)
      
      if (error instanceof GeminiError) {
        throw new AIError(error.message, error.code, "gemini")
      } else if (error instanceof OpenAIError) {
        throw new AIError(error.message, error.code, "openai")
      }
      throw new AIError(
        error instanceof Error ? error.message : "Unknown error occurred",
        "UNKNOWN_ERROR",
        this.provider
      )
    }
  }

  async generateStructuredResponse<T>(prompt: string, schema?: string): Promise<T> {
    const startTime = Date.now()
    console.log(`[AI Service] Generating structured response with ${this.provider}`)
    
    try {
      let response: T
      
      if (this.provider === "gemini") {
        response = await geminiService.generateStructuredResponse<T>(prompt, schema)
      } else {
        response = await openaiService.generateStructuredResponse<T>(prompt, schema)
      }
      
      const duration = Date.now() - startTime
      console.log(`[AI Service] ${this.provider} structured response generated in ${duration}ms`)
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[AI Service] ${this.provider} structured response error after ${duration}ms:`, error)
      
      if (error instanceof GeminiError) {
        throw new AIError(error.message, error.code, "gemini")
      } else if (error instanceof OpenAIError) {
        throw new AIError(error.message, error.code, "openai")
      }
      throw new AIError(
        error instanceof Error ? error.message : "Unknown error occurred",
        "UNKNOWN_ERROR",
        this.provider
      )
    }
  }

  // Helper method to get provider display name
  getProviderDisplayName(): string {
    return this.provider === "gemini" ? "Google Gemini" : "OpenAI GPT-4"
  }

  // Helper method to get provider icon/emoji
  getProviderIcon(): string {
    return this.provider === "gemini" ? "🤖" : "🧠"
  }

  // Helper method to get provider status
  getProviderStatus(): { status: "ready" | "error" | "unknown"; message: string } {
    try {
      // Basic validation that the service is configured
      if (this.provider === "gemini") {
        return { status: "ready", message: "Gemini service configured" }
      } else if (this.provider === "openai") {
        return { status: "ready", message: "OpenAI service configured" }
      }
      return { status: "unknown", message: "Unknown provider" }
    } catch (error) {
      return { status: "error", message: `Service error: ${error instanceof Error ? error.message : "Unknown"}` }
    }
  }
}

// Export singleton instance
export const aiService = new UnifiedAIService()

// Export provider constants
export const AI_PROVIDERS = {
  GEMINI: "gemini" as const,
  OPENAI: "openai" as const,
} as const
