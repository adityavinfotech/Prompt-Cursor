import OpenAI from "openai"
import { env } from "./env"

export class OpenAIError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = "OpenAIError"
  }
}

class OpenAIService {
  private openai: OpenAI
  private model: string

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })
    this.model = "gpt-4o-mini" // Using GPT-4o-mini for cost-effectiveness and good performance
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 8192,
        top_p: 0.8,
      })

      const response = completion.choices[0]?.message?.content
      
      if (!response?.trim()) {
        throw new OpenAIError("Empty response from OpenAI API")
      }
      
      return response.trim()
    } catch (error: any) {
      if (error.status === 429) {
        throw new OpenAIError("Rate limit exceeded. Please try again later.", "RATE_LIMIT")
      } else if (error.status === 401) {
        throw new OpenAIError("Invalid API key or unauthorized access.", "UNAUTHORIZED")
      } else if (error.status === 403) {
        throw new OpenAIError("API access forbidden. Check your permissions.", "FORBIDDEN")
      } else if (error.message?.includes("network")) {
        throw new OpenAIError("Network error. Please check your connection.", "NETWORK_ERROR")
      } else if (error.code === "insufficient_quota") {
        throw new OpenAIError("Insufficient quota. Please check your OpenAI account.", "QUOTA_EXCEEDED")
      }
      
      throw new OpenAIError(
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
          throw new OpenAIError("Failed to parse structured response", "PARSE_ERROR")
        }
      }
      throw new OpenAIError("Invalid JSON response from OpenAI", "INVALID_JSON")
    }
  }
}

// Singleton instance
export const openaiService = new OpenAIService()

// Rate limiting helper (same interface as Gemini for consistency)
export class OpenAIRateLimiter {
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

// Export rate limiter instance
export const openaiRateLimiter = new OpenAIRateLimiter()
