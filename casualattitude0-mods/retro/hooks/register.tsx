import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { RetroDecision, RetroItem, RetroReview } from '../types'

const PANE = 'retro'
const TITLE = '復盤'
const IDLE: RetroReview = { status: 'idle', items: [], note: '' }
const HUMAN = new Set(['composer', 'bridge', 'sdk'])

const ask = atom({ plugin: 'retro', key: 'ask' } as const, null)
const review = atom({ plugin: 'retro', key: 'review' } as const, IDLE)

const JUDGE = `你是分類器。判斷「使用者的新訊息」是不是在糾正、否定或重新指示助理上一則回覆的做法（例如：指出做錯、說不是這個意思、要求改用別的方式、重申先前講過的規則或偏好）。
單純的新任務、追問、補充資料、道謝或同意都不算。只有明確是糾正才回答 YES，其餘一律 NO。只輸出 YES 或 NO。`

const ANALYZE = `[復盤 Mod] 請暫停手上的工作，回顧這段對話到目前為止的內容，不要呼叫任何工具。

找出使用者糾正過你、教過你或表達過偏好，而且「下次還會用到」的地方，提出應該寫進系統的改動，讓使用者以後不用再講一次。目標檔只能是你在這個 session 已知存在的檔案：某個 Skill 的 SKILL.md、專案或使用者層級的 CLAUDE.md / AGENTS.md、或 memory 目錄下的檔案。只對這次任務有效的事不要列。

只輸出一個 JSON 陣列，不要有任何其他文字，最多 6 項，沒有值得寫入的就輸出 []。每項格式：
{"file": "目標檔路徑", "title": "一句話說明這項改動", "why": "對應到對話中的哪一次糾正", "proposed": "要新增或修改的具體文字；若是修改既有內容，寫明原文與改後"}`

