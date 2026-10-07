import { atom, read, update } from 'claude-code'
import type {
  EngineInterface,
  Register,
  SessionCost,
  SessionRateLimit,
} from 'claude-code'

import type { Limit } from '../types'

const limit = atom({ plugin: 'usage-bar', key: 'limit' } as const, null)
const weekly = atom({ plugin: 'usage-bar', key: 'weekly' } as const, null)
const totalUsd = atom({ plugin: 'usage-bar', key: 'totalUsd' } as const, null)
const baseUsd = atom({ plugin: 'usage-bar', key: 'baseUsd' } as const, null)
const turnUsd = atom({ plugin: 'usage-bar', key: 'turnUsd' } as const, null)

const pick = (rateLimits: SessionRateLimit[], kind: string): Limit | null => {
  const w = rateLimits.find(r => r.kind === kind)

  return w ? { percentUsed: w.percentUsed, resetsAt: w.resetsAt } : null
}

const untilReset = (resetsAt: string | undefined, now: number): string => {
  const ms = resetsAt ? Date.parse(resetsAt) - now : NaN

  if (!(ms > 0)) {
    return ''
  }

  const minutes = Math.ceil(ms / 60_000)
  const d = Math.floor(minutes / 1440)
  const h = Math.floor((minutes % 1440) / 60)
  const m = minutes % 60

  return d > 0 ? `${d}d${h}h` : h > 0 ? `${h}h${m}m` : `${m}m`
}

// How much room the band has decides how much each block says.
type Size = 'full' | 'compact' | 'short' | 'tiny'

const SIZES: readonly Size[] = ['full', 'compact', 'short', 'tiny']

const remaining = (
  size: Size,
  label: string,
  w: Limit | null,
  now: number,
): string => {
  const name = size === 'tiny' ? label.slice(0, 1) : label

  if (w === null) {
    return `${name} —`
  }

  const percent = `${Math.max(0, Math.round(100 - w.percentUsed))}%`
  const reset = untilReset(w.resetsAt, now)

  return size === 'full'
    ? `${name} 剩餘 ${percent}${reset === '' ? '' : ` (${reset} 後重置)`}`
    : size === 'compact'
      ? `${name} ${percent}${reset === '' ? '' : ` · ${reset}`}`
      : `${name} ${percent}`
}


const cells = (text: string): number =>
  [...text].reduce((n, ch) => n + (ch > '\u2e7f' ? 2 : 1), 0)

// A row of blocks' width in cells: each padded by one a side, one between.
const widthOf = (blocks: string[]): number =>
  blocks.reduce((sum, text) => sum + cells(text) + 2, 0) + blocks.length - 1

const ORANGE = '#D97757'
const WHITE = '#FFFFFF'
const BLOCK = '#3A2A24'
// A figure with its unit: 77%, 2h13m, 3d4h, $0.250.
const NUMBER = /(\$?\d[\d.dhm%]*)/

const usd = (n: number): string => `$${n.toFixed(n < 1 ? 3 : 2)}`

const record = async (
  $: EngineInterface,
  rateLimits: SessionRateLimit[],
  cost: SessionCost | undefined,
) => {
  await update($, limit, () => pick(rateLimits, 'five_hour'))
  await update($, weekly, () => pick(rateLimits, 'seven_day'))

  if (cost === undefined) {
    return
  }

  const total = cost.usd
  await update($, totalUsd, () => total)

  // First reading of the session: this turn starts counting from here.
  const base = (await read($, baseUsd)) ?? total
  await update($, baseUsd, () => base)
  await update($, turnUsd, () => Math.max(0, total - base))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    const usage = await $.session.usage()
    await record($, usage.rateLimits, usage.cost)

    return result
  })

  on('prompt.submit', async ($, e, next) => {
    const total = await read($, totalUsd)

    if (total !== null) {
      await update($, baseUsd, () => total)
      await update($, turnUsd, () => 0)
    }

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await record($, e.rateLimits, e.cost)

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const session = await read($, limit)
    const week = await read($, weekly)
    const turn = await read($, turnUsd)
    const total = await read($, totalUsd)

    // Another mod's band (session-board) stays up above this one.
    const below = await next(e)

    if (
      e.props.hasSurvey ||
      (session === null && week === null && total === null)
    ) {
      return below
    }

    const { Box, Text } = $.ui.resolve(e)
    const now = session?.resetsAt || week?.resetsAt ? await $.clock.now() : 0
    const cost = (n: number | null) => (n === null ? '—' : usd(n))
    const blocksAt = (size: Size) => [
      remaining(size, 'Session', session, now),
      remaining(size, 'Weekly', week, now),
      `${size === 'full' ? 'Session 總計' : '總計'} ${cost(total)}`,
      `${size === 'full' ? '本次對話' : '本次'} ${cost(turn)}`,
    ]
    // The fullest wording that fits on one row; the shortest wraps if none does.
    const room = e.props.bodyColumns ?? 120
    const size = SIZES.find(one => widthOf(blocksAt(one)) <= room) ?? 'tiny'
    const blocks = blocksAt(size)
    // On one row the blocks share the band's width evenly.
    const share = Math.floor((room - (blocks.length - 1)) / blocks.length)
    const isEven = blocks.every(text => cells(text) + 2 <= share)

    return (
      <Box flexDirection="column">
        {below}
        <Box flexWrap="wrap" columnGap={1} rowGap={1}>
          {blocks.map((text, i) => (
            <Box
              key={`block-${i}`}
              backgroundColor={BLOCK}
              paddingX={1}
              justifyContent="center"
              width={isEven ? share : undefined}
              flexGrow={1}
            >
              <Text color={ORANGE}>
                {text.split(NUMBER).map((part, j) =>
                  j % 2 === 1 ? <Text color={WHITE}>{part}</Text> : part,
                )}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>
    )
  })
}
