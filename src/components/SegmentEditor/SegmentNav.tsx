import { Segment } from '../../types'

interface Props {
  segments: Segment[]
  onJumpTo: (id: number) => void
}

export function SegmentNav({ segments, onJumpTo }: Props) {
  return (
    <div
      className="flex gap-1.5 overflow-x-auto pb-1"
      style={{ scrollbarWidth: 'none' }}
    >
      {segments.map((seg, index) => (
        <button
          key={seg.id}
          onClick={() => onJumpTo(seg.id)}
          title={seg.korean || `${index + 1}번 문장`}
          className="shrink-0 w-8 h-8 rounded-lg text-xs font-mono font-semibold transition-all bg-surface-700 text-slate-400 border border-surface-600 hover:bg-surface-600 hover:text-white"
        >
          {index + 1}
        </button>
      ))}
    </div>
  )
}
