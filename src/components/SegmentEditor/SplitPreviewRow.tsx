import { Segment } from '../../types'
import { PendingSplit } from '../../hooks/useSplitPreview'

interface Props {
  segment: Segment
  split: PendingSplit
  onConfirm: () => void
  onCancel: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 10)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`
}

function MiniCard({ timeLabel, korean, english }: { timeLabel: string; korean: string; english: string }) {
  return (
    <div className="rounded-lg border border-surface-600 bg-surface-800 overflow-hidden">
      <div className="px-3 py-1.5 bg-surface-700 border-b border-surface-600">
        <span className="text-xs font-mono text-violet-400">{timeLabel}</span>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        <p className="text-xs text-slate-500 font-medium">한국어</p>
        <p className="text-sm text-white">{korean || <span className="text-slate-600 italic">비어있음</span>}</p>
        <p className="text-xs text-slate-500 font-medium mt-1">English</p>
        <p className="text-sm text-slate-300">{english || <span className="text-slate-600 italic">empty</span>}</p>
      </div>
    </div>
  )
}

export function SplitPreviewRow({ segment, split, onConfirm, onCancel }: Props) {
  const { korFirst, korSecond, engFirst, engSecond, splitTime } = split

  return (
    <div className="flex gap-2 items-start">
      {/* Confirm / Cancel */}
      <div className="flex flex-col gap-1 pt-3 shrink-0">
        <button
          onClick={onConfirm}
          title="분리 확인"
          className="w-6 h-6 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors"
        >
          ✓
        </button>
        <button
          onClick={onCancel}
          title="취소"
          className="w-6 h-6 flex items-center justify-center bg-red-700/80 hover:bg-red-600 text-white rounded text-xs font-bold transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Preview */}
      <div className="flex-1 rounded-xl border-2 border-dashed border-amber-500/70 bg-surface-800 overflow-hidden">
        <div className="px-4 py-2 bg-surface-700 border-b border-surface-600">
          <span className="text-xs text-amber-400 font-medium">분리 미리보기</span>
        </div>
        <div className="p-3 space-y-2">
          <MiniCard
            timeLabel={`${formatTime(segment.start_sec)} → ${formatTime(splitTime)}`}
            korean={korFirst}
            english={engFirst}
          />
          <MiniCard
            timeLabel={`${formatTime(splitTime)} → ${formatTime(segment.end_sec)}`}
            korean={korSecond}
            english={engSecond}
          />
        </div>
      </div>
    </div>
  )
}
