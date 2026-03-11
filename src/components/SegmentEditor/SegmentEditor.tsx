import { useState } from 'react'
import { Segment, SongOverviewData } from '../../types'
import { SegmentRow } from './SegmentRow'
import { MergePreviewRow } from './MergePreviewRow'
import { DragGhost } from './DragGhost'
import { SplitPreviewRow } from './SplitPreviewRow'
import { DeletePreviewRow } from './DeletePreviewRow'
import { SegmentNav } from './SegmentNav'
import { SongOverview } from '../SongOverview'
import { downloadSrtFile } from '../../utils/srtGenerator'
import { useMergeDrag } from '../../hooks/useMergeDrag'
import { useSplitPreview } from '../../hooks/useSplitPreview'

interface Props {
  segments: Segment[]
  songOverview: SongOverviewData
  fileName: string
  errorMessage: string
  onKoreanChange: (id: number, value: string) => void
  onEnglishChange: (id: number, value: string) => void
  onRetranslate: (id: number, koreanText: string) => void
  onMergeSegments: (targetId: number, sourceId: number) => void
  onSplitSegment: (segmentId: number, korFirst: string, korSecond: string, engFirst: string, engSecond: string, splitTime: number) => void
  onDeleteSegment: (id: number) => void
  onReset: () => void
}

function scrollToSegment(id: number) {
  document.getElementById(`segment-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

export function SegmentEditor({
  segments,
  songOverview,
  fileName,
  errorMessage,
  onKoreanChange,
  onEnglishChange,
  onRetranslate,
  onMergeSegments,
  onSplitSegment,
  onDeleteSegment,
  onReset,
}: Props) {
  const { draggingId, dragPos, dragOffset, dragWidth, dragOverId, pendingMerge, startDrag, enterDropZone, leaveDropZone, cancelMerge } =
    useMergeDrag()

  const draggingSegment = draggingId !== null ? segments.find((s) => s.id === draggingId) : null
  const draggingIndex = draggingId !== null ? segments.findIndex((s) => s.id === draggingId) : -1
  const { pendingSplit, triggerSplit, cancelSplit } = useSplitPreview()

  const mergeIds = pendingMerge ? new Set([pendingMerge.targetId, pendingMerge.sourceId]) : null
  const firstMergeId = pendingMerge
    ? segments.find((s) => mergeIds!.has(s.id))?.id ?? null
    : null

  const handleConfirmMerge = () => {
    onMergeSegments(pendingMerge!.targetId, pendingMerge!.sourceId)
    cancelMerge()
  }

  const handleConfirmSplit = () => {
    const s = pendingSplit!
    onSplitSegment(s.segmentId, s.korFirst, s.korSecond, s.engFirst, s.engSecond, s.splitTime)
    cancelSplit()
  }

  const handleSplit = (id: number, cursorPos: number) => {
    const segment = segments.find((s) => s.id === id)
    if (segment) triggerSplit(segment, cursorPos)
  }

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const handleConfirmDelete = () => {
    onDeleteSegment(pendingDeleteId!)
    setPendingDeleteId(null)
  }

  let visibleIndex = 0

  return (
    <div className="max-w-3xl mx-auto">
      {/* 고정 헤더 */}
      <div className="sticky top-0 z-10 bg-surface-900 pb-3 pt-2 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onReset} className="text-slate-400 hover:text-white transition-colors shrink-0">
              ← 새 파일
            </button>
            <h2 className="text-white font-semibold truncate">{fileName}</h2>
            <span className="text-slate-500 text-sm shrink-0">{segments.length}개 문장</span>
          </div>
          <button
            onClick={() => downloadSrtFile(segments, fileName)}
            className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
          >
            ⬇ SRT 다운로드
          </button>
        </div>

        <SegmentNav segments={segments} onJumpTo={scrollToSegment} />
        {errorMessage && <p className="text-red-400 text-xs">{errorMessage}</p>}
      </div>

      {/* 곡 분석 개요 */}
      <SongOverview overview={songOverview} />

      {/* 문장 목록 */}
      <div className="space-y-3">
        {segments.map((segment) => {
          if (mergeIds?.has(segment.id)) {
            if (segment.id === firstMergeId) {
              const targetSeg = segments.find((s) => s.id === pendingMerge!.targetId)!
              const sourceSeg = segments.find((s) => s.id === pendingMerge!.sourceId)!
              visibleIndex++
              return (
                <MergePreviewRow
                  key="merge-preview"
                  target={targetSeg}
                  source={sourceSeg}
                  onConfirm={handleConfirmMerge}
                  onCancel={cancelMerge}
                />
              )
            }
            return null
          }

          if (pendingDeleteId === segment.id) {
            return (
              <DeletePreviewRow
                key="delete-preview"
                segment={segment}
                index={visibleIndex++}
                onConfirm={handleConfirmDelete}
                onCancel={() => setPendingDeleteId(null)}
              />
            )
          }

          if (pendingSplit?.segmentId === segment.id) {
            visibleIndex++
            return (
              <SplitPreviewRow
                key="split-preview"
                segment={segment}
                split={pendingSplit}
                onConfirm={handleConfirmSplit}
                onCancel={cancelSplit}
              />
            )
          }

          const idx = visibleIndex++
          return (
            <SegmentRow
              key={segment.id}
              segment={segment}
              index={idx}
              globalInstruments={songOverview.music_analysis.instruments}
              isDragging={draggingId === segment.id}
              isDropTarget={draggingId !== null && dragOverId === segment.id}
              onKoreanChange={onKoreanChange}
              onEnglishChange={onEnglishChange}
              onRetranslate={onRetranslate}
              onDragHandleDown={startDrag}
              onPointerEnterCard={enterDropZone}
              onPointerLeaveCard={leaveDropZone}
              onSplit={handleSplit}
              onDeleteRequest={setPendingDeleteId}
            />
          )
        })}
      </div>

      {draggingSegment && dragPos && (
        <DragGhost
          segment={draggingSegment}
          index={draggingIndex}
          pos={dragPos}
          offset={dragOffset}
          width={dragWidth}
        />
      )}

      {segments.length > 5 && (
        <div className="pt-6 text-center">
          <button
            onClick={() => downloadSrtFile(segments, fileName)}
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            ⬇ SRT 다운로드
          </button>
        </div>
      )}
    </div>
  )
}
