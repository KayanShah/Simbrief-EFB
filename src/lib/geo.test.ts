import fullFixture from '../api/__fixtures__/ofp.full.json'
import type { RawOfp } from '../types/simbrief.raw'
import { routeGeometry, unwrapLongitudes } from './geo'
import { mapOfp } from './mapOfp'

const ofp = mapOfp(fullFixture as RawOfp)

describe('routeGeometry — BAW199', () => {
  // real london-mumbai plan from the fixture
  const geometry = routeGeometry(ofp)

  it('starts at the origin airport and ends at the destination', () => {
    expect(geometry.origin).toEqual({ lat: 51.4775, lon: -0.461389 })
    expect(geometry.lines[0]?.points[0]).toEqual(geometry.origin)
    expect(geometry.destination).toEqual({ lat: 19.091667, lon: 72.866111 })
  })

  it('draws SID, en route, STAR, then the alternate, joined end to end', () => {
    expect(geometry.lines.map((l) => l.kind)).toEqual(['sid', 'enroute', 'star', 'alternate'])
    for (let i = 1; i < geometry.lines.length; i++) {
      expect(geometry.lines[i]?.points[0]).toEqual(geometry.lines[i - 1]?.points.at(-1))
    }
  })

  it('fits the view around the whole route, including the alternate', () => {
    expect(geometry.bounds).toContainEqual(geometry.origin)
    expect(geometry.bounds).toContainEqual(geometry.destination)
    expect(geometry.bounds).toContainEqual(geometry.alternate)
  })

  it('falls back to a direct line when there is no navlog', () => {
    const direct = routeGeometry({ ...ofp, route: { ...ofp.route, fixes: [], alternateFixes: [] } })
    expect(direct.lines).toEqual([{ kind: 'enroute', points: [direct.origin, direct.destination] }])
  })
})

describe('unwrapLongitudes', () => {
  it('leaves routes that do not cross the antimeridian unchanged', () => {
    const route = [
      { lat: 51.5, lon: -0.4 },
      { lat: 19.1, lon: 72.9 },
    ]
    expect(unwrapLongitudes(route)).toEqual(route)
  })

  it('keeps an eastbound Pacific crossing continuous (Tokyo -> LA)', () => {
    const lons = unwrapLongitudes([
      { lat: 35.5, lon: 139.8 },
      { lat: 45, lon: 175 },
      { lat: 48, lon: -170 },
      { lat: 33.9, lon: -118.4 },
    ]).map((p) => p.lon)
    expect(lons).toEqual([139.8, 175, 190, 241.6])
  })

  it('keeps a westbound Pacific crossing continuous (LA -> Tokyo)', () => {
    const lons = unwrapLongitudes([
      { lat: 33.9, lon: -118.4 },
      { lat: 48, lon: -170 },
      { lat: 45, lon: 175 },
    ]).map((p) => p.lon)
    expect(lons).toEqual([-118.4, -170, -185])
  })

  it('handles an empty route', () => {
    expect(unwrapLongitudes([])).toEqual([])
  })
})
