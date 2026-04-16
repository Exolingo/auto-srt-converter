import { WhisperSegment, WhisperWord } from './whisperService'

export interface AlignedLine {
  line_index: number
  english: string
  korean: string
  start_sec: number
  end_sec: number
  anchor_count: number
  words: WhisperWord[]
}

export interface AlignmentQuality {
  line_coverage: number
  anchor_ratio: number
  monotonic: boolean
  max_gap_sec: number
  acceptable: boolean
  reason: string
}

export interface AlignmentResult {
  lines: AlignedLine[]
  quality: AlignmentQuality
}

const MIN_LINE_COVERAGE = 0.6
const MIN_ANCHOR_RATIO = 0.3

function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/[^a-z0-9']/g, '').replace(/^'+|'+$/g, '')
}

function cleanLyricLines(raw: string): string[] {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^\[.*\]$/.test(l))
}

function tokenizeLine(line: string): string[] {
  return line.split(/\s+/).map(normalizeToken).filter(Boolean)
}

function longestCommonSubsequence(a: string[], b: string[]): Array<[number, number]> {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  const pairs: Array<[number, number]> = []
  let i = m
  let j = n
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      pairs.push([i - 1, j - 1])
      i--
      j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }
  return pairs.reverse()
}

interface IndexedUserToken {
  token: string
  line_index: number
}

interface IndexedWhisperToken {
  token: string
  word_index: number
}

function flattenUserTokens(userLines: string[]): IndexedUserToken[] {
  const result: IndexedUserToken[] = []
  userLines.forEach((line, lineIdx) => {
    for (const token of tokenizeLine(line)) {
      result.push({ token, line_index: lineIdx })
    }
  })
  return result
}

function flattenWhisperTokens(words: WhisperWord[]): IndexedWhisperToken[] {
  return words
    .map((w, idx) => ({ token: normalizeToken(w.word), word_index: idx }))
    .filter((t) => t.token.length > 0)
}

export function alignLyricsToWhisper(
  englishLyrics: string,
  koreanLyrics: string,
  whisperSegments: WhisperSegment[],
  audioDuration: number,
): AlignmentResult {
  const englishLines = cleanLyricLines(englishLyrics)
  const koreanLines = cleanLyricLines(koreanLyrics)
  const allWords: WhisperWord[] = whisperSegments.flatMap((s) => s.words)

  const userTokens = flattenUserTokens(englishLines)
  const whisperTokens = flattenWhisperTokens(allWords)

  const pairs = longestCommonSubsequence(
    userTokens.map((t) => t.token),
    whisperTokens.map((t) => t.token),
  )

  const lineAnchors: Array<Array<{ word_index: number; start: number; end: number }>> = englishLines.map(() => [])
  for (const [userIdx, whisperIdx] of pairs) {
    const lineIndex = userTokens[userIdx].line_index
    const wordIndex = whisperTokens[whisperIdx].word_index
    const w = allWords[wordIndex]
    if (w) lineAnchors[lineIndex].push({ word_index: wordIndex, start: w.start, end: w.end })
  }

  const preliminary: Array<{ start: number | null; end: number | null; anchors: number }> = lineAnchors.map((arr) => {
    if (arr.length === 0) return { start: null, end: null, anchors: 0 }
    return { start: arr[0].start, end: arr[arr.length - 1].end, anchors: arr.length }
  })

  const filled = interpolateMissing(preliminary, audioDuration)
  const { boundedStart, boundedEnd } = enforceMonotonicAndClamp(filled, audioDuration)

  const lines: AlignedLine[] = englishLines.map((eng, i) => {
    const korean = koreanLines[i] ?? ''
    const start = boundedStart[i]
    const end = boundedEnd[i]
    const wordsForLine = allWords.filter((w) => w.start >= start && w.start < end)
    return {
      line_index: i,
      english: eng,
      korean,
      start_sec: start,
      end_sec: end,
      anchor_count: preliminary[i].anchors,
      words: wordsForLine,
    }
  })

  const quality = computeQuality(preliminary, userTokens.length, pairs.length, lines)

  return { lines, quality }
}

