import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'retro',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 6,
    bodyColumns: 100,
    scroll: { offset: 0, bodyRows: 0 },
    view: {},
  },
} as const

const PANE = {
  plugin: 'retro',
  component: 'Pane',
  requestId: 'retro',
  props: {
    title: '復盤',
    isFocused: true,
    bodyColumns: 72,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 0 },
    view: {},
  },
} as const

const USAGE = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }

const FOUND = JSON.stringify([
  { file: 'CLAUDE.md', title: '用 pnpm 不用 npm', why: '使用者糾正了安裝指令', proposed: '- 一律使用 pnpm' },
  { file: 'skills/x/SKILL.md', title: '另一項', why: '', proposed: '- 其他' },
])

test('a correction is offered, reviewed item by item, and only approved items are sent', async ($, on) => {
  const sent: string[] = []
  let verdict = 'YES'
  on('model.complete', async () => ({ value: { isAnswered: true as const, text: verdict, usage: USAGE } }))
  on('model.fork', async () => ({
    value: { isAnswered: true as const, text: '```json\n' + FOUND + '\n```', usage: USAGE },
  }))
  on('ui.render', async (engine, e) => {
    const { Text } = engine.ui.resolve(e)

    return <Text> </Text>
  })
  on('ui.open', async () => ({ value: { isPlaced: true as const } }))
  on('ui.close', async () => ({ value: undefined }))
  on('prompt.submit', async (_, e) => {
    sent.push(e.text)

    return { text: e.text }
  })
  on('turn.complete', async (_, e) => ({ text: e.answer }))

  const turn = async (text: string, turnId: string) => {
    await $.prompt.submit({ text, wait: false, origin: { kind: 'composer' } })
    await $.turn.complete({ answer: `answer to ${text}`, durationMs: 1, isAborted: false, turnId, reason: 'answer' })
  }

  for (const surface of ['terminal', 'desktop'] as const) {
    sent.length = 0
    verdict = 'NO'
    await turn('幫我裝套件', `${surface}-1`)
    await turn('再裝一個', `${surface}-2`)
    const quiet = await $.ui.mount({ ...BAND, surface })
    expect(await quiet.find({ key: 'retro-yes' })).toBeUndefined()
    await quiet.unmount()

    verdict = 'YES'
    await turn('不對，我說過要用 pnpm', `${surface}-3`)
    const band = await $.ui.mount({ ...BAND, surface })
    expect(await band.find({ key: 'retro-yes' })).toBeDefined()
    await band.press({ key: 'retro-yes' })
    await band.unmount()

    let pane = await $.ui.mount({ ...PANE, surface })
    expect(await pane.find({ type: 'Text', text: /用 pnpm 不用 npm/ })).toBeDefined()
    await pane.press({ key: 'apply-1' })
    await pane.press({ key: 'skip-2' })
    await pane.press({ key: 'retro-close' })
    await pane.unmount()

    await turn('還是不對，要用 pnpm', `${surface}-4`)
    const again = await $.ui.mount({ ...BAND, surface })
    await again.press({ key: 'retro-yes' })
    await again.unmount()
    pane = await $.ui.mount({ ...PANE, surface })
    await pane.press({ key: 'apply-1' })
    await pane.press({ key: 'retro-send' })
    await pane.unmount()

    const applied = sent.at(-1) ?? ''
    expect(applied).toContain('CLAUDE.md')
    expect(applied).toContain('一律使用 pnpm')
    expect(applied).not.toContain('skills/x/SKILL.md')
  }
})
