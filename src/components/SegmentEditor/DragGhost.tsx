import { createPortal } from 'react-dom'
import { Segment } from '../../types'
import { DragPos } from '../../hooks/useMergeDrag'

interface Props {
  segment: Segment
  index: number
  pos: DragPos
  offset: DragPos
  width: number
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 10)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`
}

export function DragGhost({ segment, index, pos, offset, width }: Props) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: pos.x - offset.x,
        top: pos.y - offset.y,
        width,
        pointerEvents: 'none',
        zIndex: 9999,
        transform: 'rotate(1.5deg)',
        opacity: 0.93,
        boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
        transition: 'box-shadow 0.1s',
      }}
      className="bg-surface-800 rounded-xl border border-violet-400 overflow-hidden"
    >
      <div className="px-4 py-2.5 bg-surface-700 border-b border-surface-600 flex items-center gap-2">
        <span className="text-xs font-mono text-slate-500 bg-surface-900 px-2 py-0.5 rounded shrink-0">
          #{index + 1}
        </span>
        <span className="text-xs font-mono text-violet-400 shrink-0">
          {formatTime(segment.start_sec)} → {formatTime(segment.end_sec)}
        </span>
      </div>
      <div className="px-4 py-3 space-y-1">
        <p className="text-sm text-white line-clamp-2">{segment.korean}</p>
        {segment.english && (
          <p className="text-xs text-slate-400 line-clamp-1">{segment.english}</p>
        )}
      </div>
    </div>,
    document.body,
  )
}
