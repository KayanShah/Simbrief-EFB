import {
  PLACEHOLDER,
  formatAltitude,
  formatDistance,
  formatDuration,
  formatFlightLevel,
  formatNumber,
  formatPercent,
  formatUtcClock,
  formatUtcDate,
  formatUtcDateTime,
  formatUtcTime,
  formatWeight,
  percentOf,
} from './format'

describe('formatDuration', () => {
  it.each([
    [30259, '08:24'],
    [3612, '01:00'],
    [0, '00:00'],
    [59 * 60 + 31, '01:00'], // rounds up into the next hour
    [45 * 60, '00:45'],
    [44700, '12:25'],
  ])('%i seconds -> %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected)
  })

  it.each([NaN, -60, Infinity])('returns a placeholder for %s', (bad) => {
    expect(formatDuration(bad)).toBe(PLACEHOLDER)
  })
})

describe('formatFlightLevel', () => {
  it.each([
    [37000, 'FL370'],
    [23000, 'FL230'],
    [5000, 'FL050'],
    [36950, 'FL370'],
  ])('%i ft -> %s', (feet, expected) => {
    expect(formatFlightLevel(feet)).toBe(expected)
  })

  it('returns a placeholder for 0 or invalid values', () => {
    expect(formatFlightLevel(0)).toBe(PLACEHOLDER)
    expect(formatFlightLevel(NaN)).toBe(PLACEHOLDER)
  })
})

describe('formatAltitude', () => {
  it('shows feet low down and flight levels higher up', () => {
    expect(formatAltitude(6100)).toBe('6,100 ft')
    expect(formatAltitude(17999)).toBe('17,999 ft')
    expect(formatAltitude(18000)).toBe('FL180')
    expect(formatAltitude(-5)).toBe(PLACEHOLDER)
  })
})

describe('number, weight and distance', () => {
  it('groups thousands with a fixed locale', () => {
    expect(formatNumber(1234567.6)).toBe('1,234,568')
    expect(formatWeight(117312, 'kg')).toBe('117,312 kg')
    expect(formatWeight(258000, 'lbs')).toBe('258,000 lbs')
    expect(formatDistance(4240)).toBe('4,240 nm')
  })

  it('returns a placeholder for invalid values', () => {
    expect(formatNumber(NaN)).toBe(PLACEHOLDER)
    expect(formatWeight(-1, 'kg')).toBe(PLACEHOLDER)
    expect(formatDistance(Infinity)).toBe(PLACEHOLDER)
  })
})

describe('UTC time', () => {
  const date = new Date(Date.UTC(2026, 9, 20, 7, 5))

  it('formats as Zulu time regardless of local timezone', () => {
    expect(formatUtcTime(date)).toBe('07:05Z')
    expect(formatUtcDateTime(date)).toBe('20 Oct 07:05Z')
  })

  it('formats dates and the live clock', () => {
    expect(formatUtcDate(date)).toBe('20 Oct 2026')
    expect(formatUtcClock(new Date(Date.UTC(2026, 9, 20, 7, 5, 9)))).toBe('07:05:09')
  })

  it('returns a placeholder for null or invalid dates', () => {
    expect(formatUtcTime(null)).toBe(PLACEHOLDER)
    expect(formatUtcDateTime(new Date('nope'))).toBe(PLACEHOLDER)
    expect(formatUtcDate(null)).toBe(PLACEHOLDER)
    expect(formatUtcClock(new Date('nope'))).toBe('--:--:--')
  })
})

describe('formatPercent', () => {
  it('shows one decimal place', () => {
    expect(formatPercent(80.28)).toBe('80.3%')
    expect(formatPercent(100)).toBe('100.0%')
    expect(formatPercent(NaN)).toBe(PLACEHOLDER)
  })
})

describe('percentOf', () => {
  it('returns the share of a limit, clamped to 0–100', () => {
    expect(percentOf(50, 200)).toBe(25)
    expect(percentOf(300, 200)).toBe(100)
  })

  it('returns 0 when the limit is unknown', () => {
    expect(percentOf(50, 0)).toBe(0)
    expect(percentOf(NaN, 100)).toBe(0)
  })
})
