import { aiService } from "./ai-service"
import { AIProvider } from "./ai-types"
import { CODE_QUALITY_INSTRUCTION } from "./prompt-templates"
import type { Analysis, Question, Assumption, GeneratedPrompts } from "@/app/page"

export interface RequirementFormData {
  taskType?: string
  goal?: string
  components?: string[]
  inputs?: string
  outputs?: string
  referenceFiles?: any
  referenceFileContents?: { name: string; content: string; type: string }[]
  referenceUrls?: string[]
  requirement?: string
  context?: string
}

export interface PromptGenerationRequest {
  requirement: string
  formData?: RequirementFormData
  analysis: Analysis
  answeredQuestions: Question[]
  acceptedAssumptions: Assumption[]
  provider?: AIProvider
}

export class PromptService {
  async generateIDEPrompts({
    requirement,
    formData,
    analysis,
    answeredQuestions,
    acceptedAssumptions,
    provider = "gemini",
  }: PromptGenerationRequest): Promise<GeneratedPrompts> {
    // Build structured requirement from form data if available
    let structuredRequirement = requirement
    if (formData) {
      const parts: string[] = []
      if (formData.taskType) parts.push(`Task Type: ${formData.taskType}`)
      if (formData.goal) parts.push(`Goal: ${formData.goal}`)
      if (formData.components && formData.components.length > 0) {
        parts.push(`Components/Files Affected: ${formData.components.join(', ')}`)
      }
      if (formData.inputs) parts.push(`Expected Inputs: ${formData.inputs}`)
      if (formData.outputs) parts.push(`Expected Outputs: ${formData.outputs}`)
      if (formData.referenceUrls && formData.referenceUrls.length > 0) {
        parts.push(`Reference URLs: ${formData.referenceUrls.join(', ')}`)
      }
      if (formData.referenceFiles && formData.referenceFiles.length > 0) {
        const fileNames = formData.referenceFiles.map((f: any) => f.name || f).join(', ')
        parts.push(`Reference Files: ${fileNames}`)
      }
      
      if (parts.length > 0) {
        structuredRequirement = requirement 
          ? `${requirement}\n\nStructured Details:\n${parts.join('\n')}`
          : parts.join('\n')
      }
    }
    // Filter answered questions and accepted assumptions
    const relevantQuestions = answeredQuestions.filter(q => q.answer?.trim())
    const relevantAssumptions = acceptedAssumptions.filter(a => a.accepted)

    // Set the provider before generating prompts
    aiService.setProvider(provider)
    
    // Generate prompts for each IDE in parallel
    const [cursor, copilot, warp, windsurf] = await Promise.all([
      this.generateCursorPrompt({ requirement: structuredRequirement, analysis, relevantQuestions, relevantAssumptions }),
      this.generateCopilotPrompt({ requirement: structuredRequirement, analysis, relevantQuestions, relevantAssumptions }),
      this.generateWarpPrompt({ requirement: structuredRequirement, analysis, relevantQuestions, relevantAssumptions }),
      this.generateWindsurfPrompt({ requirement: structuredRequirement, analysis, relevantQuestions, relevantAssumptions }),
    ])

    return { cursor, copilot, warp, windsurf }
  }

  private async generateCursorPrompt({
    requirement,
    analysis,
    relevantQuestions,
    relevantAssumptions,
  }: {
    requirement: string
    analysis: Analysis
    relevantQuestions: Question[]
    relevantAssumptions: Assumption[]
  }): Promise<string> {
    const questionsContext = relevantQuestions.length > 0
      ? `\n\nCLARIFICATIONS:\n${relevantQuestions.map(q => `Q: ${q.text}\nA: ${q.answer}`).join('\n\n')}`
      : ""

    const assumptionsContext = relevantAssumptions.length > 0
      ? `\n\nACCEPTED ASSUMPTIONS:\n${relevantAssumptions.map(a => `- ${a.text} (${Math.round(a.confidence * 100)}% confidence)`).join('\n')}`
      : ""

    const prompt = `
Create a Cursor IDE prompt optimized for code generation. Cursor works best with concise, specific instructions and clear technical requirements.

${CODE_QUALITY_INSTRUCTION}

ORIGINAL REQUIREMENT:
${requirement}

ANALYSIS RESULTS:
• Goals: ${analysis.goals.join(', ')}
• Constraints: ${analysis.constraints.join(', ')}
• Dependencies: ${analysis.dependencies.join(', ')}
• Edge Cases: ${analysis.edgeCases.join(', ')}
• Acceptance Criteria: ${analysis.acceptanceCriteria.join(', ')}${questionsContext}${assumptionsContext}

Generate a Cursor-optimized prompt that includes:
1. Concise goal statement
2. Technical specifications
3. Implementation steps
4. Key constraints and requirements
5. Expected behavior description
6. Code generation guidance

Format as a direct, actionable prompt that will help Cursor generate accurate code suggestions. Keep it focused and specific.`

    return await aiService.generateResponse(prompt)
  }

