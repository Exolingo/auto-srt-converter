import { useState, DragEvent, ChangeEvent, useRef } from 'react'

interface Props {
  onFileSelect: (file: File) => void
}

export function UploadZone({ onFileSelect }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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
    <div className="space-y-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-violet-400 bg-violet-500/10'
            : 'border-surface-600 hover:border-violet-500 hover:bg-surface-700'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleChange}
        />
        <div className="text-5xl mb-4">🎵</div>
        <p className="text-white font-medium text-lg">MP3 파일을 드래그하거나 클릭하여 선택</p>
        <p className="text-slate-500 text-sm mt-2">mp3, m4a, wav, aac 등 오디오 형식 지원 (최대 25MB)</p>
      </div>

      {selectedFile && (
        <div className="bg-surface-800 rounded-xl p-4 flex items-center justify-between border border-surface-600">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎧</span>
            <div>
              <p className="text-white font-medium text-sm">{selectedFile.name}</p>
              <p className="text-slate-500 text-xs">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <button
            onClick={() => onFileSelect(selectedFile)}
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors text-sm"
          >
            분석 시작
          </button>
        </div>
      )}
    </div>
  )
}
