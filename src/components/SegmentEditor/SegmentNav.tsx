import { useRef } from 'react'
import { Segment } from '../../types'

interface Props {
  segments: Segment[]
  onJumpTo: (id: number) => void
}

export function SegmentNav({ segments, onJumpTo }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const hasDragged = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    hasDragged.current = false
    startX.current = e.pageX - (containerRef.current?.offsetLeft ?? 0)
    scrollLeft.current = containerRef.current?.scrollLeft ?? 0
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return
    e.preventDefault()
    const x = e.pageX - containerRef.current.offsetLeft
    const walk = x - startX.current
    if (Math.abs(walk) > 3) hasDragged.current = true
    containerRef.current.scrollLeft = scrollLeft.current - walk
  }

  const handleMouseUp = () => { isDragging.current = false }

  return (
    <div
      ref={containerRef}
      className="flex gap-1.5 overflow-x-auto pb-1 cursor-grab active:cursor-grabbing select-none"
      style={{ scrollbarWidth: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {segments.map((seg, index) => (
        <button
          key={seg.id}
          onClick={() => { if (!hasDragged.current) onJumpTo(seg.id) }}
          title={seg.korean || `${index + 1}번 문장`}
          className="shrink-0 w-8 h-8 rounded-lg text-xs font-mono font-semibold transition-all bg-surface-700 text-slate-400 border border-surface-600 hover:bg-surface-600 hover:text-white"
        >
          {index + 1}
        </button>
      ))}
    </div>
  )
}