  private async generateCopilotPrompt({
    requirement,
    analysis,
    relevantQuestions,
    relevantAssumptions,
  }: {
    requirement: string
    analysis: Analysis
    relevantQuestions: Question[]
    relevantAssumptions: Assumption[]
  }): Promise<string> {
    const questionsContext = relevantQuestions.length > 0
      ? `\n\nCLARIFICATIONS:\n${relevantQuestions.map(q => `Q: ${q.text}\nA: ${q.answer}`).join('\n\n')}`
      : ""

    const assumptionsContext = relevantAssumptions.length > 0
      ? `\n\nACCEPTED ASSUMPTIONS:\n${relevantAssumptions.map(a => `- ${a.text}`).join('\n')}`
      : ""

    const prompt = `
Create a GitHub Copilot prompt optimized for code generation. Copilot works best with concise, specific instructions and clear technical requirements.

${CODE_QUALITY_INSTRUCTION}

ORIGINAL REQUIREMENT:
${requirement}

ANALYSIS RESULTS:
• Goals: ${analysis.goals.join(', ')}
• Constraints: ${analysis.constraints.join(', ')}
• Dependencies: ${analysis.dependencies.join(', ')}
• Edge Cases: ${analysis.edgeCases.join(', ')}
• Acceptance Criteria: ${analysis.acceptanceCriteria.join(', ')}${questionsContext}${assumptionsContext}

Generate a Copilot-optimized prompt that includes:
1. Concise goal statement
2. Technical specifications
3. Implementation steps
4. Key constraints and requirements
5. Expected behavior description
6. Code generation guidance

Format as a direct, actionable prompt that will help Copilot generate accurate code suggestions. Keep it focused and specific.`

    return await aiService.generateResponse(prompt)
  }

  private async generateWarpPrompt({
    requirement,
    analysis,
    relevantQuestions,
    relevantAssumptions,
  }: {
    requirement: string
    analysis: Analysis
    relevantQuestions: Question[]
    relevantAssumptions: Assumption[]
  }): Promise<string> {
    const questionsContext = relevantQuestions.length > 0
      ? `\n\nCLARIFICATIONS:\n${relevantQuestions.map(q => `Q: ${q.text}\nA: ${q.answer}`).join('\n\n')}`
      : ""

    const assumptionsContext = relevantAssumptions.length > 0
      ? `\n\nACCEPTED ASSUMPTIONS:\n${relevantAssumptions.map(a => `- ${a.text}`).join('\n')}`
      : ""

    const prompt = `
Create a Warp terminal prompt optimized for code generation. Warp works best with concise, specific instructions and clear technical requirements.

${CODE_QUALITY_INSTRUCTION}

ORIGINAL REQUIREMENT:
${requirement}

ANALYSIS RESULTS:
• Goals: ${analysis.goals.join(', ')}
• Constraints: ${analysis.constraints.join(', ')}
• Dependencies: ${analysis.dependencies.join(', ')}
• Edge Cases: ${analysis.edgeCases.join(', ')}
• Acceptance Criteria: ${analysis.acceptanceCriteria.join(', ')}${questionsContext}${assumptionsContext}

Generate a Warp-optimized prompt that includes:
1. Concise goal statement
2. Technical specifications
3. Implementation steps
4. Key constraints and requirements
5. Expected behavior description
6. Code generation guidance

Format as a direct, actionable prompt that will help Warp generate accurate code suggestions. Keep it focused and specific.`

    return await aiService.generateResponse(prompt)
  }

