// rough stand-ins so the layout doesnt jump around while fetching
export function LoadingSkeletons() {
  return (
    <div aria-hidden="true">
      <div className="skeleton-strip">
        <div className="skeleton-card skeleton-card--hero">
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--short" />
          <div className="skeleton-row">
            <div className="skeleton skeleton--code" />
            <div className="skeleton skeleton--code" />
          </div>
        </div>
        <div className="skeleton-card">
          <div className="skeleton skeleton--short" />
          <div className="skeleton" />
          <div className="skeleton skeleton--short" />
          <div className="skeleton" />
        </div>
      </div>

      <div className="skeleton-stats">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="skeleton-card" key={i}>
            <div className="skeleton skeleton--short" />
            <div className="skeleton skeleton--value" />
          </div>
        ))}
      </div>
    </div>
  )
}
