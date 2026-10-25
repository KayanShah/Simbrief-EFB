import type { ReactNode } from 'react'

interface CardProps {
  title: string
  meta?: ReactNode
  padded?: boolean // false if its a table, so it can go edge to edge
  className?: string
  children: ReactNode
}

export function Card({ title, meta, padded = true, className, children }: CardProps) {
  return (
    <article className={className ? `card ${className}` : 'card'}>
      <div className="card-head">
        <h3>{title}</h3>
        {meta !== undefined && <span>{meta}</span>}
      </div>
      {padded ? <div className="card-body">{children}</div> : children}
    </article>
  )
}
