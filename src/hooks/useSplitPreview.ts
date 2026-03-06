import { useState } from 'react'
import { Segment } from '../types'

export interface PendingSplit {
  segmentId: number
  korFirst: string
  korSecond: string
  engFirst: string
  engSecond: string
  splitTime: number
}

function splitEnglishByRatio(english: string, ratio: number): [string, string] {
  const words = english.trim().split(/\s+/).filter(Boolean)
  if (words.length < 2) return [english, '']
  const splitIdx = Math.max(1, Math.round(words.length * ratio))
  return [words.slice(0, splitIdx).join(' '), words.slice(splitIdx).join(' ')]
}

export function useSplitPreview() {
  const [pendingSplit, setPendingSplit] = useState<PendingSplit | null>(null)

  const triggerSplit = (segment: Segment, cursorPos: number) => {
    const { korean, english, start_sec, end_sec } = segment
    if (cursorPos <= 0 || cursorPos >= korean.length) return

    const korFirst = korean.slice(0, cursorPos).trim()
    const korSecond = korean.slice(cursorPos).trim()
    if (!korFirst || !korSecond) return

    const ratio = cursorPos / korean.length
    const splitTime = start_sec + (end_sec - start_sec) * ratio
    const [engFirst, engSecond] = splitEnglishByRatio(english, ratio)

    setPendingSplit({ segmentId: segment.id, korFirst, korSecond, engFirst, engSecond, splitTime })
  }

  const cancelSplit = () => setPendingSplit(null)

  return { pendingSplit, triggerSplit, cancelSplit }
}
