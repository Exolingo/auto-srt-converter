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
    reset,
  }
}
