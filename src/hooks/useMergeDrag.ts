import { useState, useEffect, useRef } from 'react'

export interface PendingMerge {
  targetId: number
  sourceId: number
}

export interface DragPos {
  x: number
  y: number
}

export function useMergeDrag() {
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragPos, setDragPos] = useState<DragPos | null>(null)
  const [dragOffset, setDragOffset] = useState<DragPos>({ x: 0, y: 0 })
  const [dragWidth, setDragWidth] = useState(600)
  const [dragOverId, setDragOverId] = useState<number | null>(null)
  const [pendingMerge, setPendingMerge] = useState<PendingMerge | null>(null)

  const draggingIdRef = useRef<number | null>(null)
  const dragOverIdRef = useRef<number | null>(null)

  useEffect(() => { draggingIdRef.current = draggingId }, [draggingId])
  useEffect(() => { dragOverIdRef.current = dragOverId }, [dragOverId])

  useEffect(() => {
    if (draggingId === null) return

    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'

    const onMove = (e: PointerEvent) => setDragPos({ x: e.clientX, y: e.clientY })

    const onUp = () => {
      const srcId = draggingIdRef.current
      const tgtId = dragOverIdRef.current
      if (srcId !== null && tgtId !== null && srcId !== tgtId) {
        setPendingMerge({ targetId: tgtId, sourceId: srcId })
      }
      setDraggingId(null)
      setDragPos(null)
      setDragOverId(null)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [draggingId])

  const startDrag = (id: number, e: React.PointerEvent<HTMLElement>) => {
    const card = document.getElementById(`segment-${id}`)
    const rect = card?.getBoundingClientRect()
    setDraggingId(id)
    setDragPos({ x: e.clientX, y: e.clientY })
    setDragOffset({ x: rect ? e.clientX - rect.left : 0, y: rect ? e.clientY - rect.top : 0 })
    setDragWidth(rect?.width ?? 600)
  }

  const enterDropZone = (id: number) => {
    if (draggingId !== null && id !== draggingId) setDragOverId(id)
  }

  const leaveDropZone = (id: number) => {
    if (draggingId !== null && dragOverId === id) setDragOverId(null)
  }

  const cancelMerge = () => setPendingMerge(null)

  return { draggingId, dragPos, dragOffset, dragWidth, dragOverId, pendingMerge, startDrag, enterDropZone, leaveDropZone, cancelMerge }
}
