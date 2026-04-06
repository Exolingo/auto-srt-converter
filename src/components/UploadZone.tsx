import { useState, DragEvent, ChangeEvent, useRef } from 'react'
import { AppMode } from '../types'

interface Props {
  mode: AppMode
  onAnalyze: (file: File, lyrics: string) => void
  onAnalyzePopSong: (file: File, englishLyrics: string, koreanLyrics: string) => void
}

export function UploadZone({ mode, onAnalyze, onAnalyzePopSong }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [lyrics, setLyrics] = useState('')
  const [englishLyrics, setEnglishLyrics] = useState('')
  const [koreanLyrics, setKoreanLyrics] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      alert('오디오 파일만 업로드 가능합니다.')
      return
    }
    setSelectedFile(file)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const formatFileSize = (bytes: number) =>
    bytes > 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${(bytes / 1024).toFixed(0)} KB`

  const engLineCount = englishLyrics.split('\n').filter((l) => l.trim()).length
  const korLineCount = koreanLyrics.split('\n').filter((l) => l.trim()).length
  const lineCountMatch = engLineCount === korLineCount
  const canStartPopSong = selectedFile && englishLyrics.trim() && koreanLyrics.trim()

  const handleStart = () => {
    if (!selectedFile) return
    if (mode === 'popsong') {
      onAnalyzePopSong(selectedFile, englishLyrics, koreanLyrics)
    } else {
      onAnalyze(selectedFile, lyrics)
    }
  }

  return (
    <div className="space-y-4">
      {/* 파일 업로드 영역 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-violet-400 bg-violet-500/10'
            : selectedFile
              ? 'border-violet-500/50 bg-surface-800'
              : 'border-surface-600 hover:border-violet-500 hover:bg-surface-700'}
        `}
      >
        <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleChange} />
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl">🎧</span>
            <div className="text-left">
              <p className="text-white font-medium">{selectedFile.name}</p>
              <p className="text-slate-500 text-xs">{formatFileSize(selectedFile.size)}</p>
            </div>
            <span className="text-slate-500 text-sm ml-2">클릭하여 변경</span>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-3">🎵</div>
            <p className="text-white font-medium">MP3 파일을 드래그하거나 클릭하여 선택</p>
            <p className="text-slate-500 text-sm mt-1">mp3, m4a, wav 등 오디오 형식 지원 (최대 25MB)</p>
          </>
        )}
      </div>

      {/* 가사 입력 영역 */}
      {mode === 'korean' ? (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            가사 붙여넣기
            <span className="text-slate-500 font-normal ml-2">
              (선택사항 · 입력 시 허밍/간주 구간이 자동 제외됩니다)
            </span>
          </label>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder={"가사를 여기에 붙여넣으세요\n예)\n미안하단 말 너는 너무 쉽게 던졌지\n그 짧은 한마디 뒤에 숨겨진 건 텅 빈 얼굴"}
            rows={8}
            className="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-slate-600 leading-relaxed"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              English Lyrics
              <span className="text-slate-500 font-normal ml-2">(필수)</span>
            </label>
            <textarea
              value={englishLyrics}
              onChange={(e) => setEnglishLyrics(e.target.value)}
              placeholder={"Paste English lyrics here, one line per phrase\ne.g.)\nI was running through the 6 with my woes\nYou know how that should go"}
              rows={8}
              className="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-slate-600 leading-relaxed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              한국어 가사
              <span className="text-slate-500 font-normal ml-2">(필수 · 영어 가사와 같은 줄 수)</span>
            </label>
            <textarea
              value={koreanLyrics}
              onChange={(e) => setKoreanLyrics(e.target.value)}
              placeholder={"영어 가사에 대응하는 한국어 가사를 같은 줄 수로 붙여넣으세요\n예)\n나는 내 슬픔을 안고 6번가를 달렸어\n어떻게 되는지 너도 알잖아"}
              rows={8}
              className="w-full bg-surface-800 border border-surface-600 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-slate-600 leading-relaxed"
            />
          </div>
          {(englishLyrics.trim() || koreanLyrics.trim()) && (
            <div className={`text-xs px-3 py-2 rounded-lg ${lineCountMatch ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400'}`}>
              English: {engLineCount}줄 / 한국어: {korLineCount}줄
              {lineCountMatch ? ' ✓' : ' — 줄 수가 다릅니다. 맞춰주세요.'}
            </div>
          )}
        </div>
      )}

      {/* 분석 시작 버튼 */}
      {selectedFile && (mode === 'korean' || canStartPopSong) && (
        <button
          onClick={handleStart}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          분석 시작
        </button>
      )}
    </div>
  )
}
