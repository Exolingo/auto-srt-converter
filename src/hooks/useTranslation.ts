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
import { sanitizePopSongTimings } from '../utils/segmentSanitizer'
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
   * 팝송 모드: Whisper(타이밍 앵커) + Gemini(가사 매핑 + 곡 분석)
   * Whisper word-level 타임스탬프를 Gemini에 전달하여 hallucination 방지
   */
  const analyzePopSong = async (audioFile: File, englishLyrics: string, koreanLyrics: string) => {
    try {
      // 1단계: Whisper 영어 음성인식 → 타이밍 앵커 확보 (가사 힌트로 인식률 향상)
      setTranscribing()
      const cleanLyricsHint = englishLyrics
        .split('\n').map((l) => l.trim()).filter((l) => l && !/^\[.*\]$/.test(l)).join('\n')
      const [whisperSegments, audioDuration] = await Promise.all([
        transcribeAudio(audioFile, 'en', cleanLyricsHint),
        getAudioDuration(audioFile),
      ])

      // 2단계: Gemini 종합 분석 (Whisper 타임스탬프 참고)
      setAnalyzing()
      const base64Audio = await fileToBase64(audioFile)
      const mimeType = audioFile.type || 'audio/mpeg'
      const allWords = whisperSegments.flatMap((s) => s.words)

      const { overview, segments: rawSegments } = await analyzePopSongComprehensive(
        base64Audio, mimeType, englishLyrics, koreanLyrics, audioDuration, whisperSegments,
      )

      // Gemini 타임스탬프 drift 경고 (clamp + sanitizer로 보정하므로 hard error 제거)
      const lastEnd = rawSegments[rawSegments.length - 1]?.end_sec ?? 0
      const driftRatio = Math.abs(lastEnd - audioDuration) / audioDuration
      if (driftRatio > 0.1) {
        console.warn(
          `[analyzePopSong] Gemini 타임스탬프 drift ${(driftRatio * 100).toFixed(0)}%` +
          ` (곡: ${Math.round(audioDuration)}초, Gemini: ${Math.round(lastEnd)}초) → clamp + sanitizer로 보정`,
        )
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

      // 이상치 감지 및 보정 (비정상적으로 긴 세그먼트/갭 → 텍스트 비율 재분배)
      const sanitizedSegments = sanitizePopSongTimings(clampedSegments, audioDuration)

      // Whisper word-level 데이터를 세그먼트에 매핑 (split 시 정확한 타이밍 제공)
      const segmentsWithWords = sanitizedSegments.map((seg) => ({
        ...seg,
        words: allWords.filter((w) => w.start >= seg.start_sec && w.start < seg.end_sec),
      }))

      setResults(segmentsWithWords, overview)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '분석에 실패했습니다.'
      setError(message)
    }
  }

  return { analyzeAll, analyzePopSong, retranslateSegment }
}
