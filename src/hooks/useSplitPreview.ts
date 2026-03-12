import { useState, useRef } from 'react'
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

export function useSplitPreview(updateEnglish: (id: number, value: string) => void) {
  const [pendingSplit, setPendingSplit] = useState<PendingSplit | null>(null)
  // 번역 완료 전에 confirm한 split들을 추적 (segmentId → {firstId, secondId})
  const postConfirmMap = useRef<Map<number, PostConfirmInfo>>(new Map())

  const triggerSplit = async (segment: Segment, cursorPos: number) => {
    const { korean, start_sec, end_sec, words, id: segmentId } = segment
    if (cursorPos <= 0 || cursorPos >= korean.length) return

    const korFirst = korean.slice(0, cursorPos).trim()
    const korSecond = korean.slice(cursorPos).trim()
    if (!korFirst || !korSecond) return

    const ratio = cursorPos / korean.length
    const splitTime = findSplitTime(words, ratio, start_sec, end_sec)

    // 미리보기 즉시 표시 (번역 로딩 상태)
    setPendingSplit({ segmentId, korFirst, korSecond, engFirst: '', engSecond: '', splitTime, isTranslating: true })

    const [engFirst, engSecond] = await translateSplitPair(korFirst, korSecond)

    // 번역 완료 전에 이미 confirm된 경우: 직접 영어 업데이트 후 종료
    const confirmed = postConfirmMap.current.get(segmentId)
    if (confirmed) {
      updateEnglish(confirmed.firstId, engFirst)
      updateEnglish(confirmed.secondId, engSecond)
      postConfirmMap.current.delete(segmentId)
      return
    }

    // 아직 미리보기 중: 번역 결과를 preview에 반영
    setPendingSplit((prev) =>
      prev?.segmentId === segmentId
        ? { ...prev, engFirst, engSecond, isTranslating: false }
        : prev
    )
  }

  /**
   * 번역 진행 중에 사용자가 confirm한 경우:
   * 즉시 split(영어 빈칸)이 실행된 후 호출되며, 번역 완료 시 자동으로 영어를 채운다.
   */
  const registerPostConfirm = (originalSegmentId: number, firstId: number, secondId: number) => {
    postConfirmMap.current.set(originalSegmentId, { firstId, secondId })
    setPendingSplit(null)
  }

  const cancelSplit = () => setPendingSplit(null)

  return { pendingSplit, triggerSplit, registerPostConfirm, cancelSplit }
}
