import { PLACEHOLDER, formatDuration, formatFlightLevel, formatNumber } from '../../lib/format'
import type { Ofp } from '../../types/ofp'

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </div>
  )
}

export function OverviewStats({ ofp }: { ofp: Ofp | null }) {
  const cruise = ofp?.cruise
  const stepsUp = cruise && cruise.maxAltitudeFt > cruise.initialAltitudeFt

  return (
    <div className="stats">
      <Stat
        label="Estimated en route"
        value={ofp ? formatDuration(ofp.times.enrouteSec) : PLACEHOLDER}
        note="HH:MM"
      />

      <Stat
        label="Cruise altitude"
        value={cruise ? formatFlightLevel(cruise.initialAltitudeFt) : PLACEHOLDER}
        note={stepsUp ? `Initial · steps to ${formatFlightLevel(cruise.maxAltitudeFt)}` : 'Flight level'}
      />
      <Stat
        label="Route distance"
        value={ofp ? formatNumber(ofp.route.distanceNm) : PLACEHOLDER}
        note="Nautical miles"
      />
      <Stat
        label="Ramp fuel"
        value={ofp ? formatNumber(ofp.fuel.ramp) : PLACEHOLDER}
        note={ofp ? `${ofp.fuel.unit} · planned ramp fuel` : 'Plan units'}
      />
    </div>
  )
}
