import { GoogleGenerativeAI } from "@google/generative-ai"
import { env } from "./env"

export class GeminiError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = "GeminiError"
  }
}

class GeminiService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      },
    })
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      if (!text?.trim()) {
        throw new GeminiError("Empty response from Gemini API")
      }
      
      return text.trim()
    } catch (error: any) {
      if (error.status === 429) {
        throw new GeminiError("Rate limit exceeded. Please try again later.", "RATE_LIMIT")
      } else if (error.status === 401) {
        throw new GeminiError("Invalid API key or unauthorized access.", "UNAUTHORIZED")
      } else if (error.status === 403) {
        throw new GeminiError("API access forbidden. Check your permissions.", "FORBIDDEN")
      } else if (error.message?.includes("network")) {
        throw new GeminiError("Network error. Please check your connection.", "NETWORK_ERROR")
      }
      
      throw new GeminiError(
        error.message || "An unexpected error occurred while generating response",
        "UNKNOWN_ERROR"
      )
    }
  }

  async generateStructuredResponse<T>(prompt: string, schema?: string): Promise<T> {
    const structuredPrompt = schema
      ? `${prompt}\n\nRespond with valid JSON that matches this schema exactly: ${schema}`
      : `${prompt}\n\nRespond with valid JSON only, no additional text.`

    const start = Date.now()
    const response = await this.generateResponse(structuredPrompt)
    
    try {
      return JSON.parse(response) as T
    } catch (parseError) {
      // Try to extract JSON from the response if it contains extra text
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as T
        } catch (secondParseError) {
          throw new GeminiError("Failed to parse structured response", "PARSE_ERROR")
        }
      }
      throw new GeminiError("Invalid JSON response from Gemini", "INVALID_JSON")
    }
  }
}

// Singleton instance
export const geminiService = new GeminiService()

// Rate limiting helper
export class RateLimiter {
  private requests: number[] = []
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests = 10, windowMs = 60000) { // 10 requests per minute by default
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  canMakeRequest(): boolean {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    return this.requests.length < this.maxRequests
  }

  recordRequest(): void {
    this.requests.push(Date.now())
  }
}

export const rateLimiter = new RateLimiter()
