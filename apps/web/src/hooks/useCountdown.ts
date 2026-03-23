import { useState, useEffect } from 'react'

export function useCountdown(target: string | null): string | null {
  const [remaining, setRemaining] = useState<string | null>(null)

  useEffect(() => {
    if (!target) return

    const tick = () => {
      const diff = new Date(target).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining(null)
        return
      }
      const days = Math.floor(diff / 86_400_000)
      const hours = Math.floor((diff % 86_400_000) / 3_600_000)
      const mins = Math.floor((diff % 3_600_000) / 60_000)
      const secs = Math.floor((diff % 60_000) / 1_000)

      if (days > 0) {
        setRemaining(`${days}j ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`)
      } else {
        setRemaining(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`)
      }
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])

  return remaining
}
