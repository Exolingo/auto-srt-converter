import { Segment, SongOverviewData } from '../../types'
import { SegmentRow } from './SegmentRow'
import { SegmentNav } from './SegmentNav'
import { SongOverview } from '../SongOverview'
import { downloadSrtFile } from '../../utils/srtGenerator'

interface Props {
  segments: Segment[]
  songOverview: SongOverviewData
  fileName: string
  errorMessage: string
  onKoreanChange: (id: number, value: string) => void
  onEnglishChange: (id: number, value: string) => void
  onRetranslate: (id: number, koreanText: string) => void
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
  onReset,
}: Props) {
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
        {segments.map((segment, index) => (
          <SegmentRow
            key={segment.id}
            segment={segment}
            index={index}
            instruments={songOverview.music_analysis.instruments}
            onKoreanChange={onKoreanChange}
            onEnglishChange={onEnglishChange}
            onRetranslate={onRetranslate}
          />
        ))}
      </div>

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
