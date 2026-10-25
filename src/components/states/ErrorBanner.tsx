import { describeError, type SimbriefError } from '../../api/errors'

interface ErrorBannerProps {
  error: SimbriefError
  pilotId: string
  onRetry: () => void
}

export function ErrorBanner({ error, pilotId, onRetry }: ErrorBannerProps) {
  const { title, detail } = describeError(error, pilotId)

  return (

    <div className="error-banner" role="alert">
      <strong>{title}.</strong>
      <span>{detail}</span>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}
