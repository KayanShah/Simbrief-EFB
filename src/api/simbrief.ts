import { mapOfp } from '../lib/mapOfp'
import type { Ofp } from '../types/ofp'
import type { RawErrorResponse, RawOfp } from '../types/simbrief.raw'
import { SimbriefError } from './errors'

const ENDPOINT = 'https://www.simbrief.com/api/xml.fetcher.php'

export const REQUEST_TIMEOUT_MS = 15_000

// cors is open on this endpoint so we just call it from the browser
export async function fetchOfp(pilotId: string, signal?: AbortSignal): Promise<Ofp> {
  const url = new URL(ENDPOINT)
  url.searchParams.set('userid', pilotId)
  url.searchParams.set('json', '1')

  const request = withTimeout(signal, REQUEST_TIMEOUT_MS)
  try {
    let response: Response
    try {
      response = await fetch(url, { signal: request.signal })
    } catch (error) {
      if (request.timedOut()) throw new SimbriefError('timeout', 'Request timed out', { cause: error })
      if (signal?.aborted) throw error
      throw new SimbriefError('network', 'Network request failed', { cause: error })
    }

    const body: unknown = await response.json().catch(() => null)
    if (request.timedOut()) throw new SimbriefError('timeout', 'Response timed out')

    if (response.status === 400) {
      throw new SimbriefError('not-found', simbriefMessage(body) ?? 'Unknown User ID')
    }
    if (!response.ok) {
      throw new SimbriefError('server', `Unexpected HTTP ${response.status}`)
    }
    if (!isOfpResponse(body)) {
      throw new SimbriefError('invalid-response', 'Response is not a successful OFP')
    }

    try {
      return mapOfp(body)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not read OFP'
      throw new SimbriefError('invalid-response', message, { cause: error })
    }
  } finally {
    request.cleanup()
  }
}

function isOfpResponse(body: unknown): body is RawOfp {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as RawOfp).fetch?.status === 'Success'
  )
}

/** "Error: Unknown UserID" -> "Unknown UserID" */
function simbriefMessage(body: unknown): string | null {
  const status = (body as RawErrorResponse | null)?.fetch?.status
  return typeof status === 'string' ? status.replace(/^Error:\s*/i, '') : null
}

// not using AbortSignal.any, need to know if WE timed it out
function withTimeout(signal: AbortSignal | undefined, ms: number) {
  const controller = new AbortController()
  let timedOut = false

  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, ms)
  const forwardAbort = () => controller.abort(signal?.reason)

  if (signal?.aborted) forwardAbort()
  else signal?.addEventListener('abort', forwardAbort, { once: true })

  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    cleanup: () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', forwardAbort)
    },
  }
}
