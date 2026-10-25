import type { Airport, FlightCategory, Ofp, StepClimb, WeightUnit } from '../types/ofp'
import type { EmptyNode, RawAirport, RawOfp, RawValue } from '../types/simbrief.raw'
import { mapFixes } from './mapRoute'
import { epoch, latLon, num, str } from './raw'

export class OfpMappingError extends Error {
  constructor(field: string) {
    super(`OFP is missing required field: ${field}`)
    this.name = 'OfpMappingError'
  }
}

function required(value: RawValue, field: string): string {
  const s = str(value)
  if (s === null) throw new OfpMappingError(field)
  return s
}



function weightUnit(value: RawValue): WeightUnit {
  return str(value)?.toLowerCase() === 'lbs' ? 'lbs' : 'kg'
}

const FLIGHT_CATEGORIES: readonly FlightCategory[] = ['vfr', 'mvfr', 'ifr', 'lifr']

function flightCategory(value: RawValue): FlightCategory | null {
  const s = str(value)?.toLowerCase()
  return FLIGHT_CATEGORIES.find((c) => c === s) ?? null
}

// "EGLL/0230/DVR/0370"  ->  EGLL at 23000, DVR at 37000  (levels are FL * 100)
export function parseStepClimbs(value: RawValue): StepClimb[] {
  const parts = str(value)?.split('/') ?? []
  const steps: StepClimb[] = []
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const fix = parts[i]?.trim()
    const level = Number(parts[i + 1])
    if (fix && Number.isFinite(level) && level > 0) {
      steps.push({ fix, altitudeFt: level * 100 })
    }
  }
  return steps
}

function isRawAirport(value: RawAirport | EmptyNode): value is RawAirport {
  return str((value as RawAirport).icao_code) !== null
}

function mapAirport(raw: RawAirport, field: string): Airport {
  return {
    icao: required(raw.icao_code, `${field}.icao_code`),
    iata: str(raw.iata_code),
    name: str(raw.name) ?? '',
    runway: str(raw.plan_rwy),
    position: latLon(raw.pos_lat, raw.pos_long),
    metar: str(raw.metar),
    flightCategory: flightCategory(raw.metar_category),
  }
}

function mapAlternate(raw: RawOfp['alternate']): Airport | null {
  const first = Array.isArray(raw) ? raw[0] : raw
  return first && isRawAirport(first) ? mapAirport(first, 'alternate') : null
}

export function mapOfp(raw: RawOfp): Ofp {
  const { general, aircraft, fuel, times, weights, params } = raw

  const airline = str(general.icao_airline)
  const number = required(general.flight_number, 'general.flight_number')
  const callsign = str(raw.atc?.callsign) ?? `${airline ?? ''}${number}`

  const initialAltitudeFt = num(general.initial_altitude)
  const stepClimbs = parseStepClimbs(general.stepclimb_string)
  const maxAltitudeFt = Math.max(initialAltitudeFt, ...stepClimbs.map((s) => s.altitudeFt))

  const unit = weightUnit(params.units)
  const sid = str(general.sid_ident)
  const star = str(general.star_ident)

  return {
    flight: { callsign, airline, number },
    origin: mapAirport(raw.origin, 'origin'),
    destination: mapAirport(raw.destination, 'destination'),
    alternate: mapAlternate(raw.alternate),
    aircraft: {
      icao: required(aircraft.icaocode, 'aircraft.icaocode'),
      name: str(aircraft.name) ?? '',
      registration: str(aircraft.reg),
      engines: str(aircraft.engines),
    },
    route: {
      text: str(general.route) ?? '',
      sid,
      star,
      distanceNm: num(general.route_distance),
      airDistanceNm: num(general.air_distance),
      fixes: mapFixes(raw.navlog, { sid, star }),
      alternateFixes: mapFixes(raw.alternate_navlog),
    },
    times: {
      enrouteSec: num(times.est_time_enroute),
      blockSec: num(times.est_block),
      scheduledOut: epoch(times.sched_out),
      scheduledIn: epoch(times.sched_in),
      estimatedOut: epoch(times.est_out),
      estimatedIn: epoch(times.est_in),
    },
    cruise: {
      initialAltitudeFt,
      maxAltitudeFt,
      stepClimbs,
      costIndex: str(general.costindex),
    },
    fuel: {
      unit,
      ramp: num(fuel.plan_ramp),
      taxi: num(fuel.taxi),
      trip: num(fuel.enroute_burn),
      contingency: num(fuel.contingency),
      alternate: num(fuel.alternate_burn),
      reserve: num(fuel.reserve),
      extra: num(fuel.extra),
      takeoff: num(fuel.plan_takeoff),
      landing: num(fuel.plan_landing),
    },
    weights: {
      unit,
      oew: num(weights.oew),
      zfw: num(weights.est_zfw),
      maxZfw: num(weights.max_zfw),
      tow: num(weights.est_tow),
      maxTow: num(weights.max_tow),
      ldw: num(weights.est_ldw),
      maxLdw: num(weights.max_ldw),
      payload: num(weights.payload),
      pax: num(weights.pax_count),
      passengerWeight: Math.round(num(weights.pax_count) * num(weights.pax_weight)),
      cargo: num(weights.cargo),
    },
    meta: {
      airac: str(params.airac),
      generatedAt: epoch(params.time_generated),
    },
  }
}
