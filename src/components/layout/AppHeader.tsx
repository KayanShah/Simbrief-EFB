import type { ReactNode } from 'react'
import { formatUtcDateTime } from '../../lib/format'

interface AppHeaderProps {
  generatedAt: Date | null
  pilot?: ReactNode
}

export function AppHeader({ generatedAt, pilot }: AppHeaderProps) {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-title">FLIGHT DECK</div>
        <div className="brand-sub">ELECTRONIC FLIGHT BAG</div>
      </div>
      <div className="header-right">
        {pilot}
        <div className="header-meta">
          DATA SOURCE&nbsp; <strong>SIMBRIEF</strong>
          <br />
          OFP GENERATED &nbsp; <strong>{formatUtcDateTime(generatedAt)}</strong>
        </div>
      </div>
    </header>
  )
}
