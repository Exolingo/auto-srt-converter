import { useAuth } from './hooks/useAuth'
import { useTranscription } from './hooks/useTranscription'
import { useTranslation } from './hooks/useTranslation'
import { LoginPage } from './components/LoginPage'
import { UploadZone } from './components/UploadZone'
import { ProcessingOverlay } from './components/ProcessingOverlay'
import { SegmentEditor } from './components/SegmentEditor/SegmentEditor'
import { useState } from 'react'
import { AppMode } from './types'

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
    deleteSegment,
    splitSegment,
    mergeSegments,
    reset,
  } = useTranscription()

  const { analyzeAll, analyzePopSong, retranslateSegment } = useTranslation({
    segments,
    setTranscribing,
    setAnalyzing,
    setResults,
    setError,
    setSegmentTranslating,
    updateEnglish,
  })

  const [fileName, setFileName] = useState('')
  const [mode, setMode] = useState<AppMode>('korean')

  const handleAnalyze = (file: File, lyrics: string) => {
    setFileName(file.name)
    analyzeAll(file, lyrics)
  }

  const handleAnalyzePopSong = (file: File, englishLyrics: string, koreanLyrics: string) => {
    setFileName(file.name)
    analyzePopSong(file, englishLyrics, koreanLyrics)
  }

  const handleReset = () => {
    reset()
    setFileName('')
  }

  const processingStep =
    status === 'transcribing' ? 'transcribing'
    : status === 'analyzing' ? 'analyzing'
    : null

  const isIdle = status === 'idle' || status === 'error'

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} error={authError} />
  }

  return (
    <div className="min-h-screen bg-surface-900 text-white">
      {processingStep && <ProcessingOverlay step={processingStep} mode={mode} />}

      <header className="border-b border-surface-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎬</span>
          <h1 className="font-bold text-white">Auto SRT Converter</h1>
        </div>
        <div className="flex items-center gap-4">
          {isIdle && (
            <div className="flex bg-surface-800 rounded-lg p-0.5 border border-surface-600">
              <button
                onClick={() => setMode('korean')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  mode === 'korean'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                한국어
              </button>
              <button
                onClick={() => setMode('popsong')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  mode === 'popsong'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                팝송
              </button>
            </div>
          )}
          <button onClick={logout} className="text-slate-400 hover:text-white text-sm transition-colors">
            로그아웃
          </button>
        </div>
      </header>

      <main className="px-6 py-8">
        {isIdle ? (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">
                {mode === 'korean' ? '뮤직비디오 자막 생성' : '팝송 자막 생성'}
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                {mode === 'korean'
                  ? 'MP3와 가사를 입력하면 Gemini가 타임스탬프 매핑 · 영어 번역 · 감정/에너지 분석을 자동으로 수행합니다'
                  : 'MP3와 영어/한국어 가사를 입력하면 Gemini가 타임스탬프 매핑과 음악 분석을 수행합니다'}
              </p>
            </div>
            <UploadZone mode={mode} onAnalyze={handleAnalyze} onAnalyzePopSong={handleAnalyzePopSong} />
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
            mode={mode}
            errorMessage={errorMessage}
            onKoreanChange={updateKorean}
            onEnglishChange={updateEnglish}
            onRetranslate={retranslateSegment}
            onMergeSegments={mergeSegments}
            onSplitSegment={splitSegment}
            onDeleteSegment={deleteSegment}
            onReset={handleReset}
          />
        ) : null}
      </main>
    </div>
  )
}
