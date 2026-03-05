// 감정 계열별 색상 매핑
const EMOTION_STYLES: Record<string, string> = {
  // 분노/원망 계열
  원망: 'bg-red-500/20 text-red-300 border-red-500/30',
  분노: 'bg-red-500/20 text-red-300 border-red-500/30',
  // 슬픔/상처 계열
  슬픔: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  아픔: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  상처: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
  고통: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  그리움: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
  // 공허/절망 계열
  공허: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  절망: 'bg-slate-600/20 text-slate-300 border-slate-600/30',
  무력감: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  무너짐: 'bg-slate-600/20 text-slate-300 border-slate-600/30',
  허무함: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  // 체념/냉담 계열
  체념: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  초연함: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  냉담: 'bg-gray-600/20 text-gray-300 border-gray-600/30',
  무심함: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  // 후회/실망 계열
  후회: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  실망: 'bg-amber-600/20 text-amber-300 border-amber-600/30',
  괴로움: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  // 상실/단절 계열
  상실감: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  단절: 'bg-purple-600/20 text-purple-300 border-purple-600/30',
  허탈함: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  종결: 'bg-purple-700/20 text-purple-300 border-purple-700/30',
  끝: 'bg-purple-700/20 text-purple-300 border-purple-700/30',
  // 억압/긴장 계열
  억압: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  // 긍정 계열
  희망: 'bg-green-500/20 text-green-300 border-green-500/30',
  설렘: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  기쁨: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  사랑: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  신남: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  간절함: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  평온: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  외로움: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  쓸쓸함: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
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
