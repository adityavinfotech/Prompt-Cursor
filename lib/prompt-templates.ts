import { promptConfig } from "./prompt-config"

export const SYSTEM_RULES = `
[SYSTEM]
Role: You are an expert software requirements analyst and software architect.
Rules:
- Use only the provided information; do not invent facts.
- If information is missing, ask targeted questions (avoid yes/no; request examples/constraints).
- In conflicts, REQUIREMENT takes precedence over CONTEXT unless the requirement defers to legacy behavior.
- Never reveal chain-of-thought or internal reasoning. When structured output is requested, respond with JSON only.
- Be specific, concise, and testable in your outputs.
- Avoid PII; do not include secrets or keys.
Version: ${promptConfig.version} (${promptConfig.mode})
`

export const ANALYSIS_INSTRUCT = `
[TASK: ANALYSIS]
Analyze REQUIREMENT + CONTEXT and produce structured JSON:
- goals (3–5) measurable and outcome-focused
- constraints (2–4) technical/business/regulatory
- dependencies (2–4) systems/libraries/prereqs
- edgeCases (3–5)
- acceptanceCriteria (3–6) using Given/When/Then
- questions (2–4) with priority: critical|important|nice-to-have
- assumptions (2–4) with confidence 0.0–1.0
Rules: no duplicates; IDs stable/deterministic; JSON only.
`

export const QUESTIONS_INSTRUCT = `
[TASK: QUESTIONS]
Generate 1–3 high-value clarifying questions that reduce risk/ambiguity.
Prioritize impact on design, data, UX, and constraints. Avoid overlaps with answered ones.
Return JSON only with an array of questions and required fields.
`

export const REFINE_INSTRUCT = `
[TASK: REFINE]
Refine analysis based on new answers/assumptions. Return only fields that materially change.
Do not regress previously accepted items. Preserve voice/format. JSON only.
`

export function buildAnalysisPrompt({ requirement, context, jsonSchema }: { requirement: string; context?: string; jsonSchema: string }) {
  return `${SYSTEM_RULES}\n${ANALYSIS_INSTRUCT}

REQUIREMENT:
${requirement}

CONTEXT:
${(context || "").trim() || "(none)"}

SCHEMA:
${jsonSchema}
\nRespond with valid JSON only, matching the schema exactly.`
}

export function buildQuestionsPrompt({ requirement, currentAnalysis, answeredQuestionsSchema }: { requirement: string; currentAnalysis: string; answeredQuestionsSchema: string }) {
  return `${SYSTEM_RULES}\n${QUESTIONS_INSTRUCT}

REQUIREMENT:
${requirement}

CURRENT ANALYSIS:
${currentAnalysis}

SCHEMA:
${answeredQuestionsSchema}
\nRespond with valid JSON only, matching the schema exactly.`
}

export function buildRefinePrompt({ requirement, currentAnalysis, answered, accepted, jsonSchema }: { requirement: string; currentAnalysis: string; answered: string; accepted: string; jsonSchema: string }) {
  return `${SYSTEM_RULES}\n${REFINE_INSTRUCT}

REQUIREMENT:
${requirement}

CURRENT ANALYSIS:
${currentAnalysis}

ANSWERED QUESTIONS:
${answered}

ACCEPTED ASSUMPTIONS:
${accepted}

SCHEMA:
${jsonSchema}
\nRespond with valid JSON only, matching the schema exactly.`
}


