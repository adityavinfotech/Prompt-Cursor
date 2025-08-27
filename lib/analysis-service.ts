import { geminiService } from "./gemini"
import { buildAnalysisPrompt } from "./prompt-templates"
import { promptConfig } from "./prompt-config"
import { logPromptUsage } from "./telemetry"
import type { Analysis, Question, Assumption } from "@/app/page"

export interface RequirementFormData {
  taskType?: string
  goal?: string
  components?: string[]
  inputs?: string
  outputs?: string
  referenceFiles?: File[]
  referenceUrls?: string[]
  requirement?: string
  context?: string
}

export interface AnalysisRequest {
  requirement: string
  formData?: RequirementFormData
}

export interface AnalysisResponse extends Analysis {}

export class AnalysisService {
  async analyzeRequirement(
    requirement: string, 
    context: string = "", 
    formData?: RequirementFormData
  ): Promise<Analysis> {
    // Build structured requirement text from form data
    let structuredRequirement = requirement
    
    if (formData) {
      const parts: string[] = []
      
      if (formData.taskType) {
        parts.push(`Task Type: ${formData.taskType}`)
      }
      
      if (formData.goal) {
        parts.push(`Goal: ${formData.goal}`)
      }
      
      if (formData.components && formData.components.length > 0) {
        parts.push(`Components/Files Affected: ${formData.components.join(", ")}`)
      }
      
      if (formData.inputs) {
        parts.push(`Expected Inputs: ${formData.inputs}`)
      }
      
      if (formData.outputs) {
        parts.push(`Expected Outputs: ${formData.outputs}`)
      }
      
      if (formData.referenceUrls && formData.referenceUrls.length > 0) {
        parts.push(`Reference URLs: ${formData.referenceUrls.join(", ")}`)
      }
      
      if (formData.referenceFiles && formData.referenceFiles.length > 0) {
        const fileNames = formData.referenceFiles.map(f => f.name).join(", ")
        parts.push(`Reference Files: ${fileNames}`)
      }
      
      if (parts.length > 0) {
        const structuredPart = parts.join("\n")
        structuredRequirement = requirement 
          ? `${requirement}\n\nStructured Details:\n${structuredPart}`
          : structuredPart
      }
    }

    // If supplemental context is very large (e.g. repository markdown), summarize first
    let summarizedContext = context
    if (context && context.length > 16000) {
      const summarizationPrompt = `
You are an expert software architect. Summarize the following repository or product documentation into a concise implementation context.

Focus on:
- Primary goals and user-facing features
- Tech stack, architecture notes, key modules
- APIs/endpoints, data models, integrations
- Constraints, non-functional requirements, security/compliance
- Notable edge cases and assumptions

Write a clear, structured brief (bulleted where helpful) in under 2500 words. Preserve important details; omit marketing fluff.

INPUT CONTEXT:
${context}`

      try {
        summarizedContext = await geminiService.generateResponse(summarizationPrompt)
      } catch (e) {
        summarizedContext = context
      }
    }

    const jsonSchema = `{
  "goals": ["string"],
  "constraints": ["string"],
  "dependencies": ["string"],
  "edgeCases": ["string"],
  "acceptanceCriteria": ["string"],
  "questions": [{"id": "string", "text": "string", "priority": "critical|important|nice-to-have"}],
  "assumptions": [{"id": "string", "text": "string", "confidence": 0.0, "accepted": true}]
}`

    const prompt = buildAnalysisPrompt({
      requirement: structuredRequirement,
      context: summarizedContext,
      jsonSchema,
    })

    try {
      const t0 = Date.now()
      const response = await geminiService.generateStructuredResponse<AnalysisResponse>(prompt)
      
      // Validate and ensure all required fields are present
      const analysis: Analysis = {
        goals: response.goals || [],
        constraints: response.constraints || [],
        dependencies: response.dependencies || [],
        edgeCases: response.edgeCases || [],
        acceptanceCriteria: response.acceptanceCriteria || [],
        questions: (response.questions || []).map((q, index) => ({
          id: q.id || `q${index + 1}`,
          text: q.text,
          priority: q.priority as Question["priority"],
          answer: undefined,
        })),
        assumptions: (response.assumptions || []).map((a, index) => ({
          id: a.id || `a${index + 1}`,
          text: a.text,
          confidence: Math.max(0, Math.min(1, a.confidence || 0.5)), // Clamp to [0,1]
          accepted: a.accepted !== false, // Default to true
        })),
      }

      logPromptUsage({
        template: "analysis",
        version: promptConfig.version,
        mode: promptConfig.mode,
        inputChars: prompt.length,
        outputChars: JSON.stringify(response || {}).length,
        latencyMs: Date.now() - t0,
        parseOk: true,
        repairAttempts: 0,
      })

      return analysis
    } catch (error) {
      console.error("Error analyzing requirement:", error)
      throw error
    }
  }

