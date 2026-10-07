export type Agent = {
  id: string
  label: string
  kind: string
  depth: number
  toolUseId: string | null
  isBackground: boolean
  startedAt: number
  isDone: boolean
}

export type Step = {
  title: string
  status: 'pending' | 'in_progress' | 'completed'
  doneAt: number | null
}

// The steps a session's model reported for its task, as the store keeps them.
export type Plan = {
  goal: string | null
  steps: Step[]
  // When the plan was first and last reported.
  since: number
  at: number
}

// A plan as a row shows it.
export type PlanSummary = {
  done: number
  total: number
  step: string | null
  goal: string | null
}

// What a turn is doing, read off its tool calls: reading, changing files, or
// running commands after its last change.
export type Phase = 'explore' | 'build' | 'verify'

export type Row = {
  id: string
  hostId: string | null
  name: string
  cwd: string | null
  task: string | null
  agents: Agent[]
  startedAt: number
  endedAt: number | null
  estimateMs: number
  plan: PlanSummary | null
  phase: Phase
  percent: number
  leftMs: number
}

declare module 'claude-code' {
  interface PluginState {
    'session-board': { rows: Row[]; hidden: string[]; polledAt: number }
  }
}
