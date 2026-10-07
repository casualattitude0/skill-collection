import { expect, mock, test } from 'claude-code/testing'

const CONTEXT = { windowTokens: 200_000 }

test('shows session remaining and the cost of the current turn', async ($, on) => {
  on('session.measure', (_, e) => ({ changed: e.changed }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('ui.render', (engine, e) => {
    const { Box } = engine.ui.resolve(e)

    return Box({}) as never
  })
  mock.clock(on, { now: Date.parse('2026-10-08T10:00:00Z') })

  const measure = (percentUsed: number, usd: number) =>
    $.session.measure({
      context: CONTEXT as never,
      rateLimits: [
        { kind: 'seven_day', percentUsed: 50, resetsAt: '2026-10-11T14:30:00Z' },
        { kind: 'five_hour', percentUsed, resetsAt: '2026-10-08T12:13:00Z' },
      ],
      cost: { usd },
      changed: ['rateLimits', 'cost'],
    })

  await measure(20, 1)
  await $.prompt.submit({ text: 'hi' } as never)
  const started = await $.ui.mount({
    plugin: 'usage-bar',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false } as never,
  })
  expect((await started.find({ type: 'Text', text: /本次對話/ }))?.text).toBe('本次對話 $0.000')
  await started.unmount()
  await measure(23, 1.25)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({
      plugin: 'usage-bar',
      surface,
      component: 'AbovePrompt',
      props: { hasSurvey: false } as never,
    })
    const texts = await ui.findAll({ type: 'Text' })
    const blocks = texts.filter(t => t.props.color === '#D97757').map(t => t.text)
    const figures = texts.filter(t => t.props.color === '#FFFFFF').map(t => t.text)

    expect(figures).toEqual(['77%', '2h13m', '50%', '3d4h', '$1.25', '$0.250'])

    expect(blocks).toEqual([
      'Session 剩餘 77% (2h13m 後重置)',
      'Weekly 剩餘 50% (3d4h 後重置)',
      'Session 總計 $1.25',
      '本次對話 $0.250',
    ])
    await ui.unmount()
  }

  // Less room, shorter wording: still one row of four blocks.
  for (const [bodyColumns, wording] of [
    [70, ['Session 77% · 2h13m', 'Weekly 50% · 3d4h', '總計 $1.25', '本次 $0.250']],
    [40, ['S 77%', 'W 50%', '總計 $1.25', '本次 $0.250']],
  ] as const) {
    const ui = await $.ui.mount({
      plugin: 'usage-bar',
      surface: 'desktop',
      component: 'AbovePrompt',
      props: { hasSurvey: false, bodyColumns } as never,
    })
    const texts = await ui.findAll({ type: 'Text' })

    expect(
      texts.filter(t => t.props.color === '#D97757').map(t => t.text),
    ).toEqual([...wording])
    await ui.unmount()
  }
})
