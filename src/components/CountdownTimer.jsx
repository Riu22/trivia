import { useState, useEffect } from 'react'

export default function CountdownTimer({ endsAt, totalSeconds }) {
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (!endsAt) return
    const end = new Date(endsAt).getTime()

    const tick = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((end - now) / 1000))
      setTimeLeft(remaining)
    }

    tick()
    const interval = setInterval(tick, 500)
    return () => clearInterval(interval)
  }, [endsAt])

  const total = totalSeconds || 60
  const pct = Math.min(1, timeLeft / total)
  const radius = 40
  const circ = 2 * Math.PI * radius
  const offset = circ * (1 - pct)

  const color = pct > 0.5 ? 'var(--green)' : pct > 0.2 ? 'var(--accent)' : 'var(--red)'

  return (
    <div style={{ position: 'relative', width: '100px', height: '100px' }}>
      <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="var(--bg-3)"
          strokeWidth="4"
        />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '22px', fontWeight: 500,
        color: color,
        transition: 'color 0.5s ease',
      }}>
        {timeLeft}
      </div>
    </div>
  )
}