import type { LatLon, Ofp, RouteFix, RouteSegment } from '../types/ofp'

// unwrap longs if we cross 180 or the pacific route draws the long way round
export function unwrapLongitudes(points: LatLon[]): LatLon[] {
  const result: LatLon[] = []
  for (const point of points) {
    const previous = result.at(-1)
    let lon = point.lon
    if (previous) {
      while (lon - previous.lon > 180) lon -= 360
      while (lon - previous.lon < -180) lon += 360
    }
    result.push({ lat: point.lat, lon })
  }
  return result
}

export type LineKind = RouteSegment | 'alternate'

export interface RouteLine {
  kind: LineKind
  points: LatLon[]
}

export interface RouteGeometry {
  origin: LatLon | null
  destination: LatLon | null
  alternate: LatLon | null
  fixes: RouteFix[]
  lines: RouteLine[]
  bounds: LatLon[]
}

function withPositions(fixes: RouteFix[], points: LatLon[], offset: number): RouteFix[] {
  return fixes.map((fix, i) => ({ ...fix, position: points[i + offset] ?? fix.position }))
}

// navlog starts at the first SID fix so we stick origin on the front
// and squash consecutive legs of the same colour into one polyline
export function routeGeometry(ofp: Ofp): RouteGeometry {
  const start = ofp.origin.position
  const startPoints = start ? [start] : []
  const fixesIn = ofp.route.fixes

  // No navlog: fall back to a direct line between the airports.
  if (fixesIn.length === 0) {
    const end = ofp.destination.position
    const points = unwrapLongitudes([...startPoints, ...(end ? [end] : [])])
    return {
      origin: start ? (points[0] ?? null) : null,
      destination: points.at(-1) ?? null,
      alternate: ofp.alternate?.position ?? null,
      fixes: [],
      lines: points.length === 2 ? [{ kind: 'enroute', points }] : [],
      bounds: points,
    }
  }

  const mainPoints = unwrapLongitudes([...startPoints, ...fixesIn.map((f) => f.position)])
  const fixes = withPositions(fixesIn, mainPoints, startPoints.length)

  const lines: RouteLine[] = []
  let previous: LatLon | undefined = start ? mainPoints[0] : undefined
  for (const fix of fixes) {
    const current = lines.at(-1)
    if (current && current.kind === fix.segment) {
      current.points.push(fix.position)
    } else {
      lines.push({ kind: fix.segment, points: previous ? [previous, fix.position] : [fix.position] })
    }
    previous = fix.position
  }

  const lastFix = fixes.at(-1)
  const destination =
    lastFix?.ident === ofp.destination.icao ? lastFix.position : (ofp.destination.position ?? null)

  // The alternate route starts at the destination.
  let alternate: LatLon | null = null
  if (ofp.route.alternateFixes.length > 0 && destination) {
    const altPoints = unwrapLongitudes([destination, ...ofp.route.alternateFixes.map((f) => f.position)])
    lines.push({ kind: 'alternate', points: altPoints })
    alternate = altPoints.at(-1) ?? null
  } else if (ofp.alternate?.position && destination) {
    alternate = unwrapLongitudes([destination, ofp.alternate.position])[1] ?? null
  }

  return {
    origin: start ? (mainPoints[0] ?? null) : null,
    destination,
    alternate,
    fixes,
    lines,
    bounds: lines.flatMap((line) => line.points),
  }
}
