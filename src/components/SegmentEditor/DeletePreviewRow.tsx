import { Segment } from '../../types'

interface Props {
  segment: Segment
  index: number
  onConfirm: () => void
  onCancel: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 10)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`
}

export function DeletePreviewRow({ segment, index, onConfirm, onCancel }: Props) {
  return (
    <div className="flex gap-2 items-start">
      {/* Confirm / Cancel */}
      <div className="flex flex-col gap-1 pt-3 shrink-0">
        <button
          onClick={onConfirm}
          title="삭제 확인"
          className="w-6 h-6 flex items-center justify-center bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition-colors"
        >
          ✓
        </button>
        <button
          onClick={onCancel}
          title="취소"
          className="w-6 h-6 flex items-center justify-center bg-surface-600 hover:bg-surface-500 text-white rounded text-xs font-bold transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Preview */}
      <div className="flex-1 rounded-xl border-2 border-dashed border-red-500/70 bg-surface-800 overflow-hidden opacity-60">
        <div className="px-4 py-2 bg-red-900/30 border-b border-red-800/40 flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">#{index + 1}</span>
          <span className="text-xs font-mono text-slate-400">
            {formatTime(segment.start_sec)} → {formatTime(segment.end_sec)}
          </span>
          <span className="text-xs text-red-400 font-medium ml-auto">삭제 후 해당 구간 빈 공간 처리</span>
        </div>
        <div className="px-4 py-3 space-y-1">
          <p className="text-sm text-slate-400 line-through">{segment.korean}</p>
          {segment.english && (
            <p className="text-xs text-slate-500 line-through">{segment.english}</p>
          )}
        </div>
      </div>
    </div>
  )
}
