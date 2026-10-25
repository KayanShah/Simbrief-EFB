import { validatePilotId } from './validation'

describe('validatePilotId', () => {
  it('accepts numeric IDs of up to 7 digits and trims whitespace', () => {
    expect(validatePilotId('1381511')).toEqual({ ok: true, pilotId: '1381511' })
    expect(validatePilotId('  1381511 ')).toEqual({ ok: true, pilotId: '1381511' })
    expect(validatePilotId('7')).toEqual({ ok: true, pilotId: '7' })
  })

  it.each(['', '   '])('rejects empty input %j', (input) => {
    expect(validatePilotId(input)).toMatchObject({ ok: false, message: expect.stringMatching(/enter your/i) })
  })

  it.each(['abc', '13815a1', '-1', '1.5', '12345678'])('rejects %j', (input) => {
    expect(validatePilotId(input)).toMatchObject({
      ok: false,
      message: 'Enter a numeric User ID between 1 and 7 digits.',
    })
  })
})
