import { WhisperSegment } from './whisperService'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export interface SegmentAnalysis {
  id: number
  korean: string
  english: string
  emotion: string
  confidence: 'high' | 'low'
}

function getApiKey(): string {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API 키가 설정되지 않았습니다.')
  return apiKey
}

async function callGemini(parts: object[]): Promise<string> {
  const response = await fetch(`${GEMINI_ENDPOINT}?key=${getApiKey()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.3 },
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Gemini API 호출에 실패했습니다.')
  }
  const data = await response.json()
  return data.candidates[0].content.parts[0].text as string
}

function parseJson<T>(rawText: string): T {
  const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned) as T
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * [2단계] Gemini 1차 독립 인식
 * Whisper 결과를 전혀 보지 않고 오디오만 들어서 가사 인식
 * → Whisper에 의한 편향 없이 독립적인 의견 형성
 */
export async function firstPassTranscribe(
  base64Audio: string,
  mimeType: string,
  whisperSegments: WhisperSegment[]
): Promise<Array<{ id: number; korean: string }>> {
  const segmentList = whisperSegments
    .map((s) => `${s.id}: [${formatTime(s.start)} ~ ${formatTime(s.end)}]`)
    .join('\n')

  const prompt = `당신은 한국어 뮤직비디오 전문 청취 분석가입니다.
첨부된 오디오를 직접 들으면서 각 시간 구간에서 실제로 들리는 한국어 가사를 정확히 받아쓰세요.
다른 AI의 분석 결과는 참고하지 말고, 오직 당신이 직접 들은 내용만 적으세요.

반드시 JSON 배열 형식으로만 응답하세요. 마크다운이나 설명은 포함하지 마세요.
형식: [{"id": 0, "korean": "들린 가사"}, ...]

분석할 시간 구간:
${segmentList}`

  const rawText = await callGemini([
    { inline_data: { mime_type: mimeType, data: base64Audio } },
    { text: prompt },
  ])

  return parseJson<Array<{ id: number; korean: string }>>(rawText)
}

/**
 * [3단계] Gemini 2차 교차 검증 및 최종 확정
 * Whisper + Gemini 1차 결과를 비교하여 최종 가사 결정
 * 두 AI가 일치하면 confidence: "high", 불일치하면 직접 판단 후 confidence: "low"
 */
export async function reconcileAndAnalyze(
  base64Audio: string,
  mimeType: string,
  whisperSegments: WhisperSegment[],
  geminiFirstPass: Array<{ id: number; korean: string }>
): Promise<SegmentAnalysis[]> {
  const firstPassMap = new Map(geminiFirstPass.map((g) => [g.id, g.korean]))

  const comparisonList = whisperSegments
    .map((s) => {
      const geminiText = firstPassMap.get(s.id) ?? ''
      return `${s.id}: [${formatTime(s.start)}~${formatTime(s.end)}]\n  - Whisper: "${s.text}"\n  - Gemini 1차: "${geminiText}"`
    })
    .join('\n')

  const prompt = `당신은 한국어 뮤직비디오 가사 최종 검수 전문가입니다.
두 AI(Whisper, Gemini 1차)가 같은 오디오를 독립적으로 분석한 결과입니다.
오디오를 직접 들으면서 각 구간의 최종 가사를 결정해주세요.

결정 기준:
- 두 AI가 같거나 유사한 내용이면 → confidence: "high"
- 두 AI가 다르면 오디오를 직접 다시 들어 판단 → confidence: "low"

각 세그먼트에 대해 수행하세요:
1. 최종 한국어 가사 확정
2. 자연스럽고 시적인 영어 번역
3. 감정 분류: 그리움/설렘/슬픔/기쁨/분노/희망/쓸쓸함/사랑/외로움/절망/평온/신남/간절함 중 하나
4. 신뢰도: "high" 또는 "low"

반드시 JSON 배열 형식으로만 응답하세요. 마크다운이나 설명은 포함하지 마세요.
형식: [{"id": 0, "korean": "확정 가사", "english": "translated lyrics", "emotion": "감정", "confidence": "high"}, ...]

AI 분석 비교 결과:
${comparisonList}`

  const rawText = await callGemini([
    { inline_data: { mime_type: mimeType, data: base64Audio } },
    { text: prompt },
  ])

  const parsed = parseJson<SegmentAnalysis[]>(rawText)
  const resultMap = new Map(parsed.map((r) => [r.id, r]))

  return whisperSegments.map(
    (s) => resultMap.get(s.id) ?? { id: s.id, korean: s.text, english: '', emotion: '', confidence: 'low' }
  )
}

/**
 * 개별 세그먼트 재분석 (한국어 교정 + 영어 번역 + 감정 재분류, 텍스트 기반)
 */
export async function reanalyzeSingle(koreanText: string): Promise<SegmentAnalysis> {
  const prompt = `당신은 한국어 K-pop/뮤직비디오 전문 분석가입니다.
아래 한국어 가사를 분석해주세요.

1. 자연스러운 한국어 노래 가사로 교정
2. 자연스럽고 시적인 영어 번역
3. 감정 분류: 그리움/설렘/슬픔/기쁨/분노/희망/쓸쓸함/사랑/외로움/절망/평온/신남/간절함 중 하나

JSON 형식으로만 응답하세요. 마크다운 없이.
형식: {"id": 0, "korean": "교정된 가사", "english": "translated", "emotion": "감정", "confidence": "high"}

한국어 가사: ${koreanText}`

  const rawText = await callGemini([{ text: prompt }])
  return parseJson<SegmentAnalysis>(rawText)
}

/**
 * 개별 세그먼트 영어 번역만 재실행
 */
export async function translateSingle(koreanText: string): Promise<string> {
  const prompt = `당신은 한국어 K-pop/뮤직비디오 가사를 영어로 번역하는 전문가입니다.
다음 한국어 가사를 자연스럽고 시적인 영어로 번역해주세요.
번역된 영어 가사만 반환하고, 다른 설명이나 마크다운은 포함하지 마세요.

한국어 가사: ${koreanText}`

  const result = await callGemini([{ text: prompt }])
  return result.trim()
}
