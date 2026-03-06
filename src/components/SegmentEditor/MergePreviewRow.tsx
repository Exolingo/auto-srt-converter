import { Segment } from '../../types'

interface Props {
  target: Segment
  source: Segment
  onConfirm: () => void
  onCancel: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 10)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`
}

export function MergePreviewRow({ target, source, onConfirm, onCancel }: Props) {
  const [first, second] =
    target.start_sec <= source.start_sec ? [target, source] : [source, target]

  return (
    <div className="flex gap-2 items-start">
      {/* Confirm / Cancel buttons */}
      <div className="flex flex-col gap-1 pt-3 shrink-0">
        <button
          onClick={onConfirm}
          title="합치기 확인"
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

      {/* Preview card */}
      <div className="flex-1 rounded-xl border-2 border-dashed border-violet-500 bg-surface-800 overflow-hidden">
        <div className="px-4 py-2 bg-surface-700 border-b border-surface-600 flex items-center gap-3">
          <span className="text-xs font-mono text-violet-400">
            {formatTime(first.start_sec)} → {formatTime(second.end_sec)}
          </span>
          <span className="text-xs text-violet-400 font-medium">합치기 미리보기</span>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs text-slate-500 font-medium block mb-1">한국어</label>
            <p className="text-sm text-white">
              {first.korean}
              <span className="text-slate-600 mx-1">·</span>
              {second.korean}
            </p>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium block mb-1">English</label>
            <p className="text-sm text-slate-200">
              {first.english}
              <span className="text-slate-600 mx-1">·</span>
              {second.english}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
