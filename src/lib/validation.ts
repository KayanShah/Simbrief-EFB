export type PilotIdValidation =
  | { ok: true; pilotId: string }
  | { ok: false; message: string }

export const MAX_PILOT_ID_DIGITS = 7

const PILOT_ID = new RegExp(`^\\d{1,${MAX_PILOT_ID_DIGITS}}$`)

export function validatePilotId(input: string): PilotIdValidation {
  const pilotId = input.trim()

  if (pilotId === '') {
    return { ok: false, message: 'Enter your SimBrief User ID.' }
  }

  // brief said user id, simbrief account page still says pilot id. same number.
  if (!PILOT_ID.test(pilotId)) {
    return { ok: false, message: `Enter a numeric User ID between 1 and ${MAX_PILOT_ID_DIGITS} digits.` }
  }

  return { ok: true, pilotId }
}
