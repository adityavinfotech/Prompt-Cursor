type TelemetryEvent = {
  name: string
  data?: Record<string, unknown>
}

export function logEvent(event: TelemetryEvent) {
  try {
    // Simple console-based telemetry; replace with real sink later
    // eslint-disable-next-line no-console
    console.log(`[telemetry] ${event.name}`, JSON.stringify(event.data || {}))
  } catch {}
}

export function logPromptUsage(params: {
  template: string
  version: string
  mode: string
  inputChars: number
  outputChars?: number
  latencyMs?: number
  parseOk?: boolean
  repairAttempts?: number
}) {
  logEvent({ name: "prompt_usage", data: params })
}


