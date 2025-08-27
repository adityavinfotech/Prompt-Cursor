import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { promptService } from "@/lib/prompt-service"
import { rateLimiter, GeminiError } from "@/lib/gemini"

const requirementFormDataSchema = z.object({
  taskType: z.string().optional(),
  goal: z.string().optional(),
  components: z.array(z.string()).optional(),
  inputs: z.string().optional(),
  outputs: z.string().optional(),
  referenceFiles: z.any().optional(),
  referenceUrls: z.array(z.string()).optional(),
  requirement: z.string().optional(),
  context: z.string().optional(),
})

const promptRequestSchema = z.object({
  requirement: z.string().optional(),
  formData: requirementFormDataSchema.optional(),
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
  }),
  answeredQuestions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    priority: z.enum(["critical", "important", "nice-to-have"]),
    answer: z.string(),
  })),
  acceptedAssumptions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    confidence: z.number(),
    accepted: z.boolean(),
  })),
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
    const validatedData = promptRequestSchema.parse(body)

    const prompts = await promptService.generateIDEPrompts({
      requirement: validatedData.requirement || "",
      formData: validatedData.formData,
      analysis: validatedData.analysis,
      answeredQuestions: validatedData.answeredQuestions,
      acceptedAssumptions: validatedData.acceptedAssumptions,
    })

    return NextResponse.json({ 
      success: true,
      data: prompts 
    })

  } catch (error) {
    console.error("Prompts API error:", error)

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
      { error: "Failed to generate prompts. Please try again." },
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
