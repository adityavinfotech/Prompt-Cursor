import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { analysisService } from "@/lib/analysis-service"
import { rateLimiter, GeminiError } from "@/lib/gemini"
import { openaiRateLimiter, OpenAIError } from "@/lib/openai"
import { AIError } from "@/lib/ai-service"
import type { Analysis } from "@/app/page"

const requirementFormDataSchema = z.object({
  taskType: z.string().optional(),
  goal: z.string().optional(),
  components: z.array(z.string()).optional(),
  inputs: z.string().optional(),
  outputs: z.string().optional(),
  referenceFiles: z.any().optional(), // Files will be handled separately
  referenceFileContents: z.array(z.object({
    name: z.string(),
    content: z.string(),
    type: z.string()
  })).optional(),
  referenceUrls: z.array(z.string().url()).optional(),
  requirement: z.string().optional(),
  context: z.string().optional(),
})

// Schema for iteration data
const iterationDataSchema = z.object({
  previousAnalysis: z.object({
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
      confidence: z.number().min(0).max(1),
      accepted: z.boolean(),
    })),
  }),
  userEdits: z.object({
    goals: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional(),
    dependencies: z.array(z.string()).optional(),
    edgeCases: z.array(z.string()).optional(),
    acceptanceCriteria: z.array(z.string()).optional(),
    questions: z.array(z.object({
      id: z.string(),
      text: z.string(),
      priority: z.enum(["critical", "important", "nice-to-have"]),
      answer: z.string().optional(),
    })).optional(),
    assumptions: z.array(z.object({
      id: z.string(),
      text: z.string(),
      confidence: z.number().min(0).max(1),
      accepted: z.boolean(),
    })).optional(),
  }).optional(),
  userFeedback: z.string().optional(),
  iterationNumber: z.number().min(1),
}).optional()

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
  iterationData: iterationDataSchema,
  provider: z.enum(["gemini", "openai"]).optional().default("gemini"),
}).refine(
  (data) => {
    // For iterations, we need previous analysis
    if (data.iterationData) {
      return true // Iteration requests are always valid if they have iteration data
    }
    
    // For initial analysis, at least one of these must have content
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
    message: "Either requirement text (min 10 chars) or structured form data must be provided for initial analysis"
  }
)

export async function POST(request: NextRequest) {
  try {
    // Parse request first so we can determine provider (defaults to gemini)
    const body = await request.json()
    const validatedData = analyzeRequestSchema.parse(body)

    // Rate limiting check based on provider
    const isGemini = validatedData.provider === "gemini"
    const rateLimiterToUse = isGemini ? rateLimiter : openaiRateLimiter
    
    if (!rateLimiterToUse.canMakeRequest()) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429 }
      )
    }

    rateLimiterToUse.recordRequest()

    let analysis: Analysis
    
    // Check if this is an iteration request
    if (validatedData.iterationData) {
      analysis = await analysisService.createIteration(
        validatedData.requirement || "",
        validatedData.iterationData.previousAnalysis,
        validatedData.iterationData.iterationNumber,
        validatedData.context || "",
        validatedData.formData,
        validatedData.iterationData.userEdits,
        validatedData.iterationData.userFeedback
      )
    } else {
      // Initial analysis
      analysis = await analysisService.analyzeRequirement(
        validatedData.requirement || "", 
        validatedData.context || "",
        validatedData.formData,
        validatedData.provider
      )
    }

    return NextResponse.json({ 
      success: true,
      data: analysis 
    })

  } catch (error) {
    console.error("Analysis API error:", error)

    if (error instanceof z.ZodError) {
      // Enhanced validation error handling for iterations
      const isIterationError = error.errors.some(err => 
        err.path.includes('iterationData') || err.path.includes('previousAnalysis')
      )
      
      return NextResponse.json(
        { 
          error: isIterationError 
            ? "Invalid iteration data provided" 
            : "Invalid request data", 
          details: error.errors,
          type: isIterationError ? 'iteration_validation_error' : 'validation_error'
        },
        { status: 400 }
      )
    }

    if (error instanceof GeminiError || error instanceof OpenAIError || error instanceof AIError) {
      const statusCode = error.code === "RATE_LIMIT" ? 429 : 
                        error.code === "UNAUTHORIZED" ? 401 :
                        error.code === "FORBIDDEN" ? 403 : 500

      // Enhanced error messaging for iterations
      const isIterationContext = error.message.includes('iteration') || error.message.includes('refinement')
      const errorMessage = isIterationContext 
        ? `Failed to create iteration: ${error.message}`
        : error.message

      return NextResponse.json(
        { 
          error: errorMessage, 
          code: error.code,
          type: isIterationContext ? 'iteration_ai_error' : 'ai_error'
        },
        { status: statusCode }
      )
    }

    // Check if this is an iteration-specific error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isIterationError = errorMessage.includes('iteration') || errorMessage.includes('createIteration')
    
    return NextResponse.json(
      { 
        error: isIterationError 
          ? "Failed to create iteration. Please try again." 
          : "Failed to analyze requirement. Please try again.",
        type: isIterationError ? 'iteration_error' : 'analysis_error'
      },
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
