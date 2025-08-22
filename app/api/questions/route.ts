import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { analysisService } from "@/lib/analysis-service"
import { rateLimiter, GeminiError } from "@/lib/gemini"
import type { Analysis, Question } from "@/app/page"

const questionRequestSchema = z.object({
  requirement: z.string().min(10, "Requirement must be at least 10 characters"),
  currentAnalysis: z.object({
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
  }),
  answeredQuestions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    priority: z.enum(["critical", "important", "nice-to-have"]),
    answer: z.string(),
  })),
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
    const validatedData = questionRequestSchema.parse(body)

    const additionalQuestions = await analysisService.generateAdditionalQuestions(
      validatedData.requirement,
      validatedData.currentAnalysis,
      validatedData.answeredQuestions
    )

    return NextResponse.json({ 
      success: true,
      data: { questions: additionalQuestions }
    })

  } catch (error) {
    console.error("Questions API error:", error)

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
      { error: "Failed to generate additional questions. Please try again." },
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
