import type { WeightUnit } from '../types/ofp'

export const PLACEHOLDER = '—'

// en-US so tests dont flake on other locales
const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

const isValid = (n: number) => Number.isFinite(n) && n >= 0

/** 1234.6 -> "1,235" */
export function formatNumber(n: number): string {
  return isValid(n) ? integer.format(n) : PLACEHOLDER
}

/** Seconds to HH:MM, rounded to the nearest minute. 30259 -> "08:24" */
export function formatDuration(seconds: number): string {
  if (!isValid(seconds)) return PLACEHOLDER
  const totalMinutes = Math.round(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** Feet to flight level. 37000 -> "FL370", 5000 -> "FL050" */
export function formatFlightLevel(feet: number): string {
  if (!isValid(feet) || feet === 0) return PLACEHOLDER
  return `FL${String(Math.round(feet / 100)).padStart(3, '0')}`
}

/** Feet below 18,000, flight level above. 6100 -> "6,100 ft", 37000 -> "FL370" */
export function formatAltitude(feet: number): string {
  if (!isValid(feet)) return PLACEHOLDER
  return feet >= 18_000 ? formatFlightLevel(feet) : `${integer.format(feet)} ft`
}

/** 117312, 'kg' -> "117,312 kg" */
export function formatWeight(value: number, unit: WeightUnit): string {
  return isValid(value) ? `${integer.format(value)} ${unit}` : PLACEHOLDER
}

/** 4240 -> "4,240 nm" */
export function formatDistance(nm: number): string {
  return isValid(nm) ? `${integer.format(nm)} nm` : PLACEHOLDER
}

/** Zulu time, as used in aviation. -> "12:53Z" */
export function formatUtcTime(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return PLACEHOLDER
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const mm = String(date.getUTCMinutes()).padStart(2, '0')
  return `${hh}:${mm}Z`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** -> "20 Oct 12:53Z" */
export function formatUtcDateTime(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return PLACEHOLDER
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${formatUtcTime(date)}`
}

/** -> "20 Oct 2026" */
export function formatUtcDate(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return PLACEHOLDER
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

/** Live clock with seconds. -> "14:32:05" */
export function formatUtcClock(date: Date): string {
  return Number.isNaN(date.getTime()) ? '--:--:--' : date.toISOString().slice(11, 19)
}

const oneDecimal = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** 80.28 -> "80.3%" */
export function formatPercent(percent: number): string {
  return isValid(percent) ? `${oneDecimal.format(percent)}%` : PLACEHOLDER
}

export function percentOf(value: number, max: number): number {
  if (!isValid(value) || !isValid(max) || max === 0) return 0
  return Math.min(100, Math.max(0, (value / max) * 100))
}
