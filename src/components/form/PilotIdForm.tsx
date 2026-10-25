import { useId, useState, type FormEvent } from 'react'
import type { OfpState } from '../../hooks/useOfp'
import { MAX_PILOT_ID_DIGITS, validatePilotId } from '../../lib/validation'

interface PilotIdFormProps {
  initialPilotId?: string
  status: OfpState['status']
  onSubmit: (pilotId: string) => void
  // set when changing ID: shows Cancel, and Escape cancels
  onCancel?: () => void
}

export function PilotIdForm({ initialPilotId = '', status, onSubmit, onCancel }: PilotIdFormProps) {
  const [value, setValue] = useState(initialPilotId)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputId = useId()
  const hintId = useId()
  const errorId = useId()
  const isLoading = status === 'loading'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validatePilotId(value)
    if (!result.ok) {
      setValidationError(result.message)
      return
    }
    setValidationError(null)
    onSubmit(result.pilotId)
  }

  return (
    <form
      className="load-panel"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Load flight plan"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && onCancel) onCancel()
      }}
    >
      <div className="form-copy">
        <div className="form-title">Load operational flight plan</div>
        <label className="form-hint" htmlFor={inputId}>
          User ID · numeric, up to {MAX_PILOT_ID_DIGITS} digits
        </label>
        <div className="form-hint" id={hintId}>
          SimBrief User ID (they also call it Pilot ID). Account → Account Settings.
        </div>
        {validationError && (
          <div className="form-error" id={errorId} role="alert">
            {validationError}
          </div>
        )}
      </div>
      <div>
        <div className="form-row">
          <input
            className="id-input"
            id={inputId}
            name="pilotId"
            inputMode="numeric"
            autoComplete="off"
            autoFocus={Boolean(onCancel)}
            maxLength={MAX_PILOT_ID_DIGITS}
            placeholder="e.g. 1234567"
            value={value}
            disabled={isLoading}
            onChange={(event) => {
              setValue(event.target.value)
              if (validationError) setValidationError(null)
            }}
            aria-invalid={validationError !== null}
            aria-describedby={validationError ? `${hintId} ${errorId}` : hintId}
          />
          <button className="btn btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Loading…' : 'Load OFP  ↗'}
          </button>
          {onCancel && (
            <button className="btn btn-quiet" type="button" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
        {/* form goes away on success, chip in the header instead */}
        <div className="toast is-error">{status === 'error' ? 'Flight plan not loaded.' : ''}</div>
      </div>
    </form>
  )
}
