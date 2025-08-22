import { z } from "zod"

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "Gemini API key is required"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

export const env = envSchema.parse({
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
})

export type Env = z.infer<typeof envSchema>
