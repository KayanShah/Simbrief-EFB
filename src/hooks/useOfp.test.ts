import { act, renderHook, waitFor } from '@testing-library/react'
import { SimbriefError } from '../api/errors'
import { fetchOfp } from '../api/simbrief'
import fullFixture from '../api/__fixtures__/ofp.full.json'
import { mapOfp } from '../lib/mapOfp'
import { loadLastPilotId } from '../lib/storage'
import type { Ofp } from '../types/ofp'
import type { RawOfp } from '../types/simbrief.raw'
import { useOfp } from './useOfp'

vi.mock('../api/simbrief', () => ({ fetchOfp: vi.fn() }))
const fetchOfpMock = vi.mocked(fetchOfp)

const ofp = mapOfp(fullFixture as RawOfp)

/** resolve this ourselves so we can test stale responses */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

beforeEach(() => {
  fetchOfpMock.mockReset()
  localStorage.clear()
})

describe('useOfp', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useOfp())
    expect(result.current.state).toEqual({ status: 'idle' })
  })

  it('goes loading -> success and remembers the User ID', async () => {
    fetchOfpMock.mockResolvedValue(ofp)
    const { result } = renderHook(() => useOfp())

    act(() => void result.current.load('1381511'))
    expect(result.current.state).toEqual({ status: 'loading', pilotId: '1381511' })

    await waitFor(() => expect(result.current.state.status).toBe('success'))
    expect(result.current.state).toMatchObject({ pilotId: '1381511', data: ofp })
    expect(loadLastPilotId()).toBe('1381511')
  })

  it('goes loading -> error and does not remember the User ID', async () => {
    fetchOfpMock.mockRejectedValue(new SimbriefError('not-found', 'Unknown UserID'))
    const { result } = renderHook(() => useOfp())

    act(() => void result.current.load('999'))

    await waitFor(() => expect(result.current.state.status).toBe('error'))
    const { state } = result.current
    expect(state.status === 'error' && state.error.kind).toBe('not-found')
    expect(loadLastPilotId()).toBeNull()
  })

  it('ignores a slow earlier response once a newer request has started', async () => {
    const first = deferred<Ofp>()
    const second = deferred<Ofp>()
    fetchOfpMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { result } = renderHook(() => useOfp())

    act(() => void result.current.load('111'))
    act(() => void result.current.load('222'))

    // The newer request finishes first, then the stale one arrives late.
    await act(async () => second.resolve(ofp))
    await act(async () => first.resolve({ ...ofp, flight: { ...ofp.flight, callsign: 'STALE' } }))

    expect(result.current.state).toMatchObject({ status: 'success', pilotId: '222' })
    expect(result.current.state.status === 'success' && result.current.state.data.flight.callsign).toBe('BAW199')
  })

  it('reload() fetches the last User ID again', async () => {
    fetchOfpMock.mockRejectedValueOnce(new SimbriefError('network', 'offline')).mockResolvedValueOnce(ofp)
    const { result } = renderHook(() => useOfp())

    act(() => void result.current.load('1381511'))
    await waitFor(() => expect(result.current.state.status).toBe('error'))

    act(() => result.current.reload())
    await waitFor(() => expect(result.current.state.status).toBe('success'))
    expect(fetchOfpMock).toHaveBeenLastCalledWith('1381511', expect.any(AbortSignal))
  })

  it('clear() returns to idle, forgets the ID and ignores a request in flight', async () => {
    const pending = deferred<Ofp>()
    fetchOfpMock.mockResolvedValueOnce(ofp).mockReturnValueOnce(pending.promise)
    const { result } = renderHook(() => useOfp())

    act(() => void result.current.load('1381511'))
    await waitFor(() => expect(result.current.state.status).toBe('success'))
    act(() => void result.current.load('1381511'))
    act(() => result.current.clear())
    await act(async () => pending.resolve(ofp))

    expect(result.current.state).toEqual({ status: 'idle' })
    expect(loadLastPilotId()).toBeNull()
  })

  it('aborts the request in flight on unmount', () => {
    fetchOfpMock.mockReturnValue(new Promise(() => {}))
    const { result, unmount } = renderHook(() => useOfp())

    act(() => void result.current.load('1381511'))
    const signal = fetchOfpMock.mock.calls[0]?.[1]
    unmount()
    expect(signal?.aborted).toBe(true)
  })
})
