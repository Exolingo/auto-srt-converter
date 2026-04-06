import { Segment, SegmentWord } from '../types'
import { WhisperSegment } from './whisperService'

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
}

function wordJaccard(a: string, b: string): number {
  const wordsA = normalize(a).split(/\s+/).filter(Boolean)
  const wordsB = normalize(b).split(/\s+/).filter(Boolean)
  if (wordsA.length === 0 && wordsB.length === 0) return 1
  if (wordsA.length === 0 || wordsB.length === 0) return 0

  const setA = new Set(wordsA)
  const setB = new Set(wordsB)
  const intersection = [...setA].filter((w) => setB.has(w)).length
  return intersection / (setA.size + setB.size - intersection)
}

/**
 * Whisper 세그먼트와 사용자 영어 가사를 순서 기반 + 유사도로 매칭한다.
 * 순서가 보장되므로 greedy forward matching 사용.
 */
export function matchLyricsToSegments(
  whisperSegments: WhisperSegment[],
  englishLyrics: string,
  koreanLyrics: string,
): Segment[] {
  const engLines = englishLyrics.split('\n').map((l) => l.trim()).filter(Boolean)
  const korLines = koreanLyrics.split('\n').map((l) => l.trim()).filter(Boolean)

  const allWords: SegmentWord[] = whisperSegments.flatMap((s) =>
    s.words.map((w) => ({ word: w.word, start: w.start * 1000, end: w.end * 1000 }))
  )

  // 순서 기반 greedy matching: 각 Whisper 세그먼트를 순서대로 engLines에 매칭
  let engIdx = 0
  const matched: Array<{
    whisper: WhisperSegment
    engLine: string
    korLine: string
    engLineIdx: number
  }> = []

  for (const ws of whisperSegments) {
    if (engIdx >= engLines.length) break

    const score = wordJaccard(ws.text, engLines[engIdx])
    if (score >= 0.2) {
      matched.push({
        whisper: ws,
        engLine: engLines[engIdx],
        korLine: korLines[engIdx] ?? '',
        engLineIdx: engIdx,
      })
      engIdx++
    } else {
      // 낮은 유사도 — 다음 engLine도 시도
      if (engIdx + 1 < engLines.length) {
        const nextScore = wordJaccard(ws.text, engLines[engIdx + 1])
        if (nextScore >= 0.2) {
          // 현재 engLine은 건너뛰고 다음과 매칭
          engIdx++
          matched.push({
            whisper: ws,
            engLine: engLines[engIdx],
            korLine: korLines[engIdx] ?? '',
            engLineIdx: engIdx,
          })
          engIdx++
          continue
        }
      }
      // 간주/허밍 구간으로 간주하여 스킵
    }
  }

  return matched.map((m, i) => {
    const segWords = m.whisper.words.map((w) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    }))

    return {
      id: i,
      start_sec: m.whisper.start,
      end_sec: m.whisper.end,
      korean: m.korLine,
      english: m.engLine,
      emotion: '',
      energy: '' as const,
      vocal_gender: '' as const,
      notes: '',
      instruments: [],
      words: segWords,
      isTranslating: false,
    }
  })
}

