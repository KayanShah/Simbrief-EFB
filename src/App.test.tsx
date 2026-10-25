import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import errorFixture from './api/__fixtures__/error.unknown-user.json'
import fullFixture from './api/__fixtures__/ofp.full.json'
import App from './App'

// leaflet + lottie want a real browser, stub them here
vi.mock('./components/ofp/RouteMap', () => ({ default: () => <div data-testid="route-map" /> }))
vi.mock('./components/states/FlightAnimation', () => ({ default: () => null }))

const fetchMock = vi.fn<typeof fetch>()

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const respondWith = (body: unknown, status = 200) => fetchMock.mockImplementation(async () => json(body, status))

beforeEach(() => {
  localStorage.clear()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function loadPilot(id: string) {
  const user = userEvent.setup()
  render(<App />)
  await user.type(screen.getByLabelText(/user id/i), id)
  await user.click(screen.getByRole('button', { name: /load ofp/i }))
  return user
}

const loadForm = () => screen.queryByRole('form', { name: /load flight plan/i })

describe('App', () => {
  it('loads a flight plan for a User ID', async () => {
    respondWith(fullFixture)
    await loadPilot('1381511')

    expect(await screen.findByText('EGLL')).toBeInTheDocument()
    expect(screen.getByText('VABB')).toBeInTheDocument()
    expect(screen.getAllByText('BAW199').length).toBeGreaterThan(0)

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(url.searchParams.get('userid')).toBe('1381511')
  })

  it('loads the remembered User ID straight away', async () => {
    localStorage.setItem('simbrief-efb:last-pilot-id', '1381511')
    respondWith(fullFixture)
    render(<App />)

    expect(await screen.findByText('EGLL')).toBeInTheDocument()
    expect(loadForm()).not.toBeInTheDocument()
  })

  it('rejects a non-numeric ID without calling SimBrief', async () => {
    await loadPilot('abc')

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a numeric User ID between 1 and 7 digits.')
    expect(screen.getByLabelText(/user id/i)).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows "No flight plan found", keeps the form open, and Retry works once a plan exists', async () => {
    fetchMock.mockImplementationOnce(async () => json(errorFixture, 400)).mockImplementation(async () => json(fullFixture))
    const user = await loadPilot('1381511')

    expect(await screen.findByText('No flight plan found.')).toBeInTheDocument()
    expect(loadForm()).toBeInTheDocument()

    // generate a plan in simbrief then retry
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('EGLL')).toBeInTheDocument()
  })

  it('shows the loader, skeleton cards and disabled buttons while fetching', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))
    await loadPilot('1381511')

    expect(await screen.findByText('Loading flight plan for 1381511…')).toBeInTheDocument()
    expect(document.querySelectorAll('.skeleton-card').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Loading…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Change' })).toBeDisabled()
  })

  it('offers Retry after a network failure, and Retry loads the plan', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockImplementation(async () => json(fullFixture))
    const user = await loadPilot('1381511')

    expect(await screen.findByText("Can't reach SimBrief.")).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('EGLL')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('collapses the form into the User ID chip, and Change / Cancel work', async () => {
    respondWith(fullFixture)
    const user = await loadPilot('1381511')
    await screen.findByText('EGLL')

    expect(loadForm()).not.toBeInTheDocument()
    expect(screen.getByText('USER ID').parentElement).toHaveTextContent('1381511')

    await user.click(screen.getByRole('button', { name: 'Change' }))
    expect(loadForm()).toBeInTheDocument()
    expect(screen.getByLabelText(/user id/i)).toHaveFocus()
    expect(screen.getByLabelText(/user id/i)).toHaveValue('1381511')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(loadForm()).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument()
  })

  it('switches between tabs by click and arrow keys', async () => {
    respondWith(fullFixture)
    const user = await loadPilot('1381511')
    await screen.findByText('EGLL')

    await user.click(screen.getByRole('tab', { name: 'Route' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Route & navigation')
    expect(screen.getByRole('tab', { name: 'Route' })).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByTestId('route-map')).toBeInTheDocument()
    expect(screen.getByText(/^DET1J DET L6 DVR/)).toBeInTheDocument()

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('tab', { name: 'Fuel' })).toHaveFocus()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Fuel planning')
    const table = screen.getByRole('table')
    expect(within(table).getByText('94,180 kg')).toBeInTheDocument()
  })

  it('Clear plan goes back to the empty form and forgets the ID', async () => {
    respondWith(fullFixture)
    const user = await loadPilot('1381511')
    await screen.findByText('EGLL')

    await user.click(screen.getByRole('button', { name: 'Clear plan' }))

    await waitFor(() => expect(loadForm()).toBeInTheDocument())
    expect(screen.queryByText('EGLL')).not.toBeInTheDocument()
    expect(localStorage.getItem('simbrief-efb:last-pilot-id')).toBeNull()
  })
})
