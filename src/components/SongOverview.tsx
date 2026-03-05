import { SongOverviewData } from '../types'

interface Props {
  overview: SongOverviewData
}

const TEMPO_COLOR: Record<string, string> = {
  느림: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  보통: 'bg-green-500/20 text-green-300 border-green-500/30',
  빠름: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

function Chip({ label, color = 'bg-surface-600 text-slate-300 border-surface-500' }: { label: string; color?: string }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${color}`}>
      {label}
    </span>
  )
}

export function SongOverview({ overview }: Props) {
  const { music_analysis: ma } = overview

  return (
    <div className="bg-gradient-to-br from-surface-800 to-surface-700 rounded-2xl border border-surface-600 p-5 mb-5 space-y-4">
      {/* 전체 감정 + 분위기 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">전체 감정</p>
          <p className="text-white font-bold text-2xl">{overview.overall_emotion}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 font-medium mb-1">러닝타임</p>
          <p className="text-violet-400 font-mono font-semibold">{overview.duration}</p>
        </div>
      </div>

      <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-violet-500/50 pl-3">
        {overview.overall_mood}
      </p>

      {/* 음악 분석 태그 */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <Chip label={ma.tempo} color={TEMPO_COLOR[ma.tempo] ?? 'bg-surface-600 text-slate-300 border-surface-500'} />
          <Chip label={ma.genre_hint} color="bg-violet-500/20 text-violet-300 border-violet-500/30" />
        </div>
        <p className="text-slate-400 text-xs">🎤 {ma.vocal_style}</p>
      </div>
    </div>
  )
}
