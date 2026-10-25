import { Suspense, lazy, useRef } from 'react'
import { PLACEHOLDER, formatNumber, formatUtcTime } from '../../lib/format'
import type { Ofp } from '../../types/ofp'
import { CopyRouteButton } from '../ofp/CopyRouteButton'
import { Card } from '../ui/Card'
import { DataList } from '../ui/DataList'

// dont pull leaflet until they actually open this tab
const RouteMap = lazy(() => import('../ofp/RouteMap'))

export function RoutePanel({ ofp }: { ofp: Ofp | null }) {
  const routeTextRef = useRef<HTMLDivElement>(null)
  const route = ofp?.route

  return (
    <>
      <div className="section-head">
        <h2>Route & navigation</h2>
        <span>{route ? `${route.fixes.length} WAYPOINTS` : 'ROUTE STRING'}</span>
      </div>

      <Card title="Route map" meta={ofp ? `${ofp.origin.icao} → ${ofp.destination.icao}` : PLACEHOLDER}>
        {ofp ? (
          <Suspense fallback={<div className="route-map" />}>
            <RouteMap ofp={ofp} />
          </Suspense>
        ) : (
          <div className="empty">Load an OFP to plot the route.</div>
        )}
      </Card>

      <Card
        className="margin-top"
        title="Filed route"
        meta={route ? `DISTANCE ${formatNumber(route.distanceNm)} NM` : 'DISTANCE —'}
      >
        <div className="route-string" ref={routeTextRef}>
          {route?.text || 'Load an OFP to display the filed route.'}
        </div>
        <div className="copy-row">
          <CopyRouteButton text={route?.text ?? ''} fallbackTarget={routeTextRef} />
        </div>
      </Card>

      <div className="content-grid margin-top">
        <Card title="Departure" meta={ofp?.origin.icao ?? '----'}>
          <DataList
            rows={[
              ['Airport', ofp?.origin.name || PLACEHOLDER],
              ['ICAO', ofp?.origin.icao ?? PLACEHOLDER],
              ['Runway', ofp?.origin.runway ?? PLACEHOLDER],
              ['SID', route?.sid ?? PLACEHOLDER],
              ['Scheduled off', formatUtcTime(ofp?.times.scheduledOut ?? null)],
            ]}
          />
        </Card>
        <Card title="Destination" meta={ofp?.destination.icao ?? '----'}>
          <DataList
            rows={[
              ['Airport', ofp?.destination.name || PLACEHOLDER],
              ['ICAO', ofp?.destination.icao ?? PLACEHOLDER],
              ['Runway', ofp?.destination.runway ?? PLACEHOLDER],
              ['STAR', route?.star ?? PLACEHOLDER],
              ['Scheduled on', formatUtcTime(ofp?.times.scheduledIn ?? null)],
              ['Alternate', ofp?.alternate ? `${ofp.alternate.icao} · ${ofp.alternate.name}` : PLACEHOLDER],
            ]}
          />
        </Card>
      </div>
    </>
  )
}
