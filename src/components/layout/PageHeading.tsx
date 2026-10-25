interface PageHeadingProps {
  title: string
  canClear: boolean
  onClear: () => void
}

export function PageHeading({ title, canClear, onClear }: PageHeadingProps) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
      </div>

      <button
        className="btn btn-quiet"
        type="button"
        title="Clear loaded flight plan"
        onClick={onClear}
        disabled={!canClear}
      >
        Clear plan
      </button>
    </div>
  )
}
