import lottie from 'lottie-web/build/player/lottie_light'
import { useEffect, useRef } from 'react'
// "Flight loader" by Weblodge, LottieFiles (Lottie Simple License).
import animationData from '../../assets/flight-loader.json'

// freeze on a frame that actually looks like a plane
const STILL_FRAME = 20

export default function FlightAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const animation = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: true,
      autoplay: !reduceMotion,
      animationData,
    })
    if (reduceMotion) animation.goToAndStop(STILL_FRAME, true)

    return () => animation.destroy()
  }, [])

  return <div className="flight-loader-animation" ref={containerRef} aria-hidden="true" />
}
