import { geminiService } from "./gemini"
import { buildAnalysisPrompt } from "./prompt-templates"
import { promptConfig } from "./prompt-config"
import { logPromptUsage } from "./telemetry"
import type { Analysis, Question, Assumption } from "@/app/page"

export interface AnalysisRequest {
  requirement: string
}

export interface AnalysisResponse extends Analysis {}

export class AnalysisService {
  async analyzeRequirement(requirement: string, context: string = ""): Promise<Analysis> {
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
      requirement,
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

    const prompt = `${SYSTEM_RULES}\n${QUESTIONS_INSTRUCT}

REQUIREMENT:
${requirement}

CURRENT ANALYSIS:
${currentAnalysisText}

ANSWERED QUESTIONS:
${answeredQuestionsText}

SCHEMA:
${jsonSchema}
\nRespond with valid JSON only, matching the schema exactly.`

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

    const prompt = `${SYSTEM_RULES}\n${REFINE_INSTRUCT}

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
\nRespond with valid JSON only, matching the schema exactly.`

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
