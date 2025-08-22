import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { analysisService } from "@/lib/analysis-service"
import { rateLimiter, GeminiError } from "@/lib/gemini"

const analyzeRequestSchema = z.object({
  requirement: z
    .string()
    .min(10, "Requirement must be at least 10 characters")
    .max(200000, "Requirement must be less than 200k characters"),
  context: z
    .string()
    .max(200000, "Context must be less than 200k characters")
    .optional()
    .or(z.literal("").optional()),
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
    const validatedData = analyzeRequestSchema.parse(body)

    const analysis = await analysisService.analyzeRequirement(validatedData.requirement, validatedData.context || "")

    return NextResponse.json({ 
      success: true,
      data: analysis 
    })

  } catch (error) {
    console.error("Analysis API error:", error)

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
      { error: "Failed to analyze requirement. Please try again." },
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
