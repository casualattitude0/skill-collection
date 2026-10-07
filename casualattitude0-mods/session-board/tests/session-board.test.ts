import { expect, mock, test } from 'claude-code/testing'

const T0 = Date.parse('2026-10-08T10:00:00Z')
const HOME = '/Users/me'
const PROJECT = `${HOME}/.claude/projects/-Users-me-work-app`
const BAND = {
  plugin: 'session-board',
  component: 'AbovePrompt',
  props: { hasSurvey: false } as never,
} as const

const TOOL = 'mcp__session-board__update_progress'

const line = (value: object) => JSON.stringify(value)

test('lists running sessions with their task and subagents', async ($, on) => {
  const clock = mock.clock(on, { now: T0 })
  const finished = (id: string) => ({
    id,
    hostId: null,
    name: id,
    cwd: null,
    task: null,
    agents: [],
    startedAt: T0 - 120_000,
    endedAt: T0 - 60_000,
    estimateMs: 300_000,
    plan: null,
    phase: 'build',
    percent: 100,
    leftMs: 0,
  })

  // Another session running this mod saw two turns end and dismissed one.
  const store: Record<string, unknown> = {
    done: [finished('ddd'), finished('eee')],
    hidden: [`eee:${T0 - 120_000}`],
    titles: { [`ccc:${T0 - 10_000}`]: { title: '別處問過的標題', at: T0 } },
  }
  on('store.get', (_, e) => ({ value: store[e.key] }))
  on('store.set', (_, e) => {
    store[e.key] = e.value

    return { value: undefined }
  })
  mock.env(on, { HOME })

  const sessions: Record<string, object> = {
    '1.json': {
      sessionId: 'aaa',
      hostSessionId: 'local_aaa',
      name: 'Motion graphics showreel',
      cwd: '/Users/me/work.app',
      status: 'busy',
      statusUpdatedAt: T0 - 60_000,
    },
    '2.json': { sessionId: 'bbb', name: 'Idle one', status: 'idle' },
    // Another session running this mod already asked for this one's title.
    '3.json': {
      sessionId: 'ccc',
      name: 'Other',
      cwd: '/Users/me/other',
      status: 'busy',
      statusUpdatedAt: T0 - 10_000,
    },
  }
  let transcript = [
    line({ type: 'user', message: { content: '做一支 showreel' } }),
    line({ type: 'user', isMeta: true, message: { content: 'not typed' } }),
    line({
      type: 'user',
      message: { content: [{ type: 'tool_result', content: 'x' }] },
    }),
    line({ type: 'user', message: { content: '把片尾改成淡出' } }),
  ].join('\n')
  const ran: string[][] = []
  const prompts: string[] = []

  on('fs.list', (_, e) => ({
    value: (e.path.endsWith('/subagents')
      ? [
          { name: 'agent-old.meta.json', mtimeMs: T0 - 3_600_000 },
          { name: 'agent-x1.meta.json', mtimeMs: T0 - 30_000 },
          { name: 'agent-x1.jsonl', mtimeMs: T0 },
        ]
      : Object.keys(sessions).map(name => ({ name, mtimeMs: 0 }))
    ).map(f => ({ ...f, kind: 'file' as const, size: 1 })) as never,
  }))
  on('fs.read', (_, e) => ({
    value: e.path.endsWith('.meta.json')
      ? line({
          description: 'Render the frames',
          agentType: 'general-purpose',
          toolUseId: 'toolu_1',
          requestShape: 'foreground',
        })
      : JSON.stringify(sessions[e.path.split('/').pop() ?? '']),
  }))
  on('process.run', (_, e) => {
    ran.push([...e.argv])
    const stdout = e.argv[0] === 'tail' ? transcript : ''

    return { value: { exitCode: 0, stdout, stderr: '' } } as never
  })
  on('model.complete', (_, e) => {
    prompts.push(e.prompt)

    return { value: { isAnswered: true, text: '片尾改淡出\n' } } as never
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.id', () => ({ value: 'aaa' }))
  on('tool.register', () => ({ value: { tool: TOOL } }) as never)
  on('prompt.section', (_, e) => ({ text: e.text }))
  on('ui.render', (engine, e) => {
    const { Text } = engine.ui.resolve(e)

    return Text({ children: 'beneath' }) as never
  })

  await $.session.start({ cwd: '/w', surface: 'terminal', isInteractive: true })

  // The transcript and the subagents are read from the session's project folder.
  expect(ran).toContainEqual(['tail', '-c', '300000', `${PROJECT}/aaa.jsonl`])
  expect(prompts).toHaveLength(1)
  expect(prompts[0]).toContain('1. 做一支 showreel\n2. 把片尾改成淡出')
  expect(prompts[0]).not.toContain('not typed')

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text)

    // One minute into a turn estimated at five, and nothing but reading so far.
    expect(texts).toContain('12%')
    // Two sessions and one subagent run: glyphs on the terminal, drawn dots elsewhere.
    expect(texts.filter(t => t === '●')).toHaveLength(surface === 'terminal' ? 3 : 0)
    expect(await ui.findAll({ type: 'Svg' })).toHaveLength(
      // Three running dots and two session names.
      surface === 'terminal' ? 0 : 5,
    )
    expect(texts).toContain('~7m')
    // The whole session name: small drawn text where vectors are, else dim text.
    expect(
      surface === 'terminal'
        ? texts
        : (await ui.findAll({ type: 'Svg' })).map(s => s.props.alt),
    ).toContain('Motion graphics showreel')
    expect(texts).toContain('Render the frames')
    expect(texts).toContain('general-purpose')
    expect(texts).toContain('beneath')
    expect((await ui.find({ key: 'open-aaa' }))?.props.label).toBe('片尾改淡出')
    expect((await ui.find({ key: 'open-ccc' }))?.props.label).toBe(
      '別處問過的標題',
    )
    expect(await ui.find({ key: 'agent-aaa-x1' })).toBeDefined()
    expect(await ui.find({ key: 'agent-aaa-old' })).toBeUndefined()
    expect(await ui.find({ key: 'open-bbb' })).toBeUndefined()
    expect(await ui.find({ key: 'open-ddd' })).toBeDefined()
    expect(await ui.find({ key: 'open-eee' })).toBeUndefined()
    await ui.unmount()
  }

  const running = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await running.press({ key: 'open-aaa' })
  expect(ran).toContainEqual(['open', 'claude://claude.ai/epitaxy/local_aaa'])
  await running.unmount()

  // The subagent finishes; the title is not asked for again.
  transcript += `\n${line({
    type: 'user',
    message: { content: [{ type: 'tool_result', tool_use_id: 'toolu_1' }] },
  })}`
  await clock.advance(5_000)
  expect(prompts).toHaveLength(1)

  // Once it writes a file the turn is past reading: the bar moves on.
  transcript += `\n${line({
    type: 'assistant',
    message: { content: [{ type: 'tool_use', name: 'Edit' }] },
  })}`
  await clock.advance(5_000)

  const later = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const marks = (await later.findAll({ type: 'Text' })).map(t => t.text)
  expect(marks.filter(t => t === '✓')).toHaveLength(2)
  expect(marks.filter(t => t === '●')).toHaveLength(2)
  // 70 s into five minutes of building.
  expect(marks).toContain('19%')
  expect(marks).toContain('~5m')
  await later.unmount()

  // The session's model is told about the tool, and reports its steps with it.
  const section = await $.prompt.section({ name: 'doing_tasks', text: 'Base.' })
  expect(section.text).toContain(`Base.\n\n# Reporting progress`)
  expect(section.text).toContain(TOOL)

  const reported = await $.tool.call({
    tool: TOOL,
    goal: '改片尾',
    steps: [
      { title: '讀檔', status: 'completed' },
      { title: '改成淡出', status: 'in_progress' },
      { title: '算圖', status: 'pending' },
      { title: '驗證', status: 'pending' },
    ],
  } as never)
  expect(reported.result).toBe('Progress noted: 1 of 4 steps done.')
  await clock.advance(5_000)

  const planned = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const told = (await planned.findAll({ type: 'Text' })).map(t => t.text)
  // One step done and one under way, of four: the row names the step.
  expect((await planned.find({ key: 'open-aaa' }))?.props.label).toBe('改成淡出')
  expect(told).toContain('38%')
  expect(told.some(t => t?.startsWith('1/4 · ~'))).toBe(true)
  expect(told).toContain('Motion graphics showreel')
  await planned.unmount()

  // A narrow band keeps the title, the percentage and the time; the session
  // name gives way.
  const narrow = await $.ui.mount({
    ...BAND,
    surface: 'terminal',
    props: { hasSurvey: false, bodyColumns: 30 } as never,
  })
  const kept = (await narrow.findAll({ type: 'Text' })).map(t => t.text ?? '')
  expect(kept).toContain('38%')
  expect(kept.some(t => t.startsWith('1/4 · ~'))).toBe(true)
  expect(kept).not.toContain('Motion graphics showreel')
  await narrow.unmount()

  sessions['1.json'] = { ...sessions['1.json'], status: 'idle' }
  sessions['3.json'] = { ...sessions['3.json'], status: 'idle' }
  await clock.advance(5_000)

  const done = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const texts = (await done.findAll({ type: 'Text' })).map(t => t.text)
  expect(texts).toContain('100%')
  expect(texts).not.toContain('●')

  await done.press({ key: 'hide-aaa' })
  await done.unmount()
  // The dismissal is in the store, where the other sessions read it.
  expect(store.hidden).toContain(`aaa:${T0 - 60_000}`)

  const hiddenBand = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await hiddenBand.find({ key: 'open-aaa' })).toBeUndefined()
  await hiddenBand.unmount()
})