const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max)}…` : text

const parseItems = (text: string): RetroItem[] | undefined => {
  const from = text.indexOf('[')
  const to = text.lastIndexOf(']')

  if (from < 0 || to < from) {
    return undefined
  }

  try {
    const rows: unknown = JSON.parse(text.slice(from, to + 1))

    if (!Array.isArray(rows)) {
      return undefined
    }

    return rows.flatMap((row, index) => {
      const { file, title, why, proposed } = (row ?? {}) as Record<string, unknown>

      if (typeof file !== 'string' || typeof proposed !== 'string') {
        return []
      }

      return [
        {
          id: String(index + 1),
          file,
          title: typeof title === 'string' ? title : file,
          why: typeof why === 'string' ? why : '',
          proposed,
          decision: 'pending' as const,
        },
      ]
    })
  } catch {
    return undefined
  }
}

const analyze = async ($: EngineInterface) => {
  await update($, ask, () => null)
  await update($, review, () => ({ ...IDLE, status: 'running' as const }))
  await $.ui.open({ id: PANE, title: TITLE, columns: 72 })

  const reply = await $.model.fork({ prompt: ANALYZE })

  if (!reply.isAnswered) {
    const note =
      reply.reason === 'nothing-to-fork'
        ? '這個對話還沒有可以復盤的內容。'
        : `分析沒有完成（${reply.reason}），可以用 /retro 再試一次。`
    await update($, review, () => ({ ...IDLE, status: 'error' as const, note }))

    return
  }

  const items = parseItems(reply.text)
  await update($, review, () =>
    items === undefined
      ? { status: 'error' as const, items: [], note: clip(reply.text, 4000) }
      : { status: 'ready' as const, items, note: '' },
  )
}

const decide = ($: EngineInterface, id: string, decision: RetroDecision) =>
  update($, review, now => ({
    ...now,
    items: now.items.map(item => (item.id === id ? { ...item, decision } : item)),
  }))

const close = async ($: EngineInterface) => {
  await update($, review, () => IDLE)
  await $.ui.close({ id: PANE })
}

const send = async ($: EngineInterface) => {
  const { items } = await read($, review)
  const chosen = items.filter(item => item.decision === 'apply')

  if (chosen.length === 0) {
    return
  }

  await close($)
  await $.prompt.submit({
    text: [
      '請套用以下復盤改動，每一項我都已在復盤面板逐項核准。先讀目標檔，用最小幅度的修改寫入；檔案不存在或內容已經涵蓋就略過並說明原因。未列出的改動不要做。',
      ...chosen.map(
        (item, index) =>
          `${index + 1}. ${item.file}：${item.title}\n${item.proposed}`,
      ),
    ].join('\n\n'),
  })
}

export const register: Register = on => {
  let prompt = ''
  let previousAnswer = ''
  let judgedTurn = ''

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'retro',
      description: '復盤這段對話，逐項審查要寫回 Skill / CLAUDE.md 的改動',
    })

    return next(e)
  })

  on('command.run', { command: 'retro' }, async $ => {
    await analyze($)

    return { text: '復盤結果在「復盤」面板。' }
  })

  on('prompt.submit', ($, e, next) => {
    prompt = HUMAN.has(e.origin.kind) ? e.text : ''

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)

    if (e.agentId !== undefined) {
      return done
    }

    const corrected = previousAnswer
    const said = prompt
    previousAnswer = e.answer
    prompt = ''

    const isBusy =
      (await read($, ask)) !== null || (await read($, review)).status !== 'idle'

    if (said === '' || corrected === '' || said.startsWith('/') || isBusy || judgedTurn === e.turnId) {
      return done
    }

    judgedTurn = e.turnId
    const verdict = await $.model.complete({
      model: 'haiku',
      system: JUDGE,
      prompt: `助理上一則回覆（節錄）：\n${clip(corrected, 1500)}\n\n使用者的新訊息：\n${clip(said, 1500)}`,
      maxTokens: 8,
      effort: 'low',
      timeoutMs: 8000,
    })

    if (verdict.isAnswered && /^\s*YES/i.test(verdict.text)) {
      await update($, ask, () => ({ turnId: e.turnId }))
    }

    return done
  })

  // The engine's own close mark and Escape skip the pane's buttons; without
  // this the review stays busy and no later correction is offered.
  on('ui.close', { id: PANE }, async ($, e, next) => {
    await update($, review, () => IDLE)

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, ask)) === null) {
      return next(e)
    }

    const { Box, Button, Text } = $.ui.resolve(e)

    return (
      <Box gap={1}>
        <Text>剛剛你好像在糾正 Claude，要復盤這次嗎？</Text>
        <Button key="retro-yes" label="復盤" hotkey="y" variant="primary" onPress={() => analyze($)} />
        <Button key="retro-no" label="不用" hotkey="n" onPress={() => update($, ask, () => null)} />
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Markdown, Text } = $.ui.resolve(e)
    const { status, items, note } = await read($, review)
    const chosen = items.filter(item => item.decision === 'apply').length
    const closing = <Button key="retro-close" label="關閉" role="dismiss" onPress={() => close($)} />

    if (status !== 'ready') {
      return (
        <Box flexDirection="column">
          {status === 'running' && <Text dimColor>正在回顧這段對話…</Text>}
          {status === 'idle' && <Text dimColor>輸入 /retro 開始復盤。</Text>}
          {status === 'error' && <Markdown text={note} />}
          {status !== 'running' && closing}
        </Box>
      )
    }

    if (items.length === 0) {
      return (
        <Box flexDirection="column">
          <Text dimColor>這次沒有值得寫進系統的改動。</Text>
          {closing}
        </Box>
      )
    }

    return (
      <Box flexDirection="column" gap={1}>
        {items.map(item => (
          <Box key={`item-${item.id}`} flexDirection="column">
            <Text bold strikethrough={item.decision === 'skip'}>
              {item.decision === 'apply' ? '✓ ' : ''}
              {item.id}. {item.title}
            </Text>
            <Text dimColor>{item.file}</Text>
            {item.decision !== 'skip' && item.why !== '' && <Text italic>{item.why}</Text>}
            {item.decision !== 'skip' && <Markdown text={clip(item.proposed, 2000)} />}
            <Box gap={1}>
              <Button key={`apply-${item.id}`} label="套用" onPress={() => decide($, item.id, 'apply')} />
              <Button key={`skip-${item.id}`} label="略過" onPress={() => decide($, item.id, 'skip')} />
            </Box>
          </Box>
        ))}
        <Box gap={1}>
          <Button key="retro-send" label={`送出 ${chosen} 項`} variant="primary" onPress={() => send($)} />
          {closing}
        </Box>
      </Box>
    )
  })
}
