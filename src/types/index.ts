export interface SegmentWord {
  word: string
  start: number
  end: number
}

export interface Segment {
  id: number
  start_sec: number
  end_sec: number
  korean: string
  english: string
  emotion: string
  energy: 'low' | 'medium' | 'high' | ''
  vocal_gender: '남성' | '여성' | '혼성' | ''
  notes: string
  instruments: string[]
  words: SegmentWord[]
  isTranslating: boolean
}

export interface SongMusicAnalysis {
  tempo: string
  genre_hint: string
  instruments: string[]
  vocal_style: string
}

export interface SongOverviewData {
  duration: string
  duration_sec: number
  overall_emotion: string
  overall_mood: string
  lyrics_summary: string
  music_analysis: SongMusicAnalysis
}
