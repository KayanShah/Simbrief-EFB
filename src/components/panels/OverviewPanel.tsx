import { fuelBreakdown } from '../../lib/fuel'
import { PLACEHOLDER, formatUtcDateTime, formatUtcTime } from '../../lib/format'
import type { Ofp } from '../../types/ofp'
import { FlightStrip } from '../ofp/FlightStrip'
import { FuelBarList } from '../ofp/FuelBarList'
import { OverviewStats } from '../ofp/OverviewStats'
import { Card } from '../ui/Card'
import { DataList } from '../ui/DataList'

export function OverviewPanel({ ofp }: { ofp: Ofp | null }) {
  return (
    <>
      <FlightStrip ofp={ofp} />
      <OverviewStats ofp={ofp} />

      <div className="section-head">
        <h2>Flight details</h2>
        <span>{ofp ? `OFP ${formatUtcDateTime(ofp.meta.generatedAt)}` : 'AWAITING FLIGHT PLAN'}</span>
      </div>

      <div className="content-grid">
        <Card title="Aircraft & schedule">
          <DataList
            rows={[
              ['Aircraft type', ofp?.aircraft.icao ?? PLACEHOLDER],
              ['Aircraft name', ofp?.aircraft.name || PLACEHOLDER],
              ['Registration', ofp?.aircraft.registration ?? PLACEHOLDER],
              ['Flight number', ofp ? `${ofp.flight.airline ?? ''}${ofp.flight.number}` : PLACEHOLDER],
              [
                'Off / on block',
                `${formatUtcTime(ofp?.times.estimatedOut ?? null)} / ${formatUtcTime(ofp?.times.estimatedIn ?? null)}`,
              ],
              ['OFP generated', formatUtcDateTime(ofp?.meta.generatedAt ?? null)],
            ]}
          />
        </Card>
        <Card title="Fuel summary" meta={ofp ? ofp.fuel.unit.toUpperCase() : PLACEHOLDER}>
          {ofp ? (
            <FuelBarList lines={fuelBreakdown(ofp.fuel, ['ramp', 'trip', 'reserve'])} unit={ofp.fuel.unit} />
          ) : (
            <div className="empty">Fuel figures will appear after an OFP is loaded.</div>
          )}
        </Card>
      </div>
    </>
  )
}
