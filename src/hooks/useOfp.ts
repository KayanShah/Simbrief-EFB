import { useCallback, useEffect, useRef, useState } from 'react'
import { SimbriefError, toSimbriefError } from '../api/errors'
import { fetchOfp } from '../api/simbrief'
import { clearLastPilotId, saveLastPilotId } from '../lib/storage'
import type { Ofp } from '../types/ofp'

export type OfpState =
  | { status: 'idle' }
  | { status: 'loading'; pilotId: string }
  | { status: 'success'; pilotId: string; data: Ofp; fetchedAt: Date }
  | { status: 'error'; pilotId: string; error: SimbriefError }

export function useOfp() {
  const [state, setState] = useState<OfpState>({ status: 'idle' })
  const controllerRef = useRef<AbortController | null>(null)
  const lastPilotIdRef = useRef<string | null>(null)

  const load = useCallback(async (pilotId: string) => {
    // cancel the previous one or a slow reply can overwrite a newer id
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    lastPilotIdRef.current = pilotId

    setState({ status: 'loading', pilotId })
    try {
      const data = await fetchOfp(pilotId, controller.signal)
      if (controller.signal.aborted) return
      saveLastPilotId(pilotId)
      setState({ status: 'success', pilotId, data, fetchedAt: new Date() })
    } catch (error) {
      if (controller.signal.aborted) return
      setState({ status: 'error', pilotId, error: toSimbriefError(error) })
    }
  }, [])

  const reload = useCallback(() => {
    if (lastPilotIdRef.current) void load(lastPilotIdRef.current)
  }, [load])

  const clear = useCallback(() => {
    controllerRef.current?.abort()
    lastPilotIdRef.current = null
    clearLastPilotId()
    setState({ status: 'idle' })
  }, [])

  useEffect(() => () => controllerRef.current?.abort(), [])

  return { state, load, reload, clear }
}
