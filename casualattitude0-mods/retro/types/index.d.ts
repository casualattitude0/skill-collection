export type RetroDecision = 'pending' | 'apply' | 'skip'

export type RetroItem = {
  id: string
  file: string
  title: string
  why: string
  proposed: string
  decision: RetroDecision
}

export type RetroReview = {
  status: 'idle' | 'running' | 'ready' | 'error'
  items: RetroItem[]
  note: string
}

export type RetroAsk = { turnId: string }

declare module 'claude-code' {
  interface PluginState {
    retro: { ask: RetroAsk | null; review: RetroReview }
  }
}
