import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo, useRef } from 'react'
import { formatAltitude } from '../../lib/format'
import { routeGeometry, type LineKind } from '../../lib/geo'
import type { LatLon, Ofp, RouteFix } from '../../types/ofp'

// dark grey canvas so it matches the rest of the page
// CARTO wanted an api key now so this is the free esri one
const ESRI_CANVAS = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas'
const BASE_TILES = `${ESRI_CANVAS}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`
const LABEL_TILES = `${ESRI_CANVAS}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`
const TILE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
const MAX_ZOOM = 16

// Magenta for the active route, like a nav display.
const LINE_COLORS: Record<LineKind, string> = {
  sid: '#0a8ea3',
  enroute: '#b04bc9',
  star: '#d98a00',
  alternate: '#7d8b98', // dashed
}

const toLeaflet = ({ lat, lon }: LatLon): L.LatLngTuple => [lat, lon]

// textContent rather than an HTML string, so API data can't inject markup.
function tooltip(...lines: string[]): HTMLElement {
  const el = document.createElement('div')
  lines.forEach((text, i) => {
    const line = document.createElement('div')
    line.textContent = text
    if (i === 0) line.style.fontWeight = '700'
    el.append(line)
  })
  return el
}

function fixTooltip(fix: RouteFix): HTMLElement {
  const label = fix.kind === 'pseudo' ? `${fix.ident} (computed)` : fix.ident
  const via = fix.via && fix.via !== 'DCT' ? `via ${fix.via}` : 'direct'
  return tooltip(label, `${via} · ${formatAltitude(fix.altitudeFt)}`)
}

export default function RouteMap({ ofp }: { ofp: Ofp }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const routeLayerRef = useRef<L.LayerGroup | null>(null)
  const geometry = useMemo(() => routeGeometry(ofp), [ofp])

  // Create the map once. Recreating it on every new OFP would reload the
  // tiles, and removing a map mid zoom-animation makes Leaflet throw.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // whole zoom only, fractional zoom leaves seams between tiles
    const map = L.map(container, { maxZoom: MAX_ZOOM })
    L.tileLayer(BASE_TILES, { attribution: TILE_ATTRIBUTION, maxZoom: MAX_ZOOM }).addTo(map)
    L.tileLayer(LABEL_TILES, { maxZoom: MAX_ZOOM }).addTo(map)
    mapRef.current = map
    routeLayerRef.current = L.layerGroup().addTo(map)

    return () => {
      map.stop()
      map.remove()
      mapRef.current = null
      routeLayerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = routeLayerRef.current
    if (!map || !layer || geometry.bounds.length === 0) return

    layer.clearLayers()

    for (const line of geometry.lines) {
      L.polyline(line.points.map(toLeaflet), {
        color: LINE_COLORS[line.kind],
        weight: line.kind === 'alternate' ? 2 : 3,
        dashArray: line.kind === 'alternate' ? '6 6' : undefined,
      }).addTo(layer)
    }

    // Airports get their own larger markers below.
    for (const fix of geometry.fixes) {
      if (fix.kind === 'airport') continue
      L.circleMarker(toLeaflet(fix.position), {
        radius: fix.kind === 'pseudo' ? 4 : 3,
        color: fix.kind === 'pseudo' ? '#1d2a36' : LINE_COLORS[fix.segment],
        fillColor: '#1a2430',
        fillOpacity: 1,
        weight: 2,
      })
        .bindTooltip(fixTooltip(fix), { className: 'efb-tooltip', direction: 'top' })
        .addTo(layer)
    }

    const airports: [LatLon | null, string, string][] = [
      [geometry.origin, ofp.origin.icao, LINE_COLORS.sid],
      [geometry.destination, ofp.destination.icao, LINE_COLORS.star],
      [geometry.alternate, ofp.alternate?.icao ?? '', LINE_COLORS.alternate],
    ]
    for (const [position, icao, color] of airports) {
      if (!position || !icao) continue
      L.circleMarker(toLeaflet(position), { radius: 6, color: '#0e151d', fillColor: color, fillOpacity: 1, weight: 2 })
        // 'auto' puts the label on the side facing the map centre, so labels
        // near the edge don't get cut off.
        .bindTooltip(tooltip(icao), {
          permanent: true,
          className: 'efb-tooltip efb-tooltip--airport',
          direction: 'auto',
        })
        .addTo(layer)
    }

    map.fitBounds(L.latLngBounds(geometry.bounds.map(toLeaflet)), { padding: [36, 36], animate: false })
  }, [geometry, ofp.origin.icao, ofp.destination.icao, ofp.alternate?.icao])

  return (
    <figure className="route-figure">
      <div
        ref={containerRef}
        className="route-map"
        role="img"
        aria-label={`Route map from ${ofp.origin.icao} to ${ofp.destination.icao}, ${ofp.route.fixes.length} waypoints`}
      />
      <figcaption className="map-legend">
        {ofp.route.sid && <Legend kind="sid" label={`SID ${ofp.route.sid}`} />}
        <Legend kind="enroute" label="En route" />
        {ofp.route.star && <Legend kind="star" label={`STAR ${ofp.route.star}`} />}
        {ofp.alternate && <Legend kind="alternate" label={`Alternate ${ofp.alternate.icao}`} dashed />}
      </figcaption>
    </figure>
  )
}

function Legend({ kind, label, dashed = false }: { kind: LineKind; label: string; dashed?: boolean }) {
  return (
    <span>
      <i aria-hidden="true" style={{ borderColor: LINE_COLORS[kind], borderTopStyle: dashed ? 'dashed' : 'solid' }} />
      {label}
    </span>
  )
}
