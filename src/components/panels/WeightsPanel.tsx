import { PLACEHOLDER, formatNumber, formatPercent, formatWeight, percentOf } from '../../lib/format'
import type { Ofp } from '../../types/ofp'
import { Card } from '../ui/Card'
import { DataList } from '../ui/DataList'

export function WeightsPanel({ ofp }: { ofp: Ofp | null }) {
  const w = ofp?.weights
  const weight = (value: number | undefined) => (w && value !== undefined ? formatWeight(value, w.unit) : PLACEHOLDER)
  const ofMax = (value: number, max: number) => `${formatPercent(percentOf(value, max))} of maximum`


  const rows = w
    ? [
        ['Operating empty weight', w.oew, 'Aircraft basic weight'],
        ['Zero fuel weight', w.zfw, ofMax(w.zfw, w.maxZfw)],
        ['Take-off weight', w.tow, ofMax(w.tow, w.maxTow)],
        ['Landing weight', w.ldw, ofMax(w.ldw, w.maxLdw)],
        ['Maximum take-off weight', w.maxTow, 'Planning limit'],
        ['Maximum landing weight', w.maxLdw, 'Planning limit'],
      ] as const
    : []

  return (
    <>
      <div className="section-head">
        <h2>Weights & loading</h2>
        <span>{w ? `UNITS: ${w.unit.toUpperCase()}` : 'PLAN UNITS'}</span>
      </div>

      <Card title="Aircraft weights" meta={w ? w.unit.toUpperCase() : PLACEHOLDER} padded={false}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Weight</th>
                <th scope="col">Reference</th>
              </tr>
            </thead>
            <tbody>
              {w ? (
                rows.map(([label, value, reference]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    <td>{formatWeight(value, w.unit)}</td>
                    <td>{reference}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="empty">
                    Load an OFP to display weights.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="content-grid margin-top">
        <Card title="Payload" meta="LOAD SUMMARY">
          <DataList
            rows={[
              ['Passengers', w ? formatNumber(w.pax) : PLACEHOLDER],
              ['Passenger weight', weight(w?.passengerWeight)],
              ['Cargo', weight(w?.cargo)],
              ['Payload', weight(w?.payload)],
            ]}
          />
        </Card>
        <Card title="Weight limits" meta="AS FILED">
          <DataList
            rows={[
              ['Operating empty', weight(w?.oew)],
              ['Zero fuel weight', weight(w?.zfw)],
              ['Take-off weight', weight(w?.tow)],
              ['Landing weight', weight(w?.ldw)],
            ]}
          />
        </Card>
      </div>
    </>
  )
}
