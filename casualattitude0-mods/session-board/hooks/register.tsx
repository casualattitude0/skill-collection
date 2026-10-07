import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Agent, Phase, Plan, PlanSummary, Row, Step } from '../types'

const rows = atom({ plugin: 'session-board', key: 'rows' } as const, [])
const hidden = atom({ plugin: 'session-board', key: 'hidden' } as const, [])
const polledAt = atom({ plugin: 'session-board', key: 'polledAt' } as const, 0)

const POLL_MS = 5_000
// A turn's length before any has been timed.
const DEFAULT_MS = 5 * 60_000
// A finished row leaves by itself after this long.
const KEEP_DONE_MS = 30 * 60_000
// How much of a transcript's end is read for the latest requests.
const TAIL_BYTES = 300_000
// A background subagent whose transcript has been still this long is taken as done.
const QUIET_MS = 90_000
// A turn this young may still report a plan: its title is not asked for yet.
const TITLE_AFTER_MS = 15_000
const TOOL = 'mcp__session-board__update_progress'
// The session name's column: as wide as the longest name, up to this many cells.
const NAME = 40
// The bar's glyph, more of it than any band is wide: its box clips it.
const LINE = '━'.repeat(240)
// The session name where a surface draws vectors: smaller than the row's text.
const NAME_PX = 11
const GRAY = '#8C8C8C'
const AGENT = 44
const ORANGE = '#D97757'
const GREEN = '#7FA66B'
// The running mark where a surface draws vectors: a dot that breathes and
// flickers. `r` is its radius at rest, in a 16px box.
// Drawn as an image, never `isInteractive`: that frame has an opaque white backdrop.
const pulse = (r: number): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">` +
  `<circle cx="8" cy="8" r="${r}" fill="${ORANGE}">` +
  `<animate attributeName="r" dur="3.2s" repeatCount="indefinite" ` +
  `values="${r};${r * 1.08};${r * 0.94};${r}" keyTimes="0;0.35;0.7;1"/>` +
  `<animate attributeName="opacity" dur="2.2s" repeatCount="indefinite" ` +
  `values="1;0.5;0.9;0.6;1" keyTimes="0;0.2;0.45;0.7;1"/>` +
  `</circle></svg>`

const escape = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// A cell is about 0.6 of the font's size wide, a CJK glyph two cells.
const nameWidth = (text: string): number =>
  Math.ceil(cells(text) * NAME_PX * 0.6) + 2

const small = (text: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${nameWidth(text)}" height="16">` +
  `<text x="0" y="12" font-size="${NAME_PX}" fill="${GRAY}" ` +
  `font-family="system-ui, -apple-system, sans-serif">${escape(text)}</text></svg>`

const TOOL_DESCRIPTION =
  'Report the steps of the task you are working on and where you are in them. ' +
  'The person sees it as a progress bar; it changes nothing else. Send the ' +
  'whole list of steps every time, each with its current status.'

const TOOL_SCHEMA = {
  type: 'object',
  properties: {
    goal: {
      type: 'string',
      description: 'The task in a few words, in the language the person writes in.',
    },
    steps: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'The step in a few words.' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
        },
        required: ['title', 'status'],
      },
    },
  },
  required: ['steps'],
}

const PROGRESS_SECTION =
  `# Reporting progress\n\n` +
  `When a task will take three or more steps, call ${TOOL} once you have sized ` +
  `it up, with a short goal and every step you expect, the tests and checks ` +
  `at the end included. Call it again each time a step starts or finishes, ` +
  `sending the whole list. Add steps when you find more work than you ` +
  `expected, and mark the last one completed only when the work is verified. ` +
  `Write the goal and the steps in the language the person writes in. Skip ` +
  `it for questions and one-step edits.`

const TITLE_SYSTEM =
  'You label what a coding assistant session is working on right now. ' +
  'Reply with one short title: at most 12 CJK characters or 5 English words, ' +
  'in the language of the latest request, no quotes, no ending punctuation. ' +
  'Reply with the title only.'

// One file of ~/.claude/sessions: what a running Claude Code process says of itself.
type Entry = {
  sessionId: string
  hostSessionId?: string
  name?: string
  cwd?: string
  status?: string
  statusUpdatedAt?: number
}

