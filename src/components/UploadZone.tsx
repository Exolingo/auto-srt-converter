import { useState, DragEvent, ChangeEvent, useRef } from 'react'

interface Props {
  onAnalyze: (file: File, lyrics: string) => void
}

export function UploadZone({ onAnalyze }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [lyrics, setLyrics] = useState('')
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

      {/* 분석 시작 버튼 */}
      {selectedFile && (
        <button
          onClick={() => onAnalyze(selectedFile, lyrics)}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          분석 시작
        </button>
      )}
    </div>
  )
}
