export interface Segment {
  id: number
  start: number
  end: number
  korean: string
  english: string
  emotion: string
  confidence: 'high' | 'low' | ''
  isTranslating: boolean
}

export type AppPage = 'login' | 'upload' | 'editor'
