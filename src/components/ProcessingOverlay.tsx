import { AppMode } from '../types'

type ProcessingStep = 'transcribing' | 'verifying' | 'retrying' | 'analyzing'

interface Props {
  step: ProcessingStep
  mode: AppMode
  retryAttempt?: number
}

interface StepInfo {
  icon: string
  label: string
  title: string
  description: string
}

const KOREAN_STEPS: Partial<Record<ProcessingStep, StepInfo>> = {
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
}

const POPSONG_STEPS: Partial<Record<ProcessingStep, StepInfo>> = {
  transcribing: {
    icon: '🎙️',
    label: '1 / 3',
    title: 'Whisper 영어 음성 인식 중...',
    description: '오디오에서 단어별 타임스탬프를 추출합니다.',
  },
  verifying: {
    icon: '🔎',
    label: '2 / 3',
    title: '가사 매칭 검증 중...',
    description: 'Whisper 인식 결과를 사용자 가사와 정렬하고 품질을 점검합니다.',
  },
  retrying: {
    icon: '🔁',
    label: '2 / 3',
    title: 'Whisper 가사 인식 오류 감지 — 재요청 중...',
    description: '품질이 충분하지 않아 Whisper를 다시 호출합니다.',
  },
  analyzing: {
    icon: '🎵',
    label: '3 / 3',
    title: 'Gemini 곡 분석 중...',
    description: '장르·편곡·보컬·줄별 감정 분석을 수행합니다.',
  },
}

function resolveInfo(mode: AppMode, step: ProcessingStep, retryAttempt?: number): StepInfo {
  const table = mode === 'popsong' ? POPSONG_STEPS : KOREAN_STEPS
  const info = table[step] ?? table.transcribing!
  if (step === 'retrying' && retryAttempt && retryAttempt > 0) {
    return { ...info, title: `${info.title} (${retryAttempt}차 재시도)` }
  }
  return info
}

export function ProcessingOverlay({ step, mode, retryAttempt }: Props) {
  const info = resolveInfo(mode, step, retryAttempt)

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