// One line of a transcript, as far as this mod reads it.
type Line = {
  type?: string
  isMeta?: boolean
  isSidechain?: boolean
  message?: { content?: unknown }
}

type Block = { type?: string; text?: string; name?: string }

type Meta = {
  description?: string
  agentType?: string
  spawnDepth?: number
  toolUseId?: string
  requestShape?: string
}

type Durations = Record<string, number[]>

// Titles by row key, shared by every session running this mod: one ask a turn.
type Titles = Record<string, { title: string; at: number }>

// Reported plans by session id, shared like the titles.
type Plans = Record<string, Plan>

// Sessions whose title was asked for, by row key: a failed ask is not repeated forever.
const asked = new Map<string, number>()
let isPolling = false

const parse = <T,>(text: string): T | null => {
  try {
    const value = JSON.parse(text) as T | null

    return typeof value === 'object' ? value : null
  } catch {
    return null
  }
}

const median = (list: number[]): number => {
  const sorted = [...list].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 1
    ? (sorted[mid] ?? 0)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
}

// How far a phase lets the bar go, and how much of a typical turn is still
// ahead of it: a turn still reading files is never shown as nearly done.
const PHASES: Record<Phase, { cap: number; ahead: number }> = {
  explore: { cap: 40, ahead: 1.5 },
  build: { cap: 85, ahead: 1 },
  verify: { cap: 95, ahead: 0.5 },
}
const WRITES = ['Edit', 'Write', 'NotebookEdit', 'MultiEdit']
// A turn with this many tool calls and no file written is working through commands.
const BUSY_CALLS = 15

// Progress and time left for a turn `elapsed` ms in: the bar closes on its
// phase's cap without reaching it, and the time left shrinks as it goes
// instead of running out while the turn still works.
const gauge = (elapsed: number, estimateMs: number, phase: Phase) => {
  const { cap, ahead } = PHASES[phase]
  const scale = estimateMs * ahead
  const spent = Math.max(0, elapsed)

  return {
    percent: Math.min(cap, Math.round((spent / (spent + scale)) * 100)),
    leftMs: (scale * scale) / (spent + scale),
  }
}

const estimate = (durations: Durations, id: string): number => {
  const own = durations[id] ?? []
  const all = own.length > 0 ? own : Object.values(durations).flat()

  return all.length > 0 ? Math.max(60_000, median(all)) : DEFAULT_MS
}

const rowKey = (row: Row): string => `${row.id}:${row.startedAt}`

const cells = (text: string): number =>
  [...text].reduce((n, ch) => n + (ch > '⹿' ? 2 : 1), 0)

const clip = (text: string, width: number): string => {
  if (cells(text) <= width) {
    return text
  }

  let out = ''

  for (const ch of text) {
    if (cells(out + ch) > width - 1) {
      break
    }

    out += ch
  }

  return `${out}…`
}

