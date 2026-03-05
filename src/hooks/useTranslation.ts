import { Segment } from '../types'
import {
  fileToBase64,
  analyzeComprehensive,
  mapToSegments,
  mapToSongOverview,
  translateSingle,
} from '../services/geminiService'
import { transcribeAudio } from '../services/whisperService'
import { SongOverviewData } from '../types'

interface UseAnalysisDeps {
  segments: Segment[]
  setTranscribing: () => void
  setAnalyzing: () => void
  setResults: (segments: Segment[], overview: SongOverviewData) => void
  setError: (message: string) => void
  setSegmentTranslating: (id: number, value: boolean) => void
  updateEnglish: (id: number, value: string) => void
}

export function useTranslation({
  segments,
  setTranscribing,
  setAnalyzing,
  setResults,
  setError,
  setSegmentTranslating,
  updateEnglish,
}: UseAnalysisDeps) {

  /**
   * 전체 분석 실행:
   * Whisper(타임스탬프) → Gemini(오디오+가사 종합 분석)
   */
  const analyzeAll = async (audioFile: File, userLyrics: string) => {
    try {
      setTranscribing()
      const whisperSegments = await transcribeAudio(audioFile)

      setAnalyzing()
      const base64Audio = await fileToBase64(audioFile)
      const mimeType = audioFile.type || 'audio/mpeg'
      const result = await analyzeComprehensive(
        base64Audio,
        mimeType,
        whisperSegments,
        userLyrics || undefined
      )

      setResults(mapToSegments(result), mapToSongOverview(result))
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '분석에 실패했습니다.'
      setError(message)
    }
  }

  /**
   * 개별 세그먼트 영어 재번역 (한국어 수정 후)
   */
  const retranslateSegment = async (id: number, koreanText: string) => {
    setSegmentTranslating(id, true)
    try {
      const index = segments.findIndex((s) => s.id === id)
      const context = {
        prev: index > 0 ? segments[index - 1].korean : undefined,
        next: index < segments.length - 1 ? segments[index + 1].korean : undefined,
      }
      const english = await translateSingle(koreanText, context)
      updateEnglish(id, english)
      setSegmentTranslating(id, false)
    } catch {
      setSegmentTranslating(id, false)
    }
  }

  return { analyzeAll, retranslateSegment }
}
