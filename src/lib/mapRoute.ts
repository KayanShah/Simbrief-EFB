import type { FixKind, RouteFix, RouteSegment } from '../types/ofp'
import type { EmptyNode, RawNavlog } from '../types/simbrief.raw'
import { asArray, latLon, num, str } from './raw'

const FIX_KINDS: Record<string, FixKind> = {
  apt: 'airport',
  vor: 'navaid',
  ndb: 'navaid',
  wpt: 'waypoint',
  ltlg: 'pseudo', // toc / tod etc
}

interface Procedures {
  sid: string | null
  star: string | null
}

// use the procedure name first. the is_sid_star flag is missing on the last
// fix of a SID/STAR (eg DET at the end of DET1J) so its only a fallback.
function segmentOf(
  via: string | null,
  flaggedSidStar: boolean,
  { sid, star }: Procedures,
  seenEnroute: boolean,
): RouteSegment {
  if (via !== null && via === sid) return 'sid'
  if (via !== null && via === star) return 'star'
  if (flaggedSidStar) return seenEnroute ? 'star' : 'sid'
  return 'enroute'
}

export function mapFixes(
  navlog: RawNavlog | EmptyNode | undefined,
  procedures: Procedures = { sid: null, star: null },
): RouteFix[] {
  const rawFixes = asArray((navlog as RawNavlog | undefined)?.fix)
  const fixes: RouteFix[] = []
  let seenEnroute = false

  for (const raw of rawFixes) {
    const ident = str(raw.ident)
    const position = latLon(raw.pos_lat, raw.pos_long)
    if (ident === null || position === null) continue

    const via = str(raw.via_airway)
    const segment = segmentOf(via, str(raw.is_sid_star) === '1', procedures, seenEnroute)
    if (segment === 'enroute') seenEnroute = true

    fixes.push({
      ident,
      name: str(raw.name),
      kind: FIX_KINDS[str(raw.type)?.toLowerCase() ?? ''] ?? 'waypoint',
      position,
      segment,
      via,
      altitudeFt: num(raw.altitude_feet),
    })
  }

  return fixes
}
