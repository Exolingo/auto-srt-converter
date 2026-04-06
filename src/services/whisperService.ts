export interface WhisperWord {
  word: string
  start: number
  end: number
}

export interface WhisperSegment {
  id: number
  start: number
  end: number
  text: string
  words: WhisperWord[]
}

interface WhisperVerboseResponse {
  segments: Array<{
    id: number
    start: number
    end: number
    text: string
    words?: WhisperWord[]
  }>
}

export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    audio.onloadedmetadata = () => {
      resolve(audio.duration)
      URL.revokeObjectURL(audio.src)
    }
    audio.onerror = () => {
      URL.revokeObjectURL(audio.src)
      reject(new Error('오디오 길이를 읽을 수 없습니다.'))
    }
    audio.src = URL.createObjectURL(file)
  })
}

export async function transcribeAudio(file: File, language: 'ko' | 'en' = 'ko'): Promise<WhisperSegment[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API 키가 설정되지 않았습니다.')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('model', 'whisper-1')
  formData.append('response_format', 'verbose_json')
  formData.append('timestamp_granularities[]', 'segment')
  formData.append('timestamp_granularities[]', 'word')
  formData.append('language', language)
  // Whisper의 prompt는 지시문이 아닌 "이전 텍스트" 역할 — 가사 스타일 힌트만 제공
  if (language === 'ko') {
    formData.append('prompt', '한국어 노래 가사입니다. 뮤직비디오의 가사를 정확하게 받아쓰기 해주세요.')
  }

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || '음성 인식에 실패했습니다.')
  }

  const data: WhisperVerboseResponse = await response.json()

  return data.segments.map((seg) => ({
    id: seg.id,
    start: seg.start,
    end: seg.end,
    text: seg.text.trim(),
    words: seg.words ?? [],
  }))
}
