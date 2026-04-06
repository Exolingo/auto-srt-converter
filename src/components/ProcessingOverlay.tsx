import { AppMode } from '../types'

interface Props {
  step: 'transcribing' | 'analyzing'
  mode: AppMode
}

const STEP_INFO = {
  korean: {
    transcribing: {
      icon: '🎙️',
      label: '1 / 2',
      title: 'Whisper 음성 인식 중...',
      description: '오디오에서 타임스탬프를 추출합니다.',
    },
    analyzing: {
      icon: '🎵',
      label: '2 / 2',
      title: 'Gemini 종합 분석 중...',
      description: '가사 매핑 · 영어 번역 · 감정 · 에너지 · 음악 분석을 수행합니다.',
    },
  },
  popsong: {
    transcribing: {
      icon: '🎵',
      label: '1 / 1',
      title: 'Gemini 분석 중...',
      description: '타임스탬프 매핑 · 음악 분석을 수행합니다.',
    },
    analyzing: {
      icon: '🎵',
      label: '1 / 1',
      title: 'Gemini 분석 중...',
      description: '타임스탬프 매핑 · 음악 분석을 수행합니다.',
    },
  },
}

export function ProcessingOverlay({ step, mode }: Props) {
  const info = STEP_INFO[mode][step]

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface-800 rounded-2xl p-10 w-full max-w-sm text-center border border-surface-600">
        <div className="text-5xl mb-3 animate-bounce">{info.icon}</div>
        <span className="text-xs font-mono text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full">
          {info.label}
        </span>
        <h2 className="text-white font-bold text-xl mt-3 mb-2">{info.title}</h2>
        <p className="text-slate-400 text-sm mb-6">{info.description}</p>
        <div className="flex justify-center">
          <div className="w-10 h-10 border-4 border-surface-600 border-t-violet-500 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  )
}
