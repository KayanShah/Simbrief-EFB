import type { Ofp } from '../types/ofp'
import { percentOf } from './format'

export type FuelKey = 'ramp' | 'taxi' | 'trip' | 'contingency' | 'alternate' | 'reserve'

export interface FuelLine {
  key: FuelKey
  label: string
  value: number
  shareOfRamp: number
}

const FUEL_LINES: { key: FuelKey; label: string }[] = [
  { key: 'ramp', label: 'Ramp' },
  { key: 'taxi', label: 'Taxi' },
  { key: 'trip', label: 'Trip' },
  { key: 'contingency', label: 'Contingency' },
  { key: 'alternate', label: 'Alternate' },
  { key: 'reserve', label: 'Reserve' },
]

export function fuelBreakdown(fuel: Ofp['fuel'], keys?: FuelKey[]): FuelLine[] {
  return FUEL_LINES.filter((line) => !keys || keys.includes(line.key)).map(({ key, label }) => ({
    key,
    label,
    value: fuel[key],
    shareOfRamp: percentOf(fuel[key], fuel.ramp),
  }))
}
