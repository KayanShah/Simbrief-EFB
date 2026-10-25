import errorFixture from './__fixtures__/error.unknown-user.json'
import fullFixture from './__fixtures__/ofp.full.json'
import { SimbriefError } from './errors'
import { REQUEST_TIMEOUT_MS, fetchOfp } from './simbrief'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  fetchMock.mockReset()
})

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

async function expectKind(promise: Promise<unknown>, kind: SimbriefError['kind']) {
  const error = await promise.catch((e: unknown) => e)
  expect(error).toBeInstanceOf(SimbriefError)
  expect((error as SimbriefError).kind).toBe(kind)
  return error as SimbriefError
}

describe('fetchOfp', () => {
  // these hit a mocked fetch, not the live api
  it('requests the JSON endpoint for the given User ID', async () => {
    fetchMock.mockResolvedValue(jsonResponse(fullFixture))
    await fetchOfp('1381511')

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(url.origin + url.pathname).toBe('https://www.simbrief.com/api/xml.fetcher.php')
    expect(url.searchParams.get('userid')).toBe('1381511')
    expect(url.searchParams.get('json')).toBe('1')
  })

  it('returns the mapped OFP on success', async () => {
    fetchMock.mockResolvedValue(jsonResponse(fullFixture))
    const ofp = await fetchOfp('1381511')
    expect(ofp.flight.callsign).toBe('BAW199')
    expect(ofp.origin.icao).toBe('EGLL')
  })

  it('maps HTTP 400 to not-found with SimBrief’s message, minus the "Error:" prefix', async () => {
    fetchMock.mockResolvedValue(jsonResponse(errorFixture, 400))
    const error = await expectKind(fetchOfp('0000000'), 'not-found')
    expect(error.message).toBe('Unknown UserID')
  })

  it('maps a failed request to network', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expectKind(fetchOfp('1381511'), 'network')
  })

  it('maps 5xx to server', async () => {
    fetchMock.mockResolvedValue(new Response('Bad gateway', { status: 502 }))
    await expectKind(fetchOfp('1381511'), 'server')
  })

  it('maps a 200 that is not a successful OFP to invalid-response', async () => {
    fetchMock.mockResolvedValue(new Response('<html>maintenance</html>', { status: 200 }))
    await expectKind(fetchOfp('1381511'), 'invalid-response')
  })

  it('maps an OFP missing required fields to invalid-response', async () => {
    const broken = { ...fullFixture, origin: { ...fullFixture.origin, icao_code: {} } }
    fetchMock.mockResolvedValue(jsonResponse(broken))
    await expectKind(fetchOfp('1381511'), 'invalid-response')
  })

  it('times out when SimBrief does not answer', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
    )
    const result = fetchOfp('1381511')
    vi.advanceTimersByTime(REQUEST_TIMEOUT_MS)
    await expectKind(result, 'timeout')
  })

  it('rethrows (rather than wrapping) when the caller aborts', async () => {
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
    )
    const controller = new AbortController()
    const result = fetchOfp('1381511', controller.signal)
    controller.abort()
    const error = await result.catch((e: unknown) => e)
    expect(error).not.toBeInstanceOf(SimbriefError)
  })
})
