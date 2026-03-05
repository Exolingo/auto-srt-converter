import { Segment } from '../../types'
import { EmotionBadge } from './EmotionBadge'

interface Props {
  segment: Segment
  index: number
  onKoreanChange: (id: number, value: string) => void
  onEnglishChange: (id: number, value: string) => void
  onReanalyze: (id: number, koreanText: string) => void
  onRetranslate: (id: number, koreanText: string) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 10)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`
}

function ConfidenceBadge({ confidence }: { confidence: Segment['confidence'] }) {
  if (confidence === 'low') {
    return (
      <span
        title="Whisper와 Gemini의 인식 결과가 달라 재판단된 구간입니다. 확인을 권장합니다."
        className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full cursor-help"
      >
        ⚠ 재확인 권장
      </span>
    )
  }
  if (confidence === 'high') {
    return (
      <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
        ✓ 일치
      </span>
    )
  }
  return null
}

export function SegmentRow({ segment, index, onKoreanChange, onEnglishChange, onReanalyze, onRetranslate }: Props) {
  return (
    <div className="bg-surface-800 rounded-xl border border-surface-600 overflow-hidden">
      {/* 헤더: 타임스탬프 + 신뢰도 + 감정 */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-700 border-b border-surface-600 flex-wrap">
        <span className="text-xs font-mono text-slate-500 bg-surface-900 px-2 py-0.5 rounded shrink-0">
          #{index + 1}
        </span>
        <span className="text-xs font-mono text-violet-400 shrink-0">
          {formatTime(segment.start)} → {formatTime(segment.end)}
        </span>
        <ConfidenceBadge confidence={segment.confidence} />
        <EmotionBadge emotion={segment.emotion} />
      </div>

      {/* 가사 */}
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-500 font-medium">한국어</label>
            <button
              onClick={() => onReanalyze(segment.id, segment.korean)}
              disabled={segment.isTranslating}
              className="text-xs text-amber-400 hover:text-amber-300 disabled:text-slate-600 transition-colors flex items-center gap-1"
            >
              {segment.isTranslating
                ? <><span className="inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />분석 중...</>
                : '✍️ 재분석'}
            </button>
          </div>
          <textarea
            value={segment.korean}
            onChange={(e) => onKoreanChange(segment.id, e.target.value)}
            rows={2}
            className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-500 font-medium">English</label>
            <button
              onClick={() => onRetranslate(segment.id, segment.korean)}
              disabled={segment.isTranslating}
              className="text-xs text-violet-400 hover:text-violet-300 disabled:text-slate-600 transition-colors flex items-center gap-1"
            >
              {segment.isTranslating
                ? <><span className="inline-block w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />번역 중...</>
                : '↺ 재번역'}
            </button>
          </div>
          <textarea
            value={segment.english}
            onChange={(e) => onEnglishChange(segment.id, e.target.value)}
            rows={2}
            placeholder={segment.isTranslating ? '처리 중...' : '영어 번역'}
            className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder-slate-600"
          />
        </div>
      </div>
    </div>
  )
}
