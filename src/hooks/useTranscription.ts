import { useState } from 'react'
import { Segment, SongOverviewData } from '../types'

export type TranscriptionStatus = 'idle' | 'transcribing' | 'analyzing' | 'done' | 'error'

export function useTranscription() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [songOverview, setSongOverview] = useState<SongOverviewData | null>(null)
  const [status, setStatus] = useState<TranscriptionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const setResults = (newSegments: Segment[], overview: SongOverviewData) => {
    setSegments(newSegments)
    setSongOverview(overview)
    setStatus('done')
  }

  const setTranscribing = () => setStatus('transcribing')
  const setAnalyzing = () => setStatus('analyzing')

  const setError = (message: string) => {
    setErrorMessage(message)
    setStatus('error')
  }

  const updateKorean = (id: number, value: string) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, korean: value } : s)))
  }

  const updateEnglish = (id: number, value: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, english: value, isTranslating: false } : s))
    )
  }

  const setSegmentTranslating = (id: number, isTranslating: boolean) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, isTranslating } : s)))
  }

  const deleteSegment = (id: number) => {
    setSegments((prev) => prev.filter((s) => s.id !== id))
  }

  const splitSegment = (
    segmentId: number,
    korFirst: string, korSecond: string,
    engFirst: string, engSecond: string,
    splitTime: number,
  ): number => {
    const newId = Math.max(0, ...segments.map((s) => s.id)) + 1
    setSegments((prev) => {
      const index = prev.findIndex((s) => s.id === segmentId)
      if (index === -1) return prev
      const original = prev[index]
      const first: Segment = { ...original, end_sec: splitTime, korean: korFirst, english: engFirst, words: original.words.filter((w) => w.start < splitTime), isTranslating: false }
      const second: Segment = { ...original, id: newId, start_sec: splitTime, korean: korSecond, english: engSecond, words: original.words.filter((w) => w.start >= splitTime), isTranslating: false }
      return [...prev.slice(0, index), first, second, ...prev.slice(index + 1)]
    })
    return newId
  }

  const mergeSegments = (targetId: number, sourceId: number) => {
    setSegments((prev) => {
      const target = prev.find((s) => s.id === targetId)
      const source = prev.find((s) => s.id === sourceId)
      if (!target || !source) return prev

      const [first, second] =
        target.start_sec <= source.start_sec ? [target, source] : [source, target]

      const merged: Segment = {
        ...first,
        end_sec: second.end_sec,
        korean: first.korean + ' ' + second.korean,
        english: first.english + ' ' + second.english,
        instruments: [...new Set([...first.instruments, ...second.instruments])],
        words: [...first.words, ...second.words],
        isTranslating: false,
      }

      return prev.filter((s) => s.id !== second.id).map((s) => (s.id === first.id ? merged : s))
    })
  }

  const reset = () => {
    setSegments([])
    setSongOverview(null)
    setStatus('idle')
    setErrorMessage('')
  }

  return {
    segments,
    songOverview,
    status,
    errorMessage,
    setTranscribing,
    setAnalyzing,
    setResults,
    setError,
    updateKorean,
    updateEnglish,
    setSegmentTranslating,
    deleteSegment,
    splitSegment,
    mergeSegments,
    reset,
  }
}
