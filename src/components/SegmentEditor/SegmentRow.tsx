import { useRef } from 'react'
import { Segment, AppMode } from '../../types'

interface Props {
  segment: Segment
  index: number
  mode: AppMode
  globalInstruments: string[]
  isDragging: boolean
  isDropTarget: boolean
  onKoreanChange: (id: number, value: string) => void
  onEnglishChange: (id: number, value: string) => void
  onRetranslate: (id: number, koreanText: string) => void
  onDragHandleDown: (id: number, e: React.PointerEvent<HTMLElement>) => void
  onPointerEnterCard: (id: number) => void
  onPointerLeaveCard: (id: number) => void
  onSplit: (id: number, cursorPos: number) => void
  onDeleteRequest: (id: number) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 10)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`
}

const GENDER_STYLE: Record<string, string> = {
  남성: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  여성: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  혼성: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
}

function VocalGenderBadge({ gender }: { gender: Segment['vocal_gender'] }) {
  if (!gender) return null
  const style = GENDER_STYLE[gender] ?? 'bg-surface-600 text-slate-300 border-surface-500'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${style}`}>
      {gender}
    </span>
  )
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

export function SegmentRow({
  segment, index, mode, globalInstruments, isDragging, isDropTarget,
  onKoreanChange, onEnglishChange, onRetranslate,
  onDragHandleDown, onPointerEnterCard, onPointerLeaveCard, onSplit, onDeleteRequest,
}: Props) {
  const koreanCursorRef = useRef(0)
  const englishCursorRef = useRef(0)

  const isPopSong = mode === 'popsong'

  const handleSplit = () => {
    if (isPopSong) {
      onSplit(segment.id, englishCursorRef.current)
    } else {
      onSplit(segment.id, koreanCursorRef.current)
    }
  }

  return (
    <div
      id={`segment-${segment.id}`}
      onPointerEnter={() => onPointerEnterCard(segment.id)}
      onPointerLeave={() => onPointerLeaveCard(segment.id)}
      className={`bg-surface-800 rounded-xl border overflow-hidden transition-all duration-150
        ${isDragging ? 'opacity-30 scale-[0.98]' : ''}
        ${isDropTarget ? 'border-violet-400 ring-2 ring-violet-400/40 scale-[1.01]' : 'border-surface-600'}`}
    >
      {/* 헤더 */}
      <div className="px-4 py-2.5 bg-surface-700 border-b border-surface-600">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            onPointerDown={(e) => { e.preventDefault(); onDragHandleDown(segment.id, e) }}
            className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 select-none text-base leading-none shrink-0 touch-none"
            title="드래그하여 다른 세그먼트와 합치기"
          >
            ⠿
          </span>
          <button
            onClick={handleSplit}
            title={isPopSong ? '영어 커서 위치에서 분리' : '한국어 커서 위치에서 분리'}
            className="text-slate-600 hover:text-amber-400 transition-colors text-sm leading-none shrink-0"
          >
            ✂
          </button>
          <button
            onClick={() => onDeleteRequest(segment.id)}
            title="세그먼트 삭제"
            className="text-slate-600 hover:text-red-400 transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
          <span className="text-xs font-mono text-slate-500 bg-surface-900 px-2 py-0.5 rounded shrink-0">
            #{index + 1}
          </span>
          <span className="text-xs font-mono text-violet-400 shrink-0">
            {formatTime(segment.start_sec)} → {formatTime(segment.end_sec)}
          </span>
          {!isPopSong && <EnergyDots energy={segment.energy} />}
          {!isPopSong && (() => {
            const displayInstruments = segment.instruments.length > 0 ? segment.instruments : globalInstruments
            return displayInstruments.length > 0 ? (
              <div className="ml-auto flex flex-wrap gap-1 justify-end">
                {displayInstruments.map((inst) => (
                  <span key={inst} className="text-xs text-slate-400 bg-surface-600 border border-surface-500 px-2 py-0.5 rounded-full">
                    {inst}
                  </span>
                ))}
              </div>
            ) : null
          })()}
        </div>
      </div>

      {/* 가사 */}
      <div className="p-4 space-y-3">
        {!isPopSong && (segment.vocal_gender || segment.notes) && (
          <div className="flex items-start gap-2">
            <VocalGenderBadge gender={segment.vocal_gender} />
            {segment.notes && (
              <p className="text-xs text-slate-400 leading-relaxed">{segment.notes}</p>
            )}
          </div>
        )}

        {/* 한국어 */}
        <div>
          <label className="text-xs text-slate-500 font-medium block mb-1">
            한국어
            {!isPopSong && <span className="text-slate-600 font-normal"> — 커서 위치에서 ✂ 클릭 시 분리</span>}
          </label>
          <textarea
            value={segment.korean}
            onChange={(e) => onKoreanChange(segment.id, e.target.value)}
            onSelect={(e) => { koreanCursorRef.current = e.currentTarget.selectionStart }}
            onBlur={(e) => { koreanCursorRef.current = e.currentTarget.selectionStart }}
            rows={2}
            className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        {/* English */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-500 font-medium">
              English
              {isPopSong && <span className="text-slate-600 font-normal"> — 커서 위치에서 ✂ 클릭 시 분리</span>}
            </label>
            {!isPopSong && (
              <button
                onClick={() => onRetranslate(segment.id, segment.korean)}
                disabled={segment.isTranslating}
                className="text-xs text-violet-400 hover:text-violet-300 disabled:text-slate-600 transition-colors flex items-center gap-1"
              >
                {segment.isTranslating
                  ? <><span className="inline-block w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />번역 중...</>
                  : '↺ 재번역'}
              </button>
            )}
          </div>
          <textarea
            value={segment.english}
            onChange={(e) => onEnglishChange(segment.id, e.target.value)}
            onSelect={(e) => { englishCursorRef.current = e.currentTarget.selectionStart }}
            onBlur={(e) => { englishCursorRef.current = e.currentTarget.selectionStart }}
            rows={2}
            placeholder={segment.isTranslating ? '번역 중...' : '영어 번역'}
            className="w-full bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-slate-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder-slate-600"
          />
        </div>
      </div>
    </div>
  )
}
