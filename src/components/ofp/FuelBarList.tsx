import type { FuelLine } from '../../lib/fuel'
import { formatWeight } from '../../lib/format'
import type { WeightUnit } from '../../types/ofp'

export function FuelBarList({ lines, unit }: { lines: FuelLine[]; unit: WeightUnit }) {
  return (
    <>
      {lines.map((line) => (

        <div className="fuel-item" key={line.key}>
          <div className="fuel-top">
            <span>{line.label}</span>
            <strong>{formatWeight(line.value, unit)}</strong>
          </div>
          <div className="fuel-track" aria-hidden="true">
            <div
              className={line.key === 'reserve' ? 'fuel-fill amber' : 'fuel-fill'}
              style={{ width: `${line.shareOfRamp}%` }}
            />
          </div>
        </div>
      ))}
    </>
  )
}
