import { useState, useRef } from 'react'
import { Segment, SegmentWord, AppMode } from '../types'
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

interface PostConfirmInfo {
  firstId: number
  secondId: number
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

/**
 * 한국어 텍스트를 비율 기반으로 자연스러운 위치에서 분리한다.
 * 공백 기준으로 가장 가까운 위치를 찾아 snap한다.
 */
function findKoreanSplitPos(korean: string, ratio: number): number {
  const target = Math.round(ratio * korean.length)
  if (target <= 0) return 1
  if (target >= korean.length) return korean.length - 1

  // 근처 공백 탐색 (±10자)
  let bestPos = target
  let bestDist = Infinity
  for (let offset = 0; offset <= 10; offset++) {
    for (const pos of [target + offset, target - offset]) {
      if (pos > 0 && pos < korean.length && korean[pos] === ' ' && Math.abs(pos - target) < bestDist) {
        bestPos = pos
        bestDist = Math.abs(pos - target)
      }
    }
  }
  return bestPos
}

export function useSplitPreview(updateEnglish: (id: number, value: string) => void, mode: AppMode) {
  const [pendingSplit, setPendingSplit] = useState<PendingSplit | null>(null)
  const postConfirmMap = useRef<Map<number, PostConfirmInfo>>(new Map())

  /**
   * 한국어 모드: 한국어 커서 위치 기반 split → Gemini 번역
   */
  const triggerSplitKorean = async (segment: Segment, cursorPos: number) => {
    const { korean, start_sec, end_sec, words, id: segmentId } = segment
    if (cursorPos <= 0 || cursorPos >= korean.length) return

    const korFirst = korean.slice(0, cursorPos).trim()
    const korSecond = korean.slice(cursorPos).trim()
    if (!korFirst || !korSecond) return

    const ratio = cursorPos / korean.length
    const splitTime = findSplitTime(words, ratio, start_sec, end_sec)

    setPendingSplit({ segmentId, korFirst, korSecond, engFirst: '', engSecond: '', splitTime, isTranslating: true })

    const [engFirst, engSecond] = await translateSplitPair(korFirst, korSecond)

    const confirmed = postConfirmMap.current.get(segmentId)
    if (confirmed) {
      updateEnglish(confirmed.firstId, engFirst)
      updateEnglish(confirmed.secondId, engSecond)
      postConfirmMap.current.delete(segmentId)
      return
    }

    setPendingSplit((prev) =>
      prev?.segmentId === segmentId
        ? { ...prev, engFirst, engSecond, isTranslating: false }
        : prev
    )
  }

  /**
   * 팝송 모드: 영어 커서 위치 기반 split → 한국어는 비율로 자동 분리
   */
  const triggerSplitPopSong = (segment: Segment, cursorPos: number) => {
    const { english, korean, start_sec, end_sec, words, id: segmentId } = segment
    if (cursorPos <= 0 || cursorPos >= english.length) return

    const engFirst = english.slice(0, cursorPos).trim()
    const engSecond = english.slice(cursorPos).trim()
    if (!engFirst || !engSecond) return

    const ratio = cursorPos / english.length
    const splitTime = findSplitTime(words, ratio, start_sec, end_sec)

    const korSplitPos = findKoreanSplitPos(korean, ratio)
    const korFirst = korean.slice(0, korSplitPos).trim()
    const korSecond = korean.slice(korSplitPos).trim()

    setPendingSplit({
      segmentId,
      korFirst,
      korSecond,
      engFirst,
      engSecond,
      splitTime,
      isTranslating: false,
    })
  }

  const triggerSplit = (segment: Segment, cursorPos: number) => {
    if (mode === 'popsong') {
      triggerSplitPopSong(segment, cursorPos)
    } else {
      triggerSplitKorean(segment, cursorPos)
    }
  }

  const registerPostConfirm = (originalSegmentId: number, firstId: number, secondId: number) => {
    postConfirmMap.current.set(originalSegmentId, { firstId, secondId })
    setPendingSplit(null)
  }

  const cancelSplit = () => setPendingSplit(null)

  return { pendingSplit, triggerSplit, registerPostConfirm, cancelSplit }
}