  async generateAdditionalQuestions(
    requirement: string, 
    currentAnalysis: Analysis, 
    answeredQuestions: Question[]
  ): Promise<Question[]> {
    const answeredQuestionsText = answeredQuestions
      .map(q => `Q: ${q.text}\nA: ${q.answer}`)
      .join("\n\n")

    const currentAnalysisText = `Goals: ${currentAnalysis.goals.join(", ")}
Constraints: ${currentAnalysis.constraints.join(", ")}
Dependencies: ${currentAnalysis.dependencies.join(", ")}`

    const jsonSchema = `{"questions":[{"id":"string","text":"string","priority":"critical|important|nice-to-have"}]}`

    const prompt = `You are an expert software architect and requirements analyst.

Generate additional clarifying questions for the given requirement based on the current analysis and already answered questions.

REQUIREMENT:
${requirement}

CURRENT ANALYSIS:
${currentAnalysisText}

ANSWERED QUESTIONS:
${answeredQuestionsText}

SCHEMA:
${jsonSchema}

Respond with valid JSON only, matching the schema exactly.`

    try {
      const response = await geminiService.generateStructuredResponse<{ questions: Question[] }>(prompt)
      
      return (response.questions || []).map((q, index) => ({
        id: q.id || `new_q${Date.now()}_${index}`,
        text: q.text,
        priority: q.priority as Question["priority"],
        answer: undefined,
      }))
    } catch (error) {
      console.error("Error generating additional questions:", error)
      return []
    }
  }

  async refineAnalysis(
    requirement: string,
    currentAnalysis: Analysis,
    answeredQuestions: Question[],
    acceptedAssumptions: Assumption[]
  ): Promise<Partial<Analysis>> {
    const answeredQuestionsText = answeredQuestions
      .filter(q => q.answer?.trim())
      .map(q => `Q: ${q.text}\nA: ${q.answer}`)
      .join("\n\n")

    const acceptedAssumptionsText = acceptedAssumptions
      .filter(a => a.accepted)
      .map(a => `- ${a.text} (confidence: ${Math.round(a.confidence * 100)}%)`)
      .join("\n")

    const currentAnalysisText = `Goals: ${currentAnalysis.goals.join(", ")}
Constraints: ${currentAnalysis.constraints.join(", ")}
Dependencies: ${currentAnalysis.dependencies.join(", ")}
Edge Cases: ${currentAnalysis.edgeCases.join(", ")}
Acceptance Criteria: ${currentAnalysis.acceptanceCriteria.join(", ")}`

    const jsonSchema = `{"goals":["string"],"constraints":["string"],"dependencies":["string"],"edgeCases":["string"],"acceptanceCriteria":["string"]}`

    const prompt = `You are an expert software architect and requirements analyst.

Refine the current analysis based on new information from answered questions and accepted assumptions.

REQUIREMENT:
${requirement}

CURRENT ANALYSIS:
${currentAnalysisText}

NEW INFORMATION:
${answeredQuestionsText}

ACCEPTED ASSUMPTIONS:
${acceptedAssumptionsText}

SCHEMA:
${jsonSchema}

Respond with valid JSON only, matching the schema exactly.`

    try {
      const response = await geminiService.generateStructuredResponse<Partial<Analysis>>(prompt)
      return response
    } catch (error) {
      console.error("Error refining analysis:", error)
      return {}
    }
  }
}

export const analysisService = new AnalysisService()
