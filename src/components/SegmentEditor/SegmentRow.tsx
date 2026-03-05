import { Segment } from '../../types'
import { EmotionBadge } from './EmotionBadge'

interface Props {
  segment: Segment
  index: number
  instruments: string[]
  onKoreanChange: (id: number, value: string) => void
  onEnglishChange: (id: number, value: string) => void
  onRetranslate: (id: number, koreanText: string) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 10)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`
}

function EnergyDots({ energy }: { energy: Segment['energy'] }) {
  const levels = { low: 1, medium: 2, high: 3, '': 0 }
  const count = levels[energy] ?? 0
  const colors = { low: 'bg-blue-400', medium: 'bg-amber-400', high: 'bg-red-400', '': 'bg-slate-600' }
  const color = colors[energy]

  return (
    <div className="flex items-center gap-0.5" title={`에너지: ${energy}`}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i <= count ? color : 'bg-surface-600'}`}
        />
      ))}
    </div>
  )
}

export function SegmentRow({ segment, index, instruments, onKoreanChange, onEnglishChange, onRetranslate }: Props) {
  return (
    <div id={`segment-${segment.id}`} className="bg-surface-800 rounded-xl border border-surface-600 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-2.5 bg-surface-700 border-b border-surface-600">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-slate-500 bg-surface-900 px-2 py-0.5 rounded shrink-0">
            #{index + 1}
          </span>
          <span className="text-xs font-mono text-violet-400 shrink-0">
            {formatTime(segment.start_sec)} → {formatTime(segment.end_sec)}
          </span>
          <EnergyDots energy={segment.energy} />
          <EmotionBadge emotion={segment.emotion} />
          {instruments.length > 0 && (
            <div className="ml-auto flex flex-wrap gap-1 justify-end">
              {instruments.map((inst) => (
                <span key={inst} className="text-xs text-slate-400 bg-surface-600 border border-surface-500 px-2 py-0.5 rounded-full">
                  {inst}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 가사 */}
      <div className="p-4 space-y-3">
        {segment.notes && (
          <p className="text-xs text-slate-500 leading-relaxed">{segment.notes}</p>
        )}
        <div>
          <label className="text-xs text-slate-500 font-medium block mb-1">한국어</label>
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
            placeholder={segment.isTranslating ? '번역 중...' : '영어 번역'}
            className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder-slate-600"
          />
        </div>
      </div>
    </div>
  )
}
