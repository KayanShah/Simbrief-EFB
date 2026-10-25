// clean model the ui uses. raw simbrief types live in simbrief.raw.ts

export type WeightUnit = 'kg' | 'lbs'

export type FlightCategory = 'vfr' | 'mvfr' | 'ifr' | 'lifr'

export interface LatLon {
  lat: number
  lon: number
}

export interface Airport {
  icao: string
  iata: string | null
  name: string
  runway: string | null
  position: LatLon | null
  metar: string | null
  flightCategory: FlightCategory | null
}

export type RouteSegment = 'sid' | 'enroute' | 'star'

export type FixKind = 'airport' | 'navaid' | 'waypoint' | 'pseudo'

export interface RouteFix {
  ident: string
  name: string | null
  /** 'pseudo' = a computed point such as TOC/TOD, not a real fix. */
  kind: FixKind
  position: LatLon
  /** Segment of the leg that arrives at this fix. */
  segment: RouteSegment
  via: string | null
  altitudeFt: number
}

export interface StepClimb {
  fix: string
  altitudeFt: number
}

export interface Ofp {
  flight: {
    callsign: string
    airline: string | null
    number: string
  }
  origin: Airport
  destination: Airport
  alternate: Airport | null
  aircraft: {
    icao: string
    name: string
    registration: string | null
    engines: string | null
  }
  route: {
    text: string
    sid: string | null
    star: string | null
    distanceNm: number
    airDistanceNm: number
    fixes: RouteFix[]
    alternateFixes: RouteFix[]
  }
  times: {
    enrouteSec: number
    blockSec: number
    scheduledOut: Date | null
    scheduledIn: Date | null
    /** Planned off-block (out) and on-block (in) times. */
    estimatedOut: Date | null
    estimatedIn: Date | null
  }
  cruise: {
    initialAltitudeFt: number
    /** Highest planned level, including step climbs. */
    maxAltitudeFt: number
    stepClimbs: StepClimb[]
    costIndex: string | null
  }
  fuel: {
    unit: WeightUnit
    ramp: number
    taxi: number
    trip: number
    contingency: number
    alternate: number
    reserve: number
    extra: number
    takeoff: number
    landing: number
  }
  weights: {
    unit: WeightUnit
    oew: number
    zfw: number
    maxZfw: number
    tow: number
    maxTow: number
    ldw: number
    maxLdw: number
    payload: number
    pax: number
    /** Total passenger weight (count × standard weight). */
    passengerWeight: number
    cargo: number
  }
  meta: {
    airac: string | null
    generatedAt: Date | null
  }
}
