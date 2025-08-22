export type PromptMode = "stable" | "exp"

export interface PromptConfig {
  version: string
  mode: PromptMode
}

export const promptConfig: PromptConfig = {
  version: process.env.PROMPT_VERSION || new Date().toISOString().slice(0, 10),
  mode: (process.env.PROMPT_MODE as PromptMode) || "stable",
}


