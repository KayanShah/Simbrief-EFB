import emptyFieldsFixture from '../api/__fixtures__/ofp.empty-fields.json'
import fullFixture from '../api/__fixtures__/ofp.full.json'
import type { RawFix, RawOfp } from '../types/simbrief.raw'
import { mapOfp } from './mapOfp'
import { mapFixes } from './mapRoute'
import { asArray } from './raw'

const full = mapOfp(fullFixture as RawOfp)
const noStar = mapOfp(emptyFieldsFixture as RawOfp) // no STAR ident on this one

const fix = (overrides: Partial<RawFix>): RawFix => ({
  ident: 'ABCDE',
  name: {},
  type: 'wpt',
  pos_lat: '51.0',
  pos_long: '-1.0',
  stage: 'CRZ',
  via_airway: 'DCT',
  is_sid_star: '0',
  altitude_feet: '35000',
  ...overrides,
})

describe('mapFixes — BAW199 (DET1J … KETO2A)', () => {
  const { fixes } = full.route

  it('keeps every navlog fix in order, ending at the destination', () => {
    expect(fixes).toHaveLength(82)
    expect(fixes[0]).toMatchObject({ ident: 'D130B', position: { lat: 51.465417, lon: -0.426283 } })
    expect(fixes.at(-1)).toMatchObject({ ident: 'VABB', kind: 'airport' })
  })

  it('labels SID, en-route and STAR legs', () => {
    const segmentOf = (ident: string) => fixes.find((f) => f.ident === ident)?.segment
    expect(segmentOf('D130B')).toBe('sid')
    // DET ends the SID: SimBrief doesn't flag it, but it's reached via DET1J.
    expect(segmentOf('DET')).toBe('sid')
    expect(segmentOf('DVR')).toBe('enroute')
    expect(segmentOf('KETOR')).toBe('star')
    expect(segmentOf('VABB')).toBe('star')
  })

  it('marks TOC/TOD as pseudo fixes and navaids as navaids', () => {
    expect(fixes.filter((f) => f.kind === 'pseudo').map((f) => f.ident)).toEqual(['TOC', 'TOD'])
    expect(fixes.find((f) => f.ident === 'DVR')?.kind).toBe('navaid')
  })

  it('maps the alternate route', () => {
    expect(full.route.alternateFixes.at(-1)?.ident).toBe('VOBL')
  })

  it('includes airport coordinates', () => {
    expect(full.origin.position).toEqual({ lat: 51.4775, lon: -0.461389 })
  })
})

describe('mapFixes — flight without a STAR', () => {
  it('treats everything after the SID as en route', () => {
    const { fixes } = noStar.route
    expect(fixes.some((f) => f.segment === 'star')).toBe(false)
    expect(fixes.at(-1)).toMatchObject({ ident: 'VABB', segment: 'enroute' })
  })
})

describe('mapFixes — edge cases', () => {
  it('accepts a single fix sent as an object instead of an array', () => {
    expect(mapFixes({ fix: fix({ ident: 'SOLO' }) })).toHaveLength(1)
  })

  it('returns no fixes for an empty or missing navlog', () => {
    expect(mapFixes({})).toEqual([])
    expect(mapFixes(undefined)).toEqual([])
  })

  it('skips fixes with missing or invalid coordinates', () => {
    const fixes = mapFixes({
      fix: [fix({ ident: 'OK' }), fix({ ident: 'NOLAT', pos_lat: {} }), fix({ ident: 'BAD', pos_long: '999' })],
    })
    expect(fixes.map((f) => f.ident)).toEqual(['OK'])
  })

  it('falls back to the SID/STAR flag when the procedure name does not match', () => {
    const fixes = mapFixes(
      {
        fix: [
          fix({ ident: 'A', is_sid_star: '1', via_airway: 'XXX1A' }),
          fix({ ident: 'B', via_airway: 'UL9' }),
          fix({ ident: 'C', is_sid_star: '1', via_airway: 'YYY2B' }),
        ],
      },
      { sid: null, star: null },
    )
    expect(fixes.map((f) => f.segment)).toEqual(['sid', 'enroute', 'star'])
  })
})

describe('asArray', () => {
  it('normalises repeated XML nodes', () => {
    expect(asArray(undefined)).toEqual([])
    expect(asArray({})).toEqual([])
    expect(asArray({ a: 1 })).toEqual([{ a: 1 }])
    expect(asArray([{ a: 1 }, { a: 2 }])).toHaveLength(2)
  })
})
