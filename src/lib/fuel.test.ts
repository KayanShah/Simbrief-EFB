import fullFixture from '../api/__fixtures__/ofp.full.json'
import type { RawOfp } from '../types/simbrief.raw'
import { fuelBreakdown } from './fuel'
import { mapOfp } from './mapOfp'

const { fuel } = mapOfp(fullFixture as RawOfp)

describe('fuelBreakdown', () => {

  it('lists fuel in display order with each share of ramp', () => {
    const lines = fuelBreakdown(fuel)
    expect(lines.map((l) => l.label)).toEqual(['Ramp', 'Taxi', 'Trip', 'Contingency', 'Alternate', 'Reserve'])
    expect(lines[0]).toEqual({ key: 'ramp', label: 'Ramp', value: 117312, shareOfRamp: 100 })
    expect(lines.find((l) => l.key === 'trip')?.shareOfRamp).toBeCloseTo((94180 / 117312) * 100)
  })

  it('can return a subset', () => {
    expect(fuelBreakdown(fuel, ['ramp', 'trip', 'reserve']).map((l) => l.key)).toEqual(['ramp', 'trip', 'reserve'])
  })

  it('returns 0% shares when ramp fuel is missing', () => {
    expect(fuelBreakdown({ ...fuel, ramp: 0 }).every((l) => l.shareOfRamp === 0)).toBe(true)
  })
})
