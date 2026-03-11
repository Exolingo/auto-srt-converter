import { WhisperSegment, WhisperWord } from './whisperService'
import { Segment, SegmentWord, SongOverviewData } from '../types'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export interface GeminiAnalysisResult {
  duration_sec: number
  duration: string
  overall_emotion: string
  overall_mood: string
  lyrics_summary: string
  music_analysis: {
    tempo: string
    genre_hint: string
    instruments: string[]
    vocal_style: string
  }
  segments: Array<{
    start_sec: number
    end_sec: number
    text: string
    english: string
    emotion: string
    energy: 'low' | 'medium' | 'high'
    vocal_gender: '남성' | '여성' | '혼성'
    notes: string
    instruments: string[]
  }>
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
      generationConfig: { temperature: 0.7 },
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

const LYRIC_TRANSLATION_RULES = `[영어 가사 번역 규칙 — 반드시 준수]
목표: 빌보드 팝/R&B 차트에 실제로 올라올 법한 영어 가사 스타일

⚠️ 길이 제한 (가장 중요):
- 한 구간은 반드시 8단어 이하로 작성
- 한국어 어절 수를 넘지 말 것 — 의역으로 압축하되 의미는 보존
- 절대 두 문장으로 늘리지 말 것. 하나의 짧은 구절로 마무리

✅ 해야 할 것:
- 짧고 직관적인 구어체 표현 (you never knew / my heart broke / I'm falling apart)
- 단순 과거·현재형 위주 (broke, fall, know, feels)
- 축약형 자연스럽게 사용 (didn't, I'd, you're, can't)
- 반복·라임이 가능하면 살릴 것

❌ 절대 쓰면 안 되는 것:
- ultimately, furthermore, nevertheless, hence, thus, moreover 같은 격식·학술 어휘
- had worn away, had become, had faded 같은 과거완료 남발
- how much / how deeply / how greatly 같이 설명을 늘리는 관계절
- 논문·번역투 느낌이 나는 표현

예시:
한: "내 마음이 얼마나 닳았는지 넌 끝내 몰랐어" (6어절)
❌ You ultimately never knew how much my heart had worn away. (12단어)
✅ You never knew how broken I'd become. (7단어)

한: "그 밤이 지나도 넌 내 곁에 없었어" (7어절)
❌ Even after that night had passed, you were not present by my side. (13단어)
✅ Even after that night, you were gone. (7단어)

한: "너를 사랑했던 것 같아" (4어절)
❌ I think that I was in love with you all along. (11단어)
✅ I think I loved you. (5단어)`

/**
 * 오디오를 직접 들으면서 종합 분석 수행
 * - 가사 제공 시: 해당 가사를 기준으로 타임스탬프 매핑 + 허밍/간주 제외
 * - 가사 미제공 시: 오디오에서 직접 인식
 * 출력: 감정/에너지/분위기/악기/보컬스타일 + 영어 번역
 */
export async function analyzeComprehensive(
  base64Audio: string,
  mimeType: string,
  whisperSegments: WhisperSegment[],
  userLyrics?: string
): Promise<GeminiAnalysisResult> {
  const whisperList = whisperSegments
    .map((s) => `[${formatTime(s.start)}~${formatTime(s.end)}] (${s.start.toFixed(2)}s~${s.end.toFixed(2)}s): ${s.text}`)
    .join('\n')

  const lyricsSection = userLyrics?.trim()
    ? `[사용자 제공 정확한 가사]
가사가 없는 구간(허밍, 간주, 아웃트로 등)은 segments에 포함하지 마세요.
${userLyrics.trim()}`
    : '[가사 미제공: 오디오를 직접 들어 한국어 가사를 인식하세요]'

  const prompt = `당신은 한국어 뮤직비디오 전문 분석가입니다.
첨부된 오디오를 직접 들으면서 종합 분석을 수행해주세요.

${lyricsSection}

[Whisper 타임스탬프 참고]
${whisperList}

${LYRIC_TRANSLATION_RULES}

[분석 요구사항]
1. 가사 제공 시 → 해당 가사를 각 타임스탬프 구간에 매핑 (허밍/간주 구간 제외) — 각 가사 라인은 반드시 한 번만 사용하고 절대 중복 배치 금지
2. 각 구간의 한국어 가사를 위 규칙에 따라 영어 노래 가사로 번역
3. 전체 곡 분위기/감정 분석 + 가사 전체가 담고 있는 의미·주제 요약 (2~3문장, 한국어)
4. 음악 분석: tempo(느림/보통/빠름), 장르 힌트, 전체적으로 등장하는 악기 목록, 보컬 스타일
5. 구간별: 감정 키워드, 에너지(low/medium/high), 보컬 성별(남성/여성/혼성), 보컬 특징 한 문장, 해당 구간에서 두드러지는 악기 목록(전체와 다를 경우만 채우고, 차이 없으면 빈 배열)

반드시 아래 JSON 형식으로만 응답하세요. 마크다운 없이.
{
  "type": "music",
  "language": "ko",
  "duration_sec": 숫자,
  "duration": "MM:SS",
  "overall_emotion": "전체 감정 키워드",
  "overall_mood": "전체 분위기 한 문장",
  "lyrics_summary": "가사 전체의 의미와 주제를 2~3문장으로 요약 (한국어)",
  "music_analysis": {
    "tempo": "느림|보통|빠름",
    "genre_hint": "장르",
    "instruments": ["악기1", "악기2"],
    "vocal_style": "보컬 스타일 설명"
  },
  "segments": [
    {
      "start": "MM:SS",
      "end": "MM:SS",
      "start_sec": 숫자,
      "end_sec": 숫자,
      "text": "한국어 가사",
      "english": "English translation",
      "emotion": "감정",
      "energy": "low|medium|high",
      "vocal_gender": "남성|여성|혼성",
      "notes": "이 구간의 보컬 특징 한 문장 (예: 허스키하게 속삭이듯, 높은 음역대 절규 등)",
      "instruments": ["이 구간에서만 두드러지는 악기, 없으면 빈 배열"]
    }
  ]
}`

  const rawText = await callGemini([
    { inline_data: { mime_type: mimeType, data: base64Audio } },
    { text: prompt },
  ])

  return parseJson<GeminiAnalysisResult>(rawText)
}

/**
 * Gemini 분석 결과 → 앱 내부 타입 변환
 */
export function mapToSegments(result: GeminiAnalysisResult, allWords: WhisperWord[]): Segment[] {
  return result.segments.map((s, i) => ({
    id: i,
    start_sec: s.start_sec,
    end_sec: s.end_sec,
    korean: s.text,
    english: s.english,
    emotion: s.emotion,
    energy: s.energy,
    vocal_gender: s.vocal_gender ?? '',
    notes: s.notes,
    instruments: s.instruments ?? [],
    words: allWords.filter((w): w is SegmentWord => w.start >= s.start_sec && w.start < s.end_sec),
    isTranslating: false,
  }))
}

export function mapToSongOverview(result: GeminiAnalysisResult): SongOverviewData {
  return {
    duration: result.duration,
    duration_sec: result.duration_sec,
    overall_emotion: result.overall_emotion,
    overall_mood: result.overall_mood,
    lyrics_summary: result.lyrics_summary ?? '',
    music_analysis: result.music_analysis,
  }
}

/**
 * 분리된 두 구간을 함께 번역 — 각각 자연스럽고, 합쳤을 때도 자연스러운 영어 가사 생성
 */
export async function translateSplitPair(
  korFirst: string,
  korSecond: string,
  context: { prev?: string; next?: string } = {}
): Promise<[string, string]> {
  const contextLines = [
    context.prev ? `앞 문맥 (번역 불필요): "${context.prev}"` : '',
    `첫 번째 구간: "${korFirst}"`,
    `두 번째 구간: "${korSecond}"`,
    context.next ? `뒤 문맥 (번역 불필요): "${context.next}"` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `당신은 K-pop 뮤직비디오 가사를 영어로 번역하는 전문가입니다.
한국어 가사 두 구간을 영어로 번역하세요.

${LYRIC_TRANSLATION_RULES}

[분리 구간 추가 규칙]
- 두 구간을 이어 읽었을 때 하나의 자연스러운 영어 가사가 되어야 함
- 한국어 구간 분할 지점과 영어 어순을 맞출 것
  예) 한: "나는 어젯밤에 / 사과를 보았다" → 영: "Last night / I saw an apple" (O)
      "I saw an apple / last night" (X — 분할 지점이 어순과 반대)
- 아래 JSON 형식으로만 반환, 설명·마크다운 금지

${contextLines}

{"first": "첫 번째 구간 영어", "second": "두 번째 구간 영어"}`

  const raw = await callGemini([{ text: prompt }])
  const parsed = parseJson<{ first: string; second: string }>(raw)
  return [parsed.first.trim(), parsed.second.trim()]
}

/**
 * 개별 세그먼트 영어 재번역 (앞뒤 문맥 포함)
 */
export async function translateSingle(
  koreanText: string,
  context: { prev?: string; next?: string } = {}
): Promise<string> {
  const contextLines = [
    context.prev ? `이전 구간: "${context.prev}"` : '',
    `번역할 구간: "${koreanText}"`,
    context.next ? `다음 구간: "${context.next}"` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `당신은 K-pop 뮤직비디오 가사를 영어로 번역하는 전문가입니다.

${LYRIC_TRANSLATION_RULES}

앞뒤 흐름이 자연스럽게 이어지도록 "번역할 구간"만 번역하세요.
번역된 영어 가사만 반환, 설명·마크다운 금지.

${contextLines}`

  const result = await callGemini([{ text: prompt }])
  return result.trim()
}
