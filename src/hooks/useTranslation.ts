import { Segment } from '../types'
import {
  fileToBase64,
  analyzeComprehensive,
  analyzePopSongMusic,
  mapToSegments,
  mapToSongOverview,
  translateSingle,
} from '../services/geminiService'
import { transcribeAudio, getAudioDuration } from '../services/whisperService'
import { alignLyricsToWhisper } from '../services/lyricsAlignmentService'
import { SongOverviewData } from '../types'

interface UseAnalysisDeps {
  segments: Segment[]
  setTranscribing: () => void
  setVerifying: () => void
  setRetrying: (attempt: number) => void
  setAnalyzing: () => void
  setResults: (segments: Segment[], overview: SongOverviewData) => void
  setError: (message: string) => void
  setSegmentTranslating: (id: number, value: boolean) => void
  updateEnglish: (id: number, value: string) => void
}

const MAX_WHISPER_ATTEMPTS = 2

export function useTranslation({
  segments,
  setTranscribing,
  setVerifying,
  setRetrying,
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
   * 팝송 모드:
   * 1. Whisper 영어 음성 인식 (가사 힌트)
   * 2. 사용자 가사와 시퀀스 정렬 → 품질 검증
   * 3. 품질 부족 시 Whisper 재시도 (최대 MAX_WHISPER_ATTEMPTS)
   * 4. Gemini 곡 분석 (타임스탬프는 건드리지 않음)
   * 5. 정렬 타이밍 + Gemini 분석 병합
   */
  const analyzePopSong = async (audioFile: File, englishLyrics: string, koreanLyrics: string) => {
    try {
      const cleanLyricsHint = englishLyrics
        .split('\n').map((l) => l.trim()).filter((l) => l && !/^\[.*\]$/.test(l)).join('\n')

      const audioDuration = await getAudioDuration(audioFile)

      let alignment = null
      let whisperSegments = null
      for (let attempt = 1; attempt <= MAX_WHISPER_ATTEMPTS; attempt++) {
        if (attempt === 1) setTranscribing()
        else setRetrying(attempt - 1)

        const promptHint = attempt === 1
          ? cleanLyricsHint.slice(0, 800)
          : cleanLyricsHint.slice(-800)

        whisperSegments = await transcribeAudio(audioFile, 'en', promptHint)

        setVerifying()
        alignment = alignLyricsToWhisper(englishLyrics, koreanLyrics, whisperSegments, audioDuration)

        console.info(
          `[analyzePopSong] Whisper 시도 ${attempt}: 줄 커버리지 ${(alignment.quality.line_coverage * 100).toFixed(0)}%,` +
          ` 단어 매칭률 ${(alignment.quality.anchor_ratio * 100).toFixed(0)}%, 사유: ${alignment.quality.reason}`,
        )

        if (alignment.quality.acceptable) break
        if (attempt === MAX_WHISPER_ATTEMPTS) {
          console.warn(`[analyzePopSong] Whisper ${MAX_WHISPER_ATTEMPTS}회 시도 후에도 품질 미달 — 마지막 결과로 진행`)
        }
      }

      if (!alignment || !whisperSegments) {
        throw new Error('Whisper 정렬에 실패했습니다.')
      }

      setAnalyzing()
      const base64Audio = await fileToBase64(audioFile)
      const mimeType = audioFile.type || 'audio/mpeg'
      const music = await analyzePopSongMusic(base64Audio, mimeType, englishLyrics, koreanLyrics, audioDuration)

      const suspicious = new Set(music.suspicious_line_indices.map((n) => n - 1))
      const analysisByIndex = new Map(music.line_analyses.map((a) => [a.line_index - 1, a]))

      const mergedSegments: Segment[] = alignment.lines.map((line, i) => {
        const analysis = analysisByIndex.get(line.line_index)
        const isSuspicious = suspicious.has(line.line_index)
        return {
          id: i,
          start_sec: line.start_sec,
          end_sec: line.end_sec,
          korean: line.korean,
          english: line.english,
          emotion: analysis?.emotion ?? '',
          energy: analysis?.energy ?? '',
          vocal_gender: analysis?.vocal_gender ?? '',
          notes: isSuspicious
            ? `[가사 불일치 의심] ${analysis?.notes ?? ''}`.trim()
            : analysis?.notes ?? '',
          instruments: analysis?.instruments ?? [],
          words: line.words,
          isTranslating: false,
        }
      })

      setResults(mergedSegments, music.overview)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '분석에 실패했습니다.'
      setError(message)
    }
  }

  return { analyzeAll, analyzePopSong, retranslateSegment }
}
