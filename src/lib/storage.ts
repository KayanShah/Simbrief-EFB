const LAST_PILOT_ID_KEY = 'simbrief-efb:last-pilot-id'

// safari private mode can throw on localStorage. not worth crashing over.

export function loadLastPilotId(): string | null {
  try {
    return localStorage.getItem(LAST_PILOT_ID_KEY)
  } catch {
    return null
  }
}

export function saveLastPilotId(pilotId: string): void {
  try {
    localStorage.setItem(LAST_PILOT_ID_KEY, pilotId)
  } catch {
    // ignore
  }
}

export function clearLastPilotId(): void {
  try {
    localStorage.removeItem(LAST_PILOT_ID_KEY)
  } catch {
    // ignore
  }
}
