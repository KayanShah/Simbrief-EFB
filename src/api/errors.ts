export type SimbriefErrorKind =
  // 400 = unknown id, or they just havent generated an ofp yet
  | 'not-found'
  | 'network'
  | 'timeout'
  | 'server'
  // 200 but not a usable OFP
  | 'invalid-response'

export class SimbriefError extends Error {
  readonly kind: SimbriefErrorKind

  constructor(kind: SimbriefErrorKind, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'SimbriefError'
    this.kind = kind
  }
}

export function toSimbriefError(error: unknown): SimbriefError {
  if (error instanceof SimbriefError) return error
  const message = error instanceof Error ? error.message : String(error)
  return new SimbriefError('invalid-response', message, { cause: error })
}

export interface ErrorCopy {
  title: string
  detail: string
}

export function describeError(error: SimbriefError, pilotId: string): ErrorCopy {
  switch (error.kind) {
    case 'not-found':
      return {
        title: 'No flight plan found',
        detail: `SimBrief has no flight plan for User ID ${pilotId}. Check the ID in your SimBrief account settings, or generate a flight in SimBrief and press Retry.`,
      }
    case 'network':
      return {
        title: "Can't reach SimBrief",
        detail: 'Check your internet connection and try again.',
      }
    case 'timeout':
      return {
        title: 'SimBrief is taking too long',
        detail: 'The request timed out. SimBrief may be busy, so try again in a moment.',
      }
    case 'server':
    case 'invalid-response':
      return {
        title: 'Something went wrong',
        detail: "SimBrief sent a response we couldn't read. Try again, or regenerate your flight plan.",
      }
  }
}
