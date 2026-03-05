interface Props {
  step: 'transcribing' | 'gemini_first' | 'reconciling'
}

const STEP_INFO = {
  transcribing: {
    icon: '🎙️',
    label: '1 / 3',
    title: 'Whisper 음성 인식 중...',
    description: '오디오에서 타임스탬프와 가사 초안을 추출합니다.',
    progress: 20,
  },
  gemini_first: {
    icon: '👂',
    label: '2 / 3',
    title: 'Gemini 1차 독립 인식 중...',
    description: 'Whisper 결과를 보지 않고 오디오를 직접 들어 가사를 인식합니다.',
    progress: 55,
  },
  reconciling: {
    icon: '🤝',
    label: '3 / 3',
    title: 'AI 교차 검증 중...',
    description: '두 AI의 결과를 비교하여 최종 가사 확정 · 번역 · 감정 분석을 수행합니다.',
    progress: 85,
  },
}

export function ProcessingOverlay({ step }: Props) {
  const info = STEP_INFO[step]

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface-800 rounded-2xl p-10 w-full max-w-sm text-center border border-surface-600">
        <div className="text-5xl mb-3 animate-bounce">{info.icon}</div>
        <span className="text-xs font-mono text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full">
          {info.label}
        </span>
        <h2 className="text-white font-bold text-xl mt-3 mb-2">{info.title}</h2>
        <p className="text-slate-400 text-sm mb-6">{info.description}</p>

        <div className="w-full bg-surface-700 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-violet-500 h-1.5 rounded-full transition-all duration-700"
            style={{ width: `${info.progress}%` }}
          />
        </div>

        <div className="flex justify-center mt-6 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
