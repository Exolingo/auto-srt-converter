const EMOTION_STYLES: Record<string, string> = {
  그리움: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  설렘: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  슬픔: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  기쁨: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  분노: 'bg-red-500/20 text-red-300 border-red-500/30',
  희망: 'bg-green-500/20 text-green-300 border-green-500/30',
  쓸쓸함: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  사랑: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  외로움: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  절망: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  평온: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  신남: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  간절함: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

const DEFAULT_STYLE = 'bg-surface-600 text-slate-400 border-surface-500'

interface Props {
  emotion: string
}

export function EmotionBadge({ emotion }: Props) {
  if (!emotion) return null
  const style = EMOTION_STYLES[emotion] ?? DEFAULT_STYLE
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${style}`}>
      {emotion}
    </span>
  )
}
