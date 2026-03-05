import { useAuth } from './hooks/useAuth'
import { useTranscription } from './hooks/useTranscription'
import { useTranslation } from './hooks/useTranslation'
import { LoginPage } from './components/LoginPage'
import { UploadZone } from './components/UploadZone'
import { ProcessingOverlay } from './components/ProcessingOverlay'
import { SegmentEditor } from './components/SegmentEditor/SegmentEditor'
import { useState } from 'react'

export default function App() {
  const { isAuthenticated, error: authError, login, logout } = useAuth()
  const {
    segments,
    songOverview,
    status,
    errorMessage,
    setTranscribing,
    setAnalyzing,
    setResults,
    setError,
    updateKorean,
    updateEnglish,
    setSegmentTranslating,
    reset,
  } = useTranscription()

  const { analyzeAll, retranslateSegment } = useTranslation({
    segments,
    setTranscribing,
    setAnalyzing,
    setResults,
    setError,
    setSegmentTranslating,
    updateEnglish,
  })

  const [fileName, setFileName] = useState('')

  const handleAnalyze = (file: File, lyrics: string) => {
    setFileName(file.name)
    analyzeAll(file, lyrics)
  }

  const handleReset = () => {
    reset()
    setFileName('')
  }

  const processingStep =
    status === 'transcribing' ? 'transcribing'
    : status === 'analyzing' ? 'analyzing'
    : null

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} error={authError} />
  }

  return (
    <div className="min-h-screen bg-surface-900 text-white">
      {processingStep && <ProcessingOverlay step={processingStep} />}

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
                MP3와 가사를 입력하면 Gemini가 타임스탬프 매핑 · 영어 번역 · 감정/에너지 분석을 자동으로 수행합니다
              </p>
            </div>
            <UploadZone onAnalyze={handleAnalyze} />
            {status === 'error' && (
              <div className="mt-4 bg-red-900/30 border border-red-700 rounded-xl p-4">
                <p className="text-red-400 text-sm font-medium">오류 발생</p>
                <p className="text-red-300 text-sm mt-1">{errorMessage}</p>
              </div>
            )}
          </div>
        ) : status === 'done' && songOverview ? (
          <SegmentEditor
            segments={segments}
            songOverview={songOverview}
            fileName={fileName}
            errorMessage={errorMessage}
            onKoreanChange={updateKorean}
            onEnglishChange={updateEnglish}
            onRetranslate={retranslateSegment}
            onReset={handleReset}
          />
        ) : null}
      </main>
    </div>
  )
}
