import { Segment } from '../types'
import {
  fileToBase64,
  analyzeComprehensive,
  analyzePopSongComprehensive,
  mapToSegments,
  mapToSongOverview,
  translateSingle,
} from '../services/geminiService'
import { transcribeAudio, getAudioDuration } from '../services/whisperService'
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

      const allWords = whisperSegments.flatMap((s) => s.words)
      setResults(mapToSegments(result, allWords), mapToSongOverview(result))
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

  /**
   * 팝송 모드: Gemini 단독 — 오디오 + 가사 → 타임스탬프 매핑 + 곡 분석
   * 실제 오디오 길이로 타임스탬프를 clamp하여 Gemini hallucination 보정
   */
  const analyzePopSong = async (audioFile: File, englishLyrics: string, koreanLyrics: string) => {
    try {
      setAnalyzing()
      const [base64Audio, audioDuration] = await Promise.all([
        fileToBase64(audioFile),
        getAudioDuration(audioFile),
      ])
      const mimeType = audioFile.type || 'audio/mpeg'
      const { overview, segments: rawSegments } = await analyzePopSongComprehensive(
        base64Audio, mimeType, englishLyrics, koreanLyrics, audioDuration,
      )

      // 타임스탬프 신뢰도 검증: 마지막 세그먼트 end와 실제 곡 길이 비교
      const lastEnd = rawSegments[rawSegments.length - 1]?.end_sec ?? 0
      const drift = Math.abs(lastEnd - audioDuration)
      const driftRatio = drift / audioDuration

      if (driftRatio > 0.3) {
        // 30% 이상 차이나면 Gemini hallucination으로 판단
        setError(
          `타임스탬프 오류가 감지되었습니다. ` +
          `(곡 길이: ${Math.round(audioDuration)}초, 분석 결과: ${Math.round(lastEnd)}초) ` +
          `다시 분석을 시도해 주세요.`
        )
        return
      }

      // Gemini 타임스탬프를 실제 오디오 길이 내로 clamp
      const clampedSegments = rawSegments.map((seg) => ({
        ...seg,
        start_sec: Math.min(seg.start_sec, audioDuration),
        end_sec: Math.min(seg.end_sec, audioDuration),
      }))
      if (clampedSegments.length > 0) {
        clampedSegments[clampedSegments.length - 1].end_sec = audioDuration
      }

      setResults(clampedSegments, overview)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '분석에 실패했습니다.'
      setError(message)
    }
  }

  return { analyzeAll, analyzePopSong, retranslateSegment }
}
