import { Segment } from '../types'

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`
}

function pad(n: number, length: number): string {
  return String(n).padStart(length, '0')
}

export function generateSrtContent(segments: Segment[]): string {
  return segments
    .map((seg, index) => {
      const timeRange = `${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}`
      const lines = [seg.korean, seg.english].filter(Boolean).join('\n')
      return `${index + 1}\n${timeRange}\n${lines}`
    })
    .join('\n\n')
}

export function downloadSrtFile(segments: Segment[], sourceFileName: string): void {
  const content = generateSrtContent(segments)
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = sourceFileName.replace(/\.[^.]+$/, '') + '.srt'
  anchor.click()
  URL.revokeObjectURL(url)
}
