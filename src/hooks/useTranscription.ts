import { useState } from 'react'
import { Segment } from '../types'
import { transcribeAudio } from '../services/whisperService'
import { SegmentAnalysis } from '../services/geminiService'

export type TranscriptionStatus = 'idle' | 'transcribing' | 'done' | 'error'

export function useTranscription() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [status, setStatus] = useState<TranscriptionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const transcribe = async (file: File) => {
    setStatus('transcribing')
    setErrorMessage('')
    try {
      const whisperSegments = await transcribeAudio(file)
      const mapped: Segment[] = whisperSegments.map((s) => ({
        id: s.id,
        start: s.start,
        end: s.end,
        korean: s.text,
        english: '',
        emotion: '',
        confidence: '',
        isTranslating: false,
      }))
      setSegments(mapped)
      setStatus('done')
      return whisperSegments
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '알 수 없는 오류'
      setErrorMessage(message)
      setStatus('error')
      return null
    }
  }

  const applyFullAnalysis = (results: SegmentAnalysis[]) => {
    const resultMap = new Map(results.map((r) => [r.id, r]))
    setSegments((prev) =>
      prev.map((s) => {
        const a = resultMap.get(s.id)
        if (!a) return s
        return { ...s, korean: a.korean, english: a.english, emotion: a.emotion, confidence: a.confidence }
      })
    )
  }

  const updateKorean = (id: number, value: string) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, korean: value } : s)))
  }

  const updateEnglish = (id: number, value: string) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, english: value, isTranslating: false } : s)))
  }

  const updateSegmentAnalysis = (
    id: number,
    analysis: Partial<Pick<SegmentAnalysis, 'korean' | 'english' | 'emotion' | 'confidence'>>
  ) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...analysis, isTranslating: false } : s))
    )
  }

  const setSegmentTranslating = (id: number, isTranslating: boolean) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, isTranslating } : s)))
  }

  return {
    segments,
    status,
    errorMessage,
    transcribe,
    applyFullAnalysis,
    updateKorean,
    updateEnglish,
    updateSegmentAnalysis,
    setSegmentTranslating,
  }
}