function interpolateMissing(
  preliminary: Array<{ start: number | null; end: number | null; anchors: number }>,
  audioDuration: number,
): Array<{ start: number; end: number }> {
  const n = preliminary.length
  const result: Array<{ start: number; end: number }> = new Array(n)

  const anchored: number[] = []
  preliminary.forEach((p, i) => {
    if (p.start !== null && p.end !== null) anchored.push(i)
  })

  if (anchored.length === 0) {
    const step = audioDuration / Math.max(n, 1)
    for (let i = 0; i < n; i++) {
      result[i] = { start: i * step, end: (i + 1) * step }
    }
    return result
  }

  for (const i of anchored) {
    result[i] = { start: preliminary[i].start as number, end: preliminary[i].end as number }
  }

  for (let i = 0; i < n; i++) {
    if (result[i]) continue
    const prev = findPrevAnchor(anchored, i)
    const next = findNextAnchor(anchored, i)
    if (prev !== -1 && next !== -1) {
      const prevEnd = result[prev].end
      const nextStart = result[next].start
      const gap = nextStart - prevEnd
      const slots = next - prev
      const offset = i - prev
      const span = gap / slots
      const segStart = prevEnd + span * (offset - 1)
      const segEnd = prevEnd + span * offset
      result[i] = { start: Math.max(segStart, prevEnd), end: segEnd }
    } else if (prev !== -1) {
      const prevEnd = result[prev].end
      const remaining = audioDuration - prevEnd
      const slots = n - prev
      const offset = i - prev
      const span = remaining / slots
      result[i] = { start: prevEnd + span * (offset - 1), end: prevEnd + span * offset }
    } else if (next !== -1) {
      const nextStart = result[next].start
      const slots = next + 1
      const offset = i
      const span = nextStart / slots
      result[i] = { start: span * offset, end: span * (offset + 1) }
    }
  }

  return result
}

function findPrevAnchor(anchored: number[], i: number): number {
  let prev = -1
  for (const a of anchored) {
    if (a < i) prev = a
    else break
  }
  return prev
}

function findNextAnchor(anchored: number[], i: number): number {
  for (const a of anchored) {
    if (a > i) return a
  }
  return -1
}

function enforceMonotonicAndClamp(
  filled: Array<{ start: number; end: number }>,
  audioDuration: number,
): { boundedStart: number[]; boundedEnd: number[] } {
  const boundedStart: number[] = []
  const boundedEnd: number[] = []
  let cursor = 0
  for (let i = 0; i < filled.length; i++) {
    const rawStart = Math.max(filled[i].start, cursor)
    const rawEnd = Math.max(filled[i].end, rawStart + 0.1)
    const start = Math.min(rawStart, audioDuration)
    const end = Math.min(rawEnd, audioDuration)
    boundedStart.push(parseFloat(start.toFixed(2)))
    boundedEnd.push(parseFloat(end.toFixed(2)))
    cursor = end
  }
  if (boundedEnd.length > 0) {
    boundedEnd[boundedEnd.length - 1] = audioDuration
  }
  return { boundedStart, boundedEnd }
}

function computeQuality(
  preliminary: Array<{ start: number | null; end: number | null; anchors: number }>,
  totalUserTokens: number,
  matchedTokens: number,
  lines: AlignedLine[],
): AlignmentQuality {
  const anchoredLines = preliminary.filter((p) => p.anchors > 0).length
  const line_coverage = preliminary.length > 0 ? anchoredLines / preliminary.length : 0
  const anchor_ratio = totalUserTokens > 0 ? matchedTokens / totalUserTokens : 0

  let monotonic = true
  let max_gap_sec = 0
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i + 1].start_sec < lines[i].start_sec) monotonic = false
    const gap = lines[i + 1].start_sec - lines[i].end_sec
    if (gap > max_gap_sec) max_gap_sec = gap
  }

  const acceptable = line_coverage >= MIN_LINE_COVERAGE && anchor_ratio >= MIN_ANCHOR_RATIO && monotonic

  const reasons: string[] = []
  if (line_coverage < MIN_LINE_COVERAGE) reasons.push(`줄 커버리지 ${(line_coverage * 100).toFixed(0)}% (기준 ${MIN_LINE_COVERAGE * 100}%)`)
  if (anchor_ratio < MIN_ANCHOR_RATIO) reasons.push(`단어 매칭률 ${(anchor_ratio * 100).toFixed(0)}% (기준 ${MIN_ANCHOR_RATIO * 100}%)`)
  if (!monotonic) reasons.push('타임스탬프 단조 증가 위반')

  return {
    line_coverage,
    anchor_ratio,
    monotonic,
    max_gap_sec,
    acceptable,
    reason: reasons.length ? reasons.join(', ') : '정상',
  }
}
