export type Limit = { percentUsed: number; resetsAt?: string }

declare module 'claude-code' {
  interface PluginState {
    'usage-bar': {
      limit: Limit | null
      weekly: Limit | null
      totalUsd: number | null
      baseUsd: number | null
      turnUsd: number | null
    }
  }
}
