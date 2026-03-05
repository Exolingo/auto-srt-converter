import { useState } from 'react'
import { WhisperSegment } from '../services/whisperService'
import {
  SegmentAnalysis,
  fileToBase64,
  firstPassTranscribe,
  reconcileAndAnalyze,
  reanalyzeSingle,
  translateSingle,
} from '../services/geminiService'

export type AnalysisStep = 'idle' | 'gemini_first' | 'reconciling'

interface UseTranslationDeps {
  setSegmentTranslating: (id: number, value: boolean) => void
  applyFullAnalysis: (results: SegmentAnalysis[]) => void
  updateSegmentAnalysis: (
    id: number,
    analysis: Partial<Pick<SegmentAnalysis, 'korean' | 'english' | 'emotion' | 'confidence'>>
  ) => void
  updateEnglish: (id: number, value: string) => void
}

export function useTranslation({
  setSegmentTranslating,
  applyFullAnalysis,
  updateSegmentAnalysis,
  updateEnglish,
}: UseTranslationDeps) {
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('idle')
  const [analysisError, setAnalysisError] = useState('')

  /**
   * 3단계 팀 분석:
   * Whisper 결과 → Gemini 1차 독립 인식 → Gemini 2차 교차 검증
   */
  const analyzeAll = async (audioFile: File, whisperSegments: WhisperSegment[]) => {
    setAnalysisError('')
    try {
      // 오디오를 base64로 한 번만 변환하여 재사용
      const base64Audio = await fileToBase64(audioFile)
      const mimeType = audioFile.type || 'audio/mpeg'

      // 2단계: Gemini 1차 독립 인식 (Whisper 결과 미참조)
      setAnalysisStep('gemini_first')
      const geminiFirstPass = await firstPassTranscribe(base64Audio, mimeType, whisperSegments)

      // 3단계: 두 AI 결과 교차 검증 후 최종 확정
      setAnalysisStep('reconciling')
      const finalResults = await reconcileAndAnalyze(
        base64Audio,
        mimeType,
        whisperSegments,
        geminiFirstPass
      )

      applyFullAnalysis(finalResults)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '분석에 실패했습니다.'
      setAnalysisError(message)
    } finally {
      setAnalysisStep('idle')
    }
  }

  /**
   * 개별 세그먼트 재분석: 한국어 교정 + 번역 + 감정 + 신뢰도 (텍스트 기반)
   */
  const reanalyzeSegment = async (id: number, koreanText: string) => {
    setSegmentTranslating(id, true)
    try {
      const result = await reanalyzeSingle(koreanText)
      updateSegmentAnalysis(id, {
        korean: result.korean,
        english: result.english,
        emotion: result.emotion,
        confidence: result.confidence,
      })
    } catch {
      setSegmentTranslating(id, false)
    }
  }

  /**
   * 개별 세그먼트 영어 번역만 재실행 (한국어 직접 수정 후)
   */
  const retranslateSegment = async (id: number, koreanText: string) => {
    setSegmentTranslating(id, true)
    try {
      const english = await translateSingle(koreanText)
      updateEnglish(id, english)
      setSegmentTranslating(id, false)
    } catch {
      setSegmentTranslating(id, false)
    }
  }

  return {
    analysisStep,
    analysisError,
    analyzeAll,
    reanalyzeSegment,
    retranslateSegment,
  }
}
