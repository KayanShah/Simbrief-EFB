import type { LatLon } from '../types/ofp'
import type { EmptyNode, RawValue } from '../types/simbrief.raw'

// simbrief json is xml first so everything is a string and empty fields show up as {}

export function str(value: RawValue): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function num(value: RawValue): number {
  const s = str(value)
  if (s === null) return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

export function epoch(value: RawValue): Date | null {
  const seconds = num(value)
  return seconds > 0 ? new Date(seconds * 1000) : null
}

export function latLon(lat: RawValue, lon: RawValue): LatLon | null {
  const la = Number(str(lat) ?? NaN)
  const lo = Number(str(lon) ?? NaN)
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null
  if (Math.abs(la) > 90 || Math.abs(lo) > 180) return null
  return { lat: la, lon: lo }
}

// A repeated XML node is an array, but a single object when there's only one.
export function asArray<T extends object>(value: T | T[] | EmptyNode | undefined): T[] {
  if (value === undefined) return []
  if (Array.isArray(value)) return value
  return Object.keys(value).length === 0 ? [] : [value as T]
}
