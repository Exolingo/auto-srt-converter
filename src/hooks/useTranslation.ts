import { Segment } from '../types'
import {
  fileToBase64,
  analyzeComprehensive,
  analyzePopSongComprehensive,
  mapToSegments,
  mapToSongOverview,
  translateSingle,
} from '../services/geminiService'
import { transcribeAudio, getAudioDuration, WhisperSegment } from '../services/whisperService'
import { alignLyricsToWhisper } from '../services/lyricsAlignmentService'
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

const LCS_OVERRIDE_THRESHOLD_SEC = 3

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
   * 한국어 모드: Whisper(타임스탬프) → Gemini(오디오+가사 종합 분석)
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
   * 팝송 모드 하이브리드:
   * 1. Whisper word-level 인식 (가사 힌트)
   * 2. Gemini가 오디오 들으며 매핑 + 곡 분석 (word 타임스탬프 제공)
   * 3. LCS 정렬로 Gemini 드리프트 교정 — 앵커와 3초 이상 차이나면 LCS 타임스탬프로 덮어쓰기
   */
  const analyzePopSong = async (audioFile: File, englishLyrics: string, koreanLyrics: string) => {
    try {
      setTranscribing()
      const cleanLyricsHint = englishLyrics
        .split('\n').map((l) => l.trim()).filter((l) => l && !/^\[.*\]$/.test(l)).join('\n')

      const [whisperSegments, audioDuration] = await Promise.all([
        transcribeAudio(audioFile, 'en', cleanLyricsHint),
        getAudioDuration(audioFile),
      ])

      setAnalyzing()
      const base64Audio = await fileToBase64(audioFile)
      const mimeType = audioFile.type || 'audio/mpeg'

      const { overview, segments: geminiSegments } = await analyzePopSongComprehensive(
        base64Audio, mimeType, englishLyrics, koreanLyrics, audioDuration, whisperSegments,
      )

      const corrected = correctDriftWithLcs(
        geminiSegments,
        englishLyrics,
        koreanLyrics,
        whisperSegments,
        audioDuration,
      )

      setResults(corrected, overview)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '분석에 실패했습니다.'
      setError(message)
    }
  }

  return { analyzeAll, analyzePopSong, retranslateSegment }
}

function correctDriftWithLcs(
  geminiSegments: Segment[],
  englishLyrics: string,
  koreanLyrics: string,
  whisperSegments: WhisperSegment[],
  audioDuration: number,
): Segment[] {
  const alignment = alignLyricsToWhisper(englishLyrics, koreanLyrics, whisperSegments, audioDuration)

  const corrected = geminiSegments.map((seg, i) => {
    const lcsLine = alignment.lines[i]
    if (!lcsLine || lcsLine.anchor_count === 0) return seg
    const drift = Math.abs(seg.start_sec - lcsLine.start_sec)
    if (drift < LCS_OVERRIDE_THRESHOLD_SEC) return seg
    console.info(
      `[analyzePopSong] drift ${drift.toFixed(1)}s 감지 — 세그먼트 #${i + 1} Gemini ${seg.start_sec.toFixed(1)}s → LCS ${lcsLine.start_sec.toFixed(1)}s로 교정`,
    )
    return { ...seg, start_sec: lcsLine.start_sec, end_sec: Math.max(lcsLine.end_sec, seg.end_sec) }
  })

  for (let i = 0; i < corrected.length - 1; i++) {
    if (corrected[i].end_sec > corrected[i + 1].start_sec) {
      corrected[i] = { ...corrected[i], end_sec: corrected[i + 1].start_sec }
    }
  }

  return corrected
}
