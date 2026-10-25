// only the fields we actually read. the rest of the ofp is huge and we ignore it.
// empty nodes come through as {} not null which is annoying.

export type EmptyNode = Record<string, never>

export type RawValue = string | EmptyNode | undefined

export interface RawFetch {
  status: RawValue
  userid?: RawValue
}

export interface RawAirport {
  icao_code: RawValue
  iata_code: RawValue
  name: RawValue
  plan_rwy: RawValue
  pos_lat: RawValue
  pos_long: RawValue
  metar: RawValue
  metar_category: RawValue
}

export interface RawFix {
  ident: RawValue
  name: RawValue
  // wpt | vor | ndb | apt | ltlg (computed point: TOC/TOD)
  type: RawValue
  pos_lat: RawValue
  pos_long: RawValue
  stage: RawValue
  via_airway: RawValue
  // "1" inside a SID/STAR, but not set on the procedure's last fix
  is_sid_star: RawValue
  altitude_feet: RawValue
}

export interface RawNavlog {
  fix?: RawFix | RawFix[]
}

export interface RawOfp {
  fetch: RawFetch
  params: {
    airac: RawValue
    units: RawValue
    time_generated: RawValue
  }
  general: {
    icao_airline: RawValue
    flight_number: RawValue
    costindex: RawValue
    initial_altitude: RawValue
    stepclimb_string: RawValue
    route: RawValue
    sid_ident: RawValue
    star_ident: RawValue
    route_distance: RawValue
    air_distance: RawValue
  }
  origin: RawAirport
  destination: RawAirport
  // object, or an array if more than one alternate is planned
  alternate?: RawAirport | RawAirport[] | EmptyNode
  // starts at the first SID fix, not the origin
  navlog?: RawNavlog | EmptyNode
  alternate_navlog?: RawNavlog | EmptyNode
  atc?: {
    callsign: RawValue
  }
  aircraft: {
    icaocode: RawValue
    name: RawValue
    reg: RawValue
    engines: RawValue
  }
  fuel: {
    plan_ramp: RawValue
    taxi: RawValue
    enroute_burn: RawValue
    contingency: RawValue
    alternate_burn: RawValue
    reserve: RawValue
    extra: RawValue
    plan_takeoff: RawValue
    plan_landing: RawValue
  }
  times: {
    est_time_enroute: RawValue
    est_block: RawValue
    sched_out: RawValue
    sched_in: RawValue
    est_out: RawValue
    est_in: RawValue
  }
  weights: {
    oew: RawValue
    cargo: RawValue
    // per passenger, not a total
    pax_weight: RawValue
    est_zfw: RawValue
    max_zfw: RawValue
    est_tow: RawValue
    max_tow: RawValue
    est_ldw: RawValue
    max_ldw: RawValue
    payload: RawValue
    pax_count: RawValue
  }
}

// 400 body: { fetch: { status: "Error: Unknown UserID" } }
export interface RawErrorResponse {
  fetch?: RawFetch
}
