import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTranscription } from './hooks/useTranscription'
import { useTranslation, AnalysisStep } from './hooks/useTranslation'
import { LoginPage } from './components/LoginPage'
import { UploadZone } from './components/UploadZone'
import { ProcessingOverlay } from './components/ProcessingOverlay'
import { SegmentEditor } from './components/SegmentEditor/SegmentEditor'

type ProcessingStep = 'transcribing' | AnalysisStep

export default function App() {
  const { isAuthenticated, error: authError, login, logout } = useAuth()
  const {
    segments,
    status,
    errorMessage,
    transcribe,
    applyFullAnalysis,
    updateKorean,
    updateEnglish,
    updateSegmentAnalysis,
    setSegmentTranslating,
  } = useTranscription()

  const { analysisStep, analysisError, analyzeAll, reanalyzeSegment, retranslateSegment } =
    useTranslation({ setSegmentTranslating, applyFullAnalysis, updateSegmentAnalysis, updateEnglish })

  const [fileName, setFileName] = useState('')
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle')

  const handleFileSelect = async (file: File) => {
    setFileName(file.name)
    setProcessingStep('transcribing')

    const whisperResult = await transcribe(file)
    if (!whisperResult) {
      setProcessingStep('idle')
      return
    }

    // analyzeAll 내부에서 analysisStep이 변하므로 ProcessingOverlay는 analysisStep을 직접 반영
    await analyzeAll(file, whisperResult)
    setProcessingStep('idle')
  }

  const activeStep: ProcessingStep =
    processingStep === 'transcribing' ? 'transcribing' : analysisStep

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} error={authError} />
  }

  return (
    <div className="min-h-screen bg-surface-900 text-white">
      {activeStep !== 'idle' && <ProcessingOverlay step={activeStep} />}

      <header className="border-b border-surface-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎬</span>
          <h1 className="font-bold text-white">Auto SRT Converter</h1>
        </div>
        <button onClick={logout} className="text-slate-400 hover:text-white text-sm transition-colors">
          로그아웃
        </button>
      </header>

      <main className="px-6 py-8">
        {status === 'idle' || status === 'error' ? (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">뮤직비디오 자막 생성</h2>
              <p className="text-slate-400 text-sm mt-2">
                Whisper · Gemini가 독립 분석 후 교차 검증 → 가사 교정 · 영어 번역 · 감정 분석
              </p>
            </div>
            <UploadZone onFileSelect={handleFileSelect} />
            {status === 'error' && (
              <div className="mt-4 bg-red-900/30 border border-red-700 rounded-xl p-4">
                <p className="text-red-400 text-sm font-medium">오류 발생</p>
                <p className="text-red-300 text-sm mt-1">{errorMessage}</p>
              </div>
            )}
          </div>
        ) : (
          <SegmentEditor
            segments={segments}
            fileName={fileName}
            analysisError={analysisError}
            onKoreanChange={updateKorean}
            onEnglishChange={updateEnglish}
            onReanalyze={reanalyzeSegment}
            onRetranslate={retranslateSegment}
            onReset={() => window.location.reload()}
          />
        )}
      </main>
    </div>
  )
}
