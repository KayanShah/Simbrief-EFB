import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { useUtcClock } from '../../hooks/useUtcClock'
import { formatUtcClock } from '../../lib/format'

// clock is here so App doesnt re-render every second
export function TopLine({ ofpStatus }: { ofpStatus: string }) {
  const now = useUtcClock()
  const online = useOnlineStatus()

  return (
    <div className="topline">
      <div className="topline-left">
        <span>
          <i className={online ? 'live-dot' : 'live-dot is-offline'} aria-hidden="true" />
          {online ? 'EFB ONLINE' : 'EFB OFFLINE'}
        </span>
        <span>SIMULATOR FLIGHT BAG</span>
      </div>
      <div className="topline-right">
        <span>
          UTC{' '}
          <b className="utc">
            <time dateTime={now.toISOString()}>{formatUtcClock(now)}</time>
          </b>
        </span>
        <span role="status">{ofpStatus}</span>
      </div>
    </div>
  )
}
