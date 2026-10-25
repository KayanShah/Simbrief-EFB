import type { ReactNode } from 'react'

export type DataRows = readonly (readonly [string, ReactNode])[]

export function DataList({ rows }: { rows: DataRows }) {
  return (
    <dl className="data-list">
      {rows.map(([label, value]) => (
        <div className="data-row" key={label}>

          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
