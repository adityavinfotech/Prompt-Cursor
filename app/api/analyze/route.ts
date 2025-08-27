import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { analysisService } from "@/lib/analysis-service"
import { rateLimiter, GeminiError } from "@/lib/gemini"

const requirementFormDataSchema = z.object({
  taskType: z.string().optional(),
  goal: z.string().optional(),
  components: z.array(z.string()).optional(),
  inputs: z.string().optional(),
  outputs: z.string().optional(),
  referenceFiles: z.any().optional(), // Files will be handled separately
  referenceUrls: z.array(z.string().url()).optional(),
  requirement: z.string().optional(),
  context: z.string().optional(),
})

const analyzeRequestSchema = z.object({
  requirement: z
    .string()
    .max(200000, "Requirement must be less than 200k characters")
    .optional(),
  context: z
    .string()
    .max(200000, "Context must be less than 200k characters")
    .optional()
    .or(z.literal("").optional()),
  formData: requirementFormDataSchema.optional(),
}).refine(
  (data) => {
    // At least one of these must have content
    const hasLegacyData = (data.requirement && data.requirement.trim().length >= 10)
    const hasStructuredData = data.formData && (
      data.formData.goal || 
      data.formData.taskType || 
      data.formData.inputs || 
      data.formData.outputs
    )
    return hasLegacyData || hasStructuredData
  },
  {
    message: "Either requirement text (min 10 chars) or structured form data must be provided"
  }
)

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

    const analysis = await analysisService.analyzeRequirement(
      validatedData.requirement || "", 
      validatedData.context || "",
      validatedData.formData
    )

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
