import { useState } from 'react'
import { Segment, SegmentWord } from '../types'
import { translateSplitPair } from '../services/geminiService'

export interface PendingSplit {
  segmentId: number
  korFirst: string
  korSecond: string
  engFirst: string
  engSecond: string
  splitTime: number
  isTranslating: boolean
}

/**
 * 커서 비율로 word-level 타임스탬프에서 정확한 split 시점을 찾는다.
 * - words 2개 이상: 비율에 해당하는 단어의 start 사용
 * - words 1개: 단어 내 글자 비율로 duration 보간 (sub-word interpolation)
 * - words 없음: 세그먼트 전체 ratio fallback
 */
function findSplitTime(words: SegmentWord[], ratio: number, start_sec: number, end_sec: number): number {
  if (words.length >= 2) {
    const wordIdx = Math.max(1, Math.min(Math.round(ratio * words.length), words.length - 1))
    return words[wordIdx].start
  }
  if (words.length === 1) {
    const w = words[0]
    return w.start + ratio * (w.end - w.start)
  }
  return start_sec + (end_sec - start_sec) * ratio
}

export function useSplitPreview() {
  const [pendingSplit, setPendingSplit] = useState<PendingSplit | null>(null)

  const triggerSplit = async (segment: Segment, cursorPos: number) => {
    const { korean, start_sec, end_sec, words } = segment
    if (cursorPos <= 0 || cursorPos >= korean.length) return

    const korFirst = korean.slice(0, cursorPos).trim()
    const korSecond = korean.slice(cursorPos).trim()
    if (!korFirst || !korSecond) return

    const ratio = cursorPos / korean.length
    const splitTime = findSplitTime(words, ratio, start_sec, end_sec)

    // 미리보기 즉시 표시 (번역 로딩 상태)
    setPendingSplit({ segmentId: segment.id, korFirst, korSecond, engFirst: '', engSecond: '', splitTime, isTranslating: true })

    // 두 구간을 함께 번역 — 각각 자연스럽고 합쳤을 때도 자연스러운 영어 보장
    const [engFirst, engSecond] = await translateSplitPair(korFirst, korSecond)

    setPendingSplit((prev) =>
      prev?.segmentId === segment.id
        ? { ...prev, engFirst, engSecond, isTranslating: false }
        : prev
    )
  }

  const cancelSplit = () => setPendingSplit(null)

  return { pendingSplit, triggerSplit, cancelSplit }
}