const span = (ms: number): string => {
  const minutes = Math.ceil(ms / 60_000)

  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h${minutes % 60}m`
    : `${minutes}m`
}

// A transcript's lines, less the fragment a tail cut mid-line starts with.
const linesOf = (text: string): string[] => {
  const lines = text.split('\n')

  return text.length >= TAIL_BYTES ? lines.slice(1) : lines
}

// What the person typed in a line of the transcript; '' for any other line.
const typedIn = (line: string): string => {
  const row = line.includes('"type":"user"') ? parse<Line>(line) : null

  if (!row || row.type !== 'user' || row.isMeta || row.isSidechain) {
    return ''
  }

  const content = row.message?.content
  const blocks = Array.isArray(content) ? (content as Block[]) : []
  const typed =
    typeof content === 'string'
      ? content
      : blocks.some(b => b.type === 'tool_result')
        ? ''
        : blocks.map(b => (b.type === 'text' ? (b.text ?? '') : '')).join(' ')

  return typed.trimStart().startsWith('<') ? '' : typed.trim()
}

// The last three requests the person typed.
const requests = (text: string): string[] =>
  linesOf(text)
    .map(typedIn)
    .filter(typed => typed !== '')
    .map(typed => typed.slice(0, 600))
    .slice(-3)

// What the turn is doing, from the tools it has called since the last request.
const phaseOf = (text: string): Phase => {
  let calls = 0
  let hasWritten = false
  let ranAfter = false

  for (const line of linesOf(text)) {
    if (typedIn(line) !== '') {
      calls = 0
      hasWritten = false
      ranAfter = false
      continue
    }

    const row = line.includes('"type":"tool_use"') ? parse<Line>(line) : null
    const content = row?.type === 'assistant' && !row.isSidechain ? row.message?.content : []

    for (const block of Array.isArray(content) ? (content as Block[]) : []) {
      if (block.type !== 'tool_use') {
        continue
      }

      calls += 1

      if (WRITES.includes(block.name ?? '')) {
        hasWritten = true
        ranAfter = false
      } else if (block.name === 'Bash' && hasWritten) {
        ranAfter = true
      }
    }
  }

  return ranAfter ? 'verify' : hasWritten || calls >= BUSY_CALLS ? 'build' : 'explore'
}

const run = async ($: EngineInterface, argv: string[]): Promise<string> => {
  const ran = await $.process.run(argv, { timeoutMs: 5_000 })

  return ran.exitCode === 0 ? ran.stdout : ''
}

// A short title for what the session is on, from its latest requests.
const describe = async (
  $: EngineInterface,
  row: Row,
  transcript: string,
): Promise<string | null> => {
  const asks = requests(transcript)

  if (asks.length === 0) {
    return null
  }

  const reply = await $.model.complete({
    model: 'haiku',
    maxTokens: 60,
    system: TITLE_SYSTEM,
    prompt:
      `Session name: ${row.name}\n\nRecent requests, oldest first:\n` +
      asks.map((ask, i) => `${i + 1}. ${ask}`).join('\n') +
      '\n\nTitle for the latest request (the earlier ones are context only):',
  })
  const title = reply.isAnswered ? (reply.text.trim().split('\n')[0] ?? '') : ''

  return title === '' ? null : title
}

const STATUSES: readonly Step['status'][] = ['pending', 'in_progress', 'completed']

// The steps of a report, as far as they are well formed.
const stepsOf = (value: unknown): { title: string; status: Step['status'] }[] =>
  (Array.isArray(value) ? value : []).flatMap(one => {
    const step = one as { title?: unknown; status?: unknown } | null
    const status = STATUSES.find(s => s === step?.status)

    return typeof step?.title === 'string' && step.title.trim() !== '' && status
      ? [{ title: step.title.trim().slice(0, 80), status }]
      : []
  })

// Keeps a session's reported plan where every session's board reads it.
const note = async (
  $: EngineInterface,
  goal: unknown,
  steps: { title: string; status: Step['status'] }[],
): Promise<string> => {
  const id = await $.session.id()
  const now = await $.clock.now()
  const plans = ((await $.store.get('plans')) ?? {}) as Plans
  const was = plans[id]
  // A turn's first report starts the task's clock; the turn's later ones keep it.
  const turn = (await read($, rows)).find(r => r.id === id && r.endedAt === null)
  const isSame = was !== undefined && was.at >= (turn?.startedAt ?? now) - 2_000
  const plan: Plan = {
    goal: typeof goal === 'string' && goal.trim() !== '' ? goal.trim().slice(0, 80) : (was?.goal ?? null),
    steps: steps.map(step => ({
      ...step,
      doneAt:
        step.status === 'completed'
          ? ((isSame ? was.steps.find(s => s.title === step.title)?.doneAt : null) ?? now)
          : null,
    })),
    since: isSame ? was.since : now,
    at: now,
  }
  const kept = Object.entries(plans).filter(
    ([, one]) => now - one.at < 24 * 60 * 60_000,
  )
  await $.store.set('plans', { ...Object.fromEntries(kept), [id]: plan })

  const done = steps.filter(s => s.status === 'completed').length

  return `Progress noted: ${done} of ${steps.length} steps done.`
}

const summaryOf = (plan: Plan): PlanSummary => ({
  done: plan.steps.filter(s => s.status === 'completed').length,
  total: plan.steps.length,
  step:
    (
      plan.steps.find(s => s.status === 'in_progress') ??
      plan.steps.find(s => s.status === 'pending')
    )?.title ?? null,
  goal: plan.goal,
})

// Progress and time left from a reported plan: steps done out of all, and
// the pace of the steps finished since the first report carried forward.
// With no step timed yet, the time left is `fallbackMs`.
const planGauge = (plan: Plan, now: number, fallbackMs: number) => {
  const done = plan.steps.filter(s => s.status === 'completed')
  const isActive = plan.steps.some(s => s.status === 'in_progress')
  const total = plan.steps.length
  const timed = done.flatMap(s =>
    s.doneAt !== null && s.doneAt > plan.since ? [s.doneAt] : [],
  )
  const last = Math.max(plan.since, ...timed)
  const pace = timed.length > 0 ? (last - plan.since) / timed.length : 0

  return {
    // A running turn is never shown as finished.
    percent: Math.min(
      97,
      Math.round(((done.length + (isActive ? 0.5 : 0)) / total) * 100),
    ),
    leftMs:
      pace > 0
        ? Math.max(pace * (total - done.length) - (now - last), pace * 0.25)
        : fallbackMs,
  }
}

// The subagents the session started in this turn, oldest first. One the
// session waits on is done once its result is in the session's transcript.
const scan = async (
  $: EngineInterface,
  dir: string,
  row: Row,
  transcript: string,
  now: number,
): Promise<Agent[]> => {
  const folder = `${dir}/${row.id}/subagents`
  const files = await $.fs.list(folder).catch(() => [])
  const out: Agent[] = []

  for (const file of files) {
    const id = /^agent-(.+)\.meta\.json$/.exec(file.name)?.[1]
    const was = row.agents.find(a => a.id === id)

    if (id === undefined || (!was && file.mtimeMs < row.startedAt - 2_000)) {
      continue
    }

    const meta = was
      ? null
      : parse<Meta>(await $.fs.read(`${folder}/${file.name}`).catch(() => ''))
    const agent: Agent = was ?? {
      id,
      label: meta?.description ?? id,
      kind: meta?.agentType ?? '',
      depth: meta?.spawnDepth ?? 1,
      toolUseId: meta?.toolUseId ?? null,
      isBackground: meta?.requestShape !== 'foreground',
      startedAt: file.mtimeMs,
      isDone: false,
    }

    const wroteAt =
      files.find(f => f.name === `agent-${id}.jsonl`)?.mtimeMs ?? agent.startedAt
    const isDone =
      agent.isDone ||
      (agent.isBackground || agent.toolUseId === null
        ? now - wroteAt > QUIET_MS
        : transcript.includes(`"tool_use_id":"${agent.toolUseId}"`))

    out.push({ ...agent, isDone })
  }

  return out.sort((a, b) => a.startedAt - b.startedAt)
}

const poll = async ($: EngineInterface) => {
  if (isPolling) {
    return
  }

  isPolling = true

  try {
    const home = await $.env.get('HOME')

    if (!home) {
      return
    }

    const dir = `${home}/.claude/sessions`
    const files = (await $.fs.list(dir)).filter(f => /^\d+\.json$/.test(f.name))
    const busy: Entry[] = []

    for (const file of files) {
      const entry = parse<Entry>(
        await $.fs.read(`${dir}/${file.name}`).catch(() => ''),
      )

      if (
        entry &&
        typeof entry.sessionId === 'string' &&
        entry.status !== undefined &&
        entry.status !== 'idle'
      ) {
        busy.push(entry)
      }
    }

    const now = await $.clock.now()
    // Rows kept from before this mod read tasks and subagents lack the fields.
    const before = (await read($, rows)).map(
      (r): Row => ({
        ...r,
        cwd: r.cwd ?? null,
        task: r.task ?? null,
        agents: r.agents ?? [],
        plan: r.plan ?? null,
        phase: r.phase ?? 'build',
        percent: r.percent ?? 0,
        leftMs: r.leftMs ?? 0,
      }),
    )
    const durations = ((await $.store.get('durations')) ?? {}) as Durations
    const timed: Durations = {}
    const running = busy.map((entry): Row => {
      const was = before.find(r => r.id === entry.sessionId && r.endedAt === null)

      return {
        id: entry.sessionId,
        hostId: entry.hostSessionId ?? null,
        name: entry.name ?? entry.cwd?.split('/').pop() ?? entry.sessionId,
        cwd: entry.cwd ?? null,
        task: was?.task ?? null,
        agents: was?.agents ?? [],
        plan: was?.plan ?? null,
        startedAt: was?.startedAt ?? entry.statusUpdatedAt ?? now,
        endedAt: null,
        estimateMs: was?.estimateMs ?? estimate(durations, entry.sessionId),
        // A session whose transcript cannot be read is taken as mid-work.
        phase: was?.phase ?? 'build',
        percent: was?.percent ?? 0,
        leftMs: was?.leftMs ?? 0,
      }
    })

    const plans = ((await $.store.get('plans')) ?? {}) as Plans
    // A plan counts for the turn it was last reported in.
    const planOf = (row: Row): Plan | null => {
      const plan = plans[row.id]

      return plan && plan.at >= row.startedAt - 2_000 && plan.steps.length > 0
        ? plan
        : null
    }

    for (const row of running) {
      const plan = planOf(row)
      row.plan = plan ? summaryOf(plan) : null

      if (row.cwd === null) {
        continue
      }

      const project = `${home}/.claude/projects/${row.cwd.replace(/[^a-zA-Z0-9]/g, '-')}`
      const tries = asked.get(rowKey(row)) ?? 0
      const transcript = await run($, [
        'tail',
        '-c',
        String(TAIL_BYTES),
        `${project}/${row.id}.jsonl`,
      ]).catch(() => '')
      row.phase = transcript === '' ? row.phase : phaseOf(transcript)
      row.agents = await scan($, project, row, transcript, now).catch(
        () => row.agents,
      )

      if (row.task !== null) {
        continue
      }

      const titles = ((await $.store.get('titles')) ?? {}) as Titles
      const known = titles[rowKey(row)]

      if (known) {
        row.task = known.title
      } else if (
        tries < 3 &&
        row.plan === null &&
        now - row.startedAt >= TITLE_AFTER_MS
      ) {
        asked.set(rowKey(row), tries + 1)
        const title = await describe($, row, transcript).catch(() => null)
        const kept = Object.entries(titles).filter(
          ([, one]) => now - one.at < 24 * 60 * 60_000,
        )
        row.task = title

        if (title !== null) {
          await $.store.set('titles', {
            ...Object.fromEntries(kept),
            [rowKey(row)]: { title, at: now },
          })
        }
      }
    }

    for (const row of running) {
      const guess = gauge(now - row.startedAt, row.estimateMs, row.phase)
      const plan = planOf(row)

      if (plan) {
        // The model's own count: it may step back when it finds more work.
        const told = planGauge(plan, now, guess.leftMs)
        row.percent = told.percent
        row.leftMs = told.leftMs
        continue
      }

      // A guess never steps back when a turn returns to an earlier phase.
      row.percent = Math.max(row.percent, guess.percent)
      row.leftMs = guess.leftMs
    }

    // Finished rows and dismissals live in the store, so every session
    // running this mod shows the same board.
    const sharedDone = ((await $.store.get('done')) ?? []) as Row[]
    const sharedHidden = ((await $.store.get('hidden')) ?? []) as string[]
    const known = sharedDone.map(rowKey)
    const finished = before
      .filter(r => r.endedAt === null && !running.some(one => one.id === r.id))
      .filter(r => !known.includes(rowKey(r)))
      .map((r): Row => {
        timed[r.id] = [...(durations[r.id] ?? []), now - r.startedAt].slice(-5)

        return {
          ...r,
          endedAt: now,
          percent: 100,
          leftMs: 0,
          agents: r.agents.map(a => ({ ...a, isDone: true })),
        }
      })
    const done = [...sharedDone, ...finished]
      .filter(r => !running.some(one => one.id === r.id))
      .filter(r => now - (r.endedAt ?? now) < KEEP_DONE_MS)
    const after = [...running, ...done].sort((a, b) => a.startedAt - b.startedAt)
    const keys = after.map(rowKey)
    const gone = sharedHidden.filter(key => keys.includes(key))

    if (Object.keys(timed).length > 0) {
      await $.store.set('durations', { ...durations, ...timed })
    }

    if (JSON.stringify(done) !== JSON.stringify(sharedDone)) {
      await $.store.set('done', done)
    }

    if (gone.length !== sharedHidden.length) {
      await $.store.set('hidden', gone)
    }

    if (JSON.stringify(after) !== JSON.stringify(before)) {
      await update($, rows, () => after)
    }

    if (JSON.stringify(gone) !== JSON.stringify(await read($, hidden))) {
      await update($, hidden, () => gone)
    }

    // The bars move with the clock alone: a new reading redraws them.
    if (running.length > 0) {
      await update($, polledAt, () => now)
    }
  } catch {
    // A sessions folder that cannot be read leaves the last reading up.
  } finally {
    isPolling = false
  }
}

// Takes a row off the board in every session: theirs at their next reading.
const dismiss = async ($: EngineInterface, row: Row) => {
  const shared = ((await $.store.get('hidden')) ?? []) as string[]
  const gone = [...shared.filter(key => key !== rowKey(row)), rowKey(row)]
  await $.store.set('hidden', gone)
  await update($, hidden, () => gone)
}

const jump = async ($: EngineInterface, row: Row) => {
  if (row.hostId === null || !/^[\w-]+$/.test(row.hostId)) {
    $.ui.toast(`「${row.name}」沒有可開啟的桌面版連結`)

    return
  }

  await $.process.run(['open', `claude://claude.ai/epitaxy/${row.hostId}`])
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await $.tool
      .register({
        name: 'update_progress',
        description: TOOL_DESCRIPTION,
        inputSchema: TOOL_SCHEMA,
      })
      .catch(() => undefined)
    // A prompt assembled before this mod loaded has no word of the tool.
    $.ui.invalidate('prompt.section')
    await poll($)
    $.clock.every(POLL_MS, () => void poll($))

    return result
  })

  // The instruction rides the section on how to do tasks: the full prompt's,
  // or the short prompt's body.
  for (const name of ['doing_tasks', 'lean_body']) {
    on('prompt.section', { name }, async ($, e, next) => {
      const { text } = await next(e)

      return { text: text === null ? null : `${text}\n\n${PROGRESS_SECTION}` }
    })
  }

  on('tool.call', { tool: TOOL }, async ($, e) => {
    const steps = stepsOf(e.steps)

    if (steps.length === 0) {
      return { result: 'Nothing noted: `steps` needs at least one { title, status }.' }
    }

    // A subagent's steps are its own: the row shows the session's.
    if (e.agentId !== undefined) {
      return { result: 'Noted.' }
    }

    const told = await note($, e.goal, steps)
    void poll($)

    return { result: told }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    const gone = await read($, hidden)
    const list = (await read($, rows)).filter(r => !gone.includes(rowKey(r)))

    if (e.props.hasSurvey || list.length === 0) {
      return below
    }

    const elements = $.ui.resolve(e)
    const { Box, Button, Text } = elements
    // The terminal draws nothing of a vector element, though its table may
    // carry one: its mark stays a glyph.
    const Svg =
      e.surface !== 'terminal' && 'Svg' in elements ? elements.Svg : null
    const now = Math.max(await read($, polledAt), await $.clock.now())
    // What each row says, then how much of it the band's width has room for:
    // the title first, the bar shorter and shorter, the session name last.
    const told = list.map(row => {
      const isRunning = row.endedAt === null
      const plan = isRunning ? (row.plan ?? null) : null
      const label = plan?.step ?? plan?.goal ?? row.task ?? row.name
      const left = `~${span(Math.max(1, row.leftMs ?? 0))}`

      return {
        row,
        isRunning,
        label,
        name: label === row.name ? '' : row.name,
        percent: isRunning ? (row.percent ?? 0) : 100,
        eta: !isRunning ? '' : plan ? `${plan.done}/${plan.total} · ${left}` : left,
      }
    })
    const room = e.props.bodyColumns ?? 120
    // The row is split down the middle by the surface's own layout, not by
    // counted cells (a desktop's cell is no fixed width): the mark, the title
    // and the session name share the left half; the bar fills what the
    // percentage, the time and the close mark leave of the right.
    const half = Math.floor(room / 2)
    const left = Math.max(8, half - 3)
    const wanted = Math.min(NAME, Math.max(0, ...told.map(t => cells(t.name))))
    const longest = Math.max(...told.map(t => cells(t.label)))
    const nameCells = wanted > 0 && longest + 1 + wanted <= left ? wanted : 0
    // The terminal cuts the title to its cells; elsewhere the half clips it.
    const titleCells =
      e.surface !== 'terminal' ? 60 : nameCells > 0 ? left - nameCells - 1 : left
    const hasKind = room >= 80
    const mark = (isRunning: boolean, r: number) =>
      isRunning && Svg ? (
        <Svg source={pulse(r)} alt="running" width={16} height={16} />
      ) : (
        <Text color={isRunning ? ORANGE : GREEN}>{isRunning ? '●' : '✓'}</Text>
      )

    return (
      <Box flexDirection="column">
        {told.map(({ row, isRunning, label, name, percent, eta }) => {
          const color = isRunning ? ORANGE : GREEN

          return (
            <Box key={`session-${row.id}`} flexDirection="column" marginBottom={1}>
              <Box key={`row-${row.id}`} columnGap={1} alignItems="center">
                <Box width="50%" columnGap={1} alignItems="center" overflow="hidden">
                  {mark(isRunning, 3.84)}
                  <Box flexGrow={1} flexShrink={1} overflow="hidden">
                    <Button
                      key={`open-${row.id}`}
                      plain
                      label={clip(label, titleCells)}
                      onPress={() => jump($, row)}
                    />
                  </Box>
                  {nameCells > 0 && name !== '' && (
                    <Box flexShrink={0}>
                      {Svg ? (
                        <Svg
                          source={small(clip(name, nameCells))}
                          alt={name}
                          width={nameWidth(clip(name, nameCells))}
                          height={16}
                        />
                      ) : (
                        <Text dimColor wrap="truncate-end">
                          {clip(name, nameCells)}
                        </Text>
                      )}
                    </Box>
                  )}
                </Box>
                <Box width="50%" columnGap={1} alignItems="center">
                  {/* Two runs of the glyph, each clipped to its share of the room. */}
                  <Box flexGrow={1} flexShrink={1} overflow="hidden">
                    <Box width={0} flexGrow={percent} overflow="hidden">
                      <Text color={color} wrap="truncate">
                        {LINE}
                      </Text>
                    </Box>
                    <Box width={0} flexGrow={100 - percent} overflow="hidden">
                      <Text color={color} dimColor wrap="truncate">
                        {LINE}
                      </Text>
                    </Box>
                  </Box>
                  <Box flexShrink={0}>
                    <Text bold>{percent}%</Text>
                  </Box>
                  {/* The time left shows at every width. */}
                  {eta !== '' && (
                    <Box flexShrink={0}>
                      <Text dimColor>{eta}</Text>
                    </Box>
                  )}
                  <Button
                    key={`hide-${row.id}`}
                    plain
                    label="×"
                    onPress={() => dismiss($, row)}
                  />
                </Box>
              </Box>
              {(row.agents ?? []).map(agent => {
                const kind = hasKind ? agent.kind : ''
                const width = Math.max(
                  8,
                  Math.min(
                    AGENT,
                    cells(agent.label),
                    room - agent.depth * 2 - 6 - cells(kind) - 5,
                  ),
                )

                return (
                  <Box
                    key={`agent-${row.id}-${agent.id}`}
                    columnGap={1}
                    alignItems="center"
                    marginLeft={agent.depth * 2}
                  >
                    <Text dimColor>└</Text>
                    {mark(!agent.isDone, 3.04)}
                    <Box width={width} flexShrink={0}>
                      <Text>{clip(agent.label, width)}</Text>
                    </Box>
                    <Text dimColor>{kind}</Text>
                    <Text dimColor>
                      {agent.isDone ? '' : span(Math.max(1, now - agent.startedAt))}
                    </Text>
                  </Box>
                )
              })}
            </Box>
          )
        })}
        {below}
      </Box>
    )
  })
}
