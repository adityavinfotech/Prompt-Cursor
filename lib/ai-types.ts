export type AIProvider = "gemini" | "openai"

export const AI_PROVIDERS = {
  GEMINI: "gemini" as const,
  OPENAI: "openai" as const,
} as const


