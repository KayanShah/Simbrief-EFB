import { fuelBreakdown } from '../../lib/fuel'
import { PLACEHOLDER, formatPercent, formatWeight } from '../../lib/format'
import type { Ofp } from '../../types/ofp'
import { FuelBarList } from '../ofp/FuelBarList'
import { Card } from '../ui/Card'
import { DataList } from '../ui/DataList'

export function FuelPanel({ ofp }: { ofp: Ofp | null }) {
  const fuel = ofp?.fuel
  const lines = fuel ? fuelBreakdown(fuel) : []
  const unitLabel = fuel ? fuel.unit.toUpperCase() : PLACEHOLDER


  return (
    <>
      <div className="section-head">
        <h2>Fuel planning</h2>
        <span>{fuel ? `UNITS: ${unitLabel}` : 'PLAN UNITS'}</span>
      </div>

      <Card title="Fuel breakdown" padded={false}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Planned quantity</th>
                <th scope="col">Share of ramp</th>
              </tr>
            </thead>
            <tbody>
              {fuel ? (
                lines.map((line) => (
                  <tr key={line.key}>
                    <td>{line.label}</td>
                    <td>{formatWeight(line.value, fuel.unit)}</td>
                    <td>{formatPercent(line.shareOfRamp)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="empty">
                    Load an OFP to display fuel figures.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="content-grid margin-top">
        <Card title="Fuel bar">
          {fuel ? (
            <FuelBarList lines={lines} unit={fuel.unit} />
          ) : (
            <div className="empty">Load an OFP to display fuel bars.</div>
          )}
        </Card>
        <Card title="Fuel notes">
          <DataList
            rows={[
              ['Ramp fuel', fuel ? formatWeight(fuel.ramp, fuel.unit) : PLACEHOLDER],
              ['Taxi fuel', fuel ? formatWeight(fuel.taxi, fuel.unit) : PLACEHOLDER],
              ['Trip fuel', fuel ? formatWeight(fuel.trip, fuel.unit) : PLACEHOLDER],
              ['Take-off fuel', fuel ? formatWeight(fuel.takeoff, fuel.unit) : PLACEHOLDER],
              ['Landing fuel', fuel ? formatWeight(fuel.landing, fuel.unit) : PLACEHOLDER],
            ]}
          />
        </Card>
      </div>
    </>
  )
}
