import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { promptService } from "@/lib/prompt-service"
import { rateLimiter, GeminiError } from "@/lib/gemini"

const improvePromptSchema = z.object({
  originalPrompt: z.string().min(10, "Original prompt must be at least 10 characters"),
  ideType: z.enum(["cursor", "copilot", "warp", "windsurf"]),
  improvementInstructions: z.string().min(5, "Improvement instructions must be at least 5 characters"),
  requirement: z.string().optional(),
  analysis: z.object({
    goals: z.array(z.string()),
    constraints: z.array(z.string()),
    dependencies: z.array(z.string()),
    edgeCases: z.array(z.string()),
    acceptanceCriteria: z.array(z.string()),
    questions: z.array(z.object({
      id: z.string(),
      text: z.string(),
      priority: z.enum(["critical", "important", "nice-to-have"]),
      answer: z.string().optional(),
    })),
    assumptions: z.array(z.object({
      id: z.string(),
      text: z.string(),
      confidence: z.number(),
      accepted: z.boolean(),
    })),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    if (!rateLimiter.canMakeRequest()) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429 }
      )
    }

    rateLimiter.recordRequest()

    const body = await request.json()
    const validatedData = improvePromptSchema.parse(body)

    const improvedPrompt = await promptService.improvePrompt({
      originalPrompt: validatedData.originalPrompt,
      ideType: validatedData.ideType,
      improvementInstructions: validatedData.improvementInstructions,
      requirement: validatedData.requirement,
      analysis: validatedData.analysis,
    })

    return NextResponse.json({ 
      success: true,
      data: {
        improvedPrompt,
        originalPrompt: validatedData.originalPrompt,
        ideType: validatedData.ideType,
        improvementInstructions: validatedData.improvementInstructions,
      }
    })

  } catch (error) {
    console.error("Improve prompts API error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof GeminiError) {
      const statusCode = error.code === "RATE_LIMIT" ? 429 : 
                        error.code === "UNAUTHORIZED" ? 401 :
                        error.code === "FORBIDDEN" ? 403 : 500

      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { error: "Failed to improve prompt. Please try again." },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
