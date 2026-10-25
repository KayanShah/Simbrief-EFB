import { useEffect, useState } from 'react'

export function useUtcClock(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer) // dont leave this running
  }, [])

  return now
}
