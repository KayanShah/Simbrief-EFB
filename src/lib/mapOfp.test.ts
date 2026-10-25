import emptyFieldsFixture from '../api/__fixtures__/ofp.empty-fields.json'
import fullFixture from '../api/__fixtures__/ofp.full.json'
import type { RawAirport, RawOfp } from '../types/simbrief.raw'
import { OfpMappingError, mapOfp, parseStepClimbs } from './mapOfp'
import { num, str } from './raw'

const full = fullFixture as RawOfp
const emptyFields = emptyFieldsFixture as RawOfp // the ga one with {} fields

describe('str / num', () => {
  it('treats SimBrief empty nodes ({}) as missing', () => {
    expect(str({})).toBeNull()
    expect(num({})).toBe(0)
  })

  it('trims strings and treats blanks as missing', () => {
    expect(str('  BAW ')).toBe('BAW')
    expect(str('   ')).toBeNull()
    expect(str(undefined)).toBeNull()
  })

  it('parses numeric strings and rejects junk', () => {
    expect(num('36000')).toBe(36000)
    expect(num('.68')).toBe(0.68)
    expect(num('abc')).toBe(0)
  })
})

describe('parseStepClimbs', () => {
  it('parses fix/level pairs into feet', () => {
    expect(parseStepClimbs('EGLL/0230/DVR/0370/OTPOM/0390')).toEqual([
      { fix: 'EGLL', altitudeFt: 23000 },
      { fix: 'DVR', altitudeFt: 37000 },
      { fix: 'OTPOM', altitudeFt: 39000 },
    ])
  })

  it('ignores empty, odd-length or malformed input', () => {
    expect(parseStepClimbs({})).toEqual([])
    expect(parseStepClimbs('EGLL/0230/DVR')).toEqual([{ fix: 'EGLL', altitudeFt: 23000 }])
    expect(parseStepClimbs('EGLL/XXXX')).toEqual([])
  })
})

describe('mapOfp — full airline flight (BAW199)', () => {
  const ofp = mapOfp(full)

  it('maps flight identity', () => {
    expect(ofp.flight).toEqual({ callsign: 'BAW199', airline: 'BAW', number: '199' })
  })

  it('maps airports', () => {
    expect(ofp.origin).toMatchObject({ icao: 'EGLL', iata: 'LHR', runway: '09R', flightCategory: 'mvfr' })
    expect(ofp.destination).toMatchObject({ icao: 'VABB', runway: '27', flightCategory: 'ifr' })
    expect(ofp.alternate).toMatchObject({ icao: 'VOBL', name: 'KEMPEGOWDA INTL' })
  })

  it('maps aircraft and route', () => {
    expect(ofp.aircraft).toEqual({
      icao: 'A388',
      name: 'A380-800',
      registration: 'G-XLEH',
      engines: 'TRENT 970-84',
    })
    expect(ofp.route.sid).toBe('DET1J')
    expect(ofp.route.star).toBe('KETO2A')
    expect(ofp.route.text.startsWith('DET1J DET L6 DVR')).toBe(true)
    expect(ofp.route.distanceNm).toBe(4240)
  })

  it('maps times as numbers and dates', () => {
    expect(ofp.times.enrouteSec).toBe(30259)
    expect(ofp.times.scheduledOut).toEqual(new Date(1792502700 * 1000))
  })

  it('derives the highest cruise level from step climbs', () => {
    expect(ofp.cruise.initialAltitudeFt).toBe(23000)
    expect(ofp.cruise.maxAltitudeFt).toBe(39000)
    expect(ofp.cruise.stepClimbs).toHaveLength(3)
  })

  it('maps fuel and weights in the planned unit', () => {
    expect(ofp.fuel).toMatchObject({ unit: 'kg', ramp: 117312, trip: 94180, reserve: 4629 })
    expect(ofp.weights).toMatchObject({ unit: 'kg', zfw: 323706, maxZfw: 369000, pax: 372 })
  })

  it('maps metadata', () => {
    expect(ofp.meta.airac).toBe('2503')
    expect(ofp.meta.generatedAt).toBeInstanceOf(Date)
  })
})

describe('mapOfp — flight with empty fields (N388SB)', () => {
  const ofp = mapOfp(emptyFields)

  it('handles a missing airline code', () => {
    expect(ofp.flight).toEqual({ callsign: 'N388SB', airline: null, number: 'N388SB' })
  })

  it('handles a missing STAR', () => {
    expect(ofp.route.star).toBeNull()
  })
})

describe('mapOfp — edge cases', () => {
  it('reads weights in pounds', () => {
    const ofp = mapOfp({ ...full, params: { ...full.params, units: 'lbs' } })
    expect(ofp.fuel.unit).toBe('lbs')
    expect(ofp.weights.unit).toBe('lbs')
  })

  it('returns no alternate when none is planned', () => {
    expect(mapOfp({ ...full, alternate: {} }).alternate).toBeNull()
    expect(mapOfp({ ...full, alternate: undefined }).alternate).toBeNull()
  })

  it('uses the first alternate when several are planned', () => {
    const second: RawAirport = { ...(full.alternate as RawAirport), icao_code: 'VAAH' }
    const ofp = mapOfp({ ...full, alternate: [full.alternate as RawAirport, second] })
    expect(ofp.alternate?.icao).toBe('VOBL')
  })

  it('builds the callsign from airline and number when ATC data is missing', () => {
    expect(mapOfp({ ...full, atc: undefined }).flight.callsign).toBe('BAW199')
  })

  it('throws when a required field is missing', () => {
    const broken = { ...full, origin: { ...full.origin, icao_code: {} } }
    expect(() => mapOfp(broken)).toThrow(OfpMappingError)
  })
})