  private async generateWindsurfPrompt({
    requirement,
    analysis,
    relevantQuestions,
    relevantAssumptions,
  }: {
    requirement: string
    analysis: Analysis
    relevantQuestions: Question[]
    relevantAssumptions: Assumption[]
  }): Promise<string> {
    const questionsContext = relevantQuestions.length > 0
      ? `\n\nCLARIFICATIONS:\n${relevantQuestions.map(q => `Q: ${q.text}\nA: ${q.answer}`).join('\n\n')}`
      : ""

    const assumptionsContext = relevantAssumptions.length > 0
      ? `\n\nACCEPTED ASSUMPTIONS:\n${relevantAssumptions.map(a => `- ${a.text}`).join('\n')}`
      : ""

    const prompt = `
Create a Windsurf IDE prompt optimized for code generation. Windsurf works best with concise, specific instructions and clear technical requirements.

${CODE_QUALITY_INSTRUCTION}

ORIGINAL REQUIREMENT:
${requirement}

ANALYSIS RESULTS:
• Goals: ${analysis.goals.join(', ')}
• Constraints: ${analysis.constraints.join(', ')}
• Dependencies: ${analysis.dependencies.join(', ')}
• Edge Cases: ${analysis.edgeCases.join(', ')}
• Acceptance Criteria: ${analysis.acceptanceCriteria.join(', ')}${questionsContext}${assumptionsContext}

Generate a Windsurf-optimized prompt that includes:
1. Concise goal statement
2. Technical specifications
3. Implementation steps
4. Key constraints and requirements
5. Expected behavior description
6. Code generation guidance

Format as a direct, actionable prompt that will help Windsurf generate accurate code suggestions. Keep it focused and specific.`

    return await aiService.generateResponse(prompt)
  }

  async generateCustomPrompt(
    ideType: string,
    requirement: string,
    analysis: Analysis,
    relevantQuestions: Question[],
    relevantAssumptions: Assumption[]
  ): Promise<string> {
    const questionsContext = relevantQuestions.length > 0
      ? `\n\nCLARIFICATIONS:\n${relevantQuestions.map(q => `Q: ${q.text}\nA: ${q.answer}`).join('\n\n')}`
      : ""

    const assumptionsContext = relevantAssumptions.length > 0
      ? `\n\nACCEPTED ASSUMPTIONS:\n${relevantAssumptions.map(a => `- ${a.text}`).join('\n')}`
      : ""

    const prompt = `
Create a prompt optimized for ${ideType} IDE for implementing the following feature.

${CODE_QUALITY_INSTRUCTION}

ORIGINAL REQUIREMENT:
${requirement}

ANALYSIS RESULTS:
• Goals: ${analysis.goals.join(', ')}
• Constraints: ${analysis.constraints.join(', ')}
• Dependencies: ${analysis.dependencies.join(', ')}
• Edge Cases: ${analysis.edgeCases.join(', ')}
• Acceptance Criteria: ${analysis.acceptanceCriteria.join(', ')}${questionsContext}${assumptionsContext}

Generate a prompt tailored for ${ideType} that includes:
1. Clear objective
2. Technical specifications
3. Implementation guidance
4. Best practices for ${ideType}
5. Expected deliverables

Format the response appropriately for ${ideType}'s workflow and capabilities.`

    return await aiService.generateResponse(prompt)
  }

  async improvePrompt({
    originalPrompt,
    ideType,
    improvementInstructions,
    requirement,
    analysis
  }: {
    originalPrompt: string
    ideType: string
    improvementInstructions: string
    requirement?: string
    analysis?: Analysis
  }): Promise<string> {
    const contextInfo = requirement && analysis ? `

ORIGINAL CONTEXT:
Requirement: ${requirement}
Goals: ${analysis.goals.join(', ')}
Constraints: ${analysis.constraints.join(', ')}
Dependencies: ${analysis.dependencies.join(', ')}
` : ""

    const prompt = `
Improve the following ${ideType} IDE prompt based on the user's feedback and instructions.

ORIGINAL PROMPT:
${originalPrompt}

USER IMPROVEMENT INSTRUCTIONS:
${improvementInstructions}${contextInfo}

Generate an improved version of the prompt that:
1. Addresses the user's specific feedback
2. Maintains the original intent and structure
3. Enhances clarity and effectiveness
4. Remains optimized for ${ideType} IDE
5. Incorporates best practices for prompt engineering

Return only the improved prompt without additional commentary.`

    return await aiService.generateResponse(prompt)
  }
}

export const promptService = new PromptService()
