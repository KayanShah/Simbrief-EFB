import { PLACEHOLDER, formatUtcDate, formatUtcTime } from '../../lib/format'
import type { Airport, Ofp } from '../../types/ofp'

function AirportBlock({
  airport,
  fallbackName,
  timeLabel,
  time,
}: {
  airport: Airport | undefined
  fallbackName: string
  timeLabel: string
  time: Date | null | undefined
}) {
  return (
    <div className="airport">
      <div className="icao">{airport?.icao ?? '----'}</div>
      <div className="airport-name" title={airport?.name}>
        {airport?.name || fallbackName}
      </div>
      <div className="airport-time">
        {timeLabel} {time ? formatUtcTime(time) : PLACEHOLDER}
      </div>
    </div>
  )
}

export function FlightStrip({ ofp }: { ofp: Ofp | null }) {
  const aircraftLine = ofp
    ? [ofp.aircraft.icao, ofp.aircraft.name, ofp.aircraft.registration && `REG ${ofp.aircraft.registration}`]
        .filter(Boolean)
        .join(' · ')
    : 'Load an OFP to display aircraft information'



  return (
    <section className="flight-strip" aria-label="Flight summary">
      <div className="flight-main">
        <div className="flight-top">
          <div>
            <div className="callsign">{ofp?.flight.callsign ?? PLACEHOLDER}</div>
            <div className="aircraft-line">{aircraftLine}</div>
          </div>
          <span className={ofp ? 'status-badge' : 'status-badge is-idle'}>{ofp ? 'OFP loaded' : 'Awaiting OFP'}</span>
        </div>
        <div className="airports">
          <AirportBlock
            airport={ofp?.origin}
            fallbackName="Departure airport"
            timeLabel="OFF BLOCK"
            time={ofp?.times.estimatedOut}
          />
          <div
            className="route-line"
            role="img"
            aria-label={ofp ? `Planned route from ${ofp.origin.icao} to ${ofp.destination.icao}` : 'Planned route'}
          >
            <span className="plane" aria-hidden="true">
              ✈
            </span>
          </div>
          <AirportBlock
            airport={ofp?.destination}
            fallbackName="Arrival airport"
            timeLabel="ON BLOCK"
            time={ofp?.times.estimatedIn}
          />
        </div>
      </div>
      <div className="flight-date">
        <div>
          <div className="small-label">Flight date</div>
          <div className="date-value">{formatUtcDate(ofp?.times.scheduledOut ?? null)}</div>
        </div>
        <div className="date-sep" />
        <div>
          <div className="small-label">Scheduled</div>
          <div className="date-value">
            {formatUtcTime(ofp?.times.scheduledOut ?? null)} / {formatUtcTime(ofp?.times.scheduledIn ?? null)}
          </div>
        </div>
      </div>
    </section>
  )
}
