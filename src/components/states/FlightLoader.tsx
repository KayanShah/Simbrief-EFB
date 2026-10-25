import { Suspense, lazy } from 'react'

// lottie is chunky so it loads after the panel is already on screen
const FlightAnimation = lazy(() => import('./FlightAnimation'))

export function FlightLoader({ pilotId }: { pilotId: string }) {
  return (
    <div className="flight-loader" role="status">
      <Suspense fallback={<div className="flight-loader-animation" />}>
        <FlightAnimation />
      </Suspense>
      <p>Loading flight plan for {pilotId}…</p>
    </div>
  )
}
