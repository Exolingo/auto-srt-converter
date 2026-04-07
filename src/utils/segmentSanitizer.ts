import { Segment } from '../types'

/**
 * 팝송 세그먼트 타이밍 이상치 감지 및 보정
 *
 * Gemini가 중간에 비정상적으로 긴 세그먼트(또는 큰 갭)를 생성하면
 * 해당 지점부터 끝까지 텍스트 길이 비율로 타이밍을 재분배한다.
 * 이상치 이전의 정상 구간은 그대로 유지한다.
 */
export function sanitizePopSongTimings(segments: Segment[], audioDuration: number): Segment[] {
  if (segments.length < 3) return segments

  const anomalyIndex = findFirstAnomaly(segments)
  if (anomalyIndex === -1) return segments

  console.warn(
    `[segmentSanitizer] 이상치 감지: 세그먼트 #${anomalyIndex}` +
    ` (${segments[anomalyIndex].start_sec.toFixed(1)}s ~ ${segments[anomalyIndex].end_sec.toFixed(1)}s)` +
    ` → 해당 지점부터 타이밍 재분배`,
  )

  const goodSegments = segments.slice(0, anomalyIndex)
  const badSegments = segments.slice(anomalyIndex)

  const redistributeStart = anomalyIndex > 0 ? segments[anomalyIndex - 1].end_sec : 0
  const redistributeEnd = audioDuration
  const fixedSegments = redistributeByTextLength(badSegments, redistributeStart, redistributeEnd)

  return [...goodSegments, ...fixedSegments]
}

function findFirstAnomaly(segments: Segment[]): number {
  const durations = segments.map((s) => s.end_sec - s.start_sec)
  const sorted = [...durations].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]

  // 이상치 임계값: median의 3배이면서 최소 12초 이상
  const durationThreshold = Math.max(median * 3, 12)

  // 1) 세그먼트 자체가 비정상적으로 긴 경우
  for (let i = 0; i < segments.length; i++) {
    if (durations[i] > durationThreshold) return i
  }

  // 2) 연속 세그먼트 간 갭이 비정상적으로 큰 경우
  const gapThreshold = Math.max(median * 2, 8)
  for (let i = 0; i < segments.length - 1; i++) {
    const gap = segments[i + 1].start_sec - segments[i].end_sec
    if (gap > gapThreshold) return i + 1
  }

  return -1
}

function redistributeByTextLength(
  segments: Segment[],
  startTime: number,
  endTime: number,
): Segment[] {
  const totalTime = endTime - startTime
  const textLengths = segments.map((s) => Math.max(s.english.length + s.korean.length, 1))
  const totalText = textLengths.reduce((a, b) => a + b, 0)

  let current = startTime
  return segments.map((seg, i) => {
    const weight = textLengths[i] / totalText
    const duration = totalTime * weight
    const segStart = parseFloat(current.toFixed(2))
    current += duration
    const segEnd = i === segments.length - 1
      ? endTime
      : parseFloat(current.toFixed(2))
    return { ...seg, start_sec: segStart, end_sec: segEnd }
  })
}
