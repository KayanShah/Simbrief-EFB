interface PilotChipProps {
  pilotId: string
  isLoading: boolean
  onRefresh: () => void
  onChange: () => void
}

export function PilotChip({ pilotId, isLoading, onRefresh, onChange }: PilotChipProps) {
  return (
    <div className="pilot-chip">
      <span className="pilot-chip-label">USER ID</span>
      <strong>{pilotId}</strong>
      <button
        className="chip-btn"
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        title="Fetch your latest OFP from SimBrief"
      >
        {isLoading ? 'Loading…' : 'Refresh'}
      </button>
      <button className="chip-btn" type="button" onClick={onChange} disabled={isLoading}>
        Change
      </button>
    </div>
  )
}
