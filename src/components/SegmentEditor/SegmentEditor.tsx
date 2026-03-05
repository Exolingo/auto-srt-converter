import { Segment } from '../../types'
import { SegmentRow } from './SegmentRow'
import { EmotionBadge } from './EmotionBadge'
import { downloadSrtFile } from '../../utils/srtGenerator'

interface Props {
  segments: Segment[]
  fileName: string
  analysisError: string
  onKoreanChange: (id: number, value: string) => void
  onEnglishChange: (id: number, value: string) => void
  onReanalyze: (id: number, koreanText: string) => void
  onRetranslate: (id: number, koreanText: string) => void
  onReset: () => void
}

function getEmotionSummary(segments: Segment[]): string[] {
  const counts = new Map<string, number>()
  segments.forEach((s) => {
    if (s.emotion) counts.set(s.emotion, (counts.get(s.emotion) ?? 0) + 1)
  })
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([emotion]) => emotion)
}

export function SegmentEditor({
  segments,
  fileName,
  analysisError,
  onKoreanChange,
  onEnglishChange,
  onReanalyze,
  onRetranslate,
  onReset,
}: Props) {
  const dominantEmotions = getEmotionSummary(segments)

  return (
    <div className="max-w-3xl mx-auto">
      {/* 고정 헤더 */}
      <div className="sticky top-0 z-10 bg-surface-900 pb-4 pt-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onReset} className="text-slate-400 hover:text-white transition-colors shrink-0">
              ← 새 파일
            </button>
            <h2 className="text-white font-semibold truncate">{fileName}</h2>
            <span className="text-slate-500 text-sm shrink-0">{segments.length}개 세그먼트</span>
          </div>
          <button
            onClick={() => downloadSrtFile(segments, fileName)}
            className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
          >
            ⬇ SRT 다운로드
          </button>
        </div>

        {analysisError && <p className="text-red-400 text-xs mt-2">{analysisError}</p>}
      </div>

      {/* 감정 분석 요약 카드 */}
      {dominantEmotions.length > 0 && (
        <div className="mb-5 bg-surface-800 rounded-xl border border-surface-600 p-4">
          <p className="text-xs text-slate-500 font-medium mb-2">이 곡의 주요 감정</p>
          <div className="flex flex-wrap gap-2">
            {dominantEmotions.map((emotion) => (
              <EmotionBadge key={emotion} emotion={emotion} />
            ))}
          </div>
        </div>
      )}

      {/* 세그먼트 목록 */}
      <div className="space-y-3">
        {segments.map((segment, index) => (
          <SegmentRow
            key={segment.id}
            segment={segment}
            index={index}
            onKoreanChange={onKoreanChange}
            onEnglishChange={onEnglishChange}
            onReanalyze={onReanalyze}
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
