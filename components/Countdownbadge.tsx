'use client'
import { useEffect, useState } from 'react'

function getCountdown(kickoff: string) {
  const diff = new Date(kickoff).getTime() - Date.now()

  if (diff <= 0) return null

  const totalSeconds = Math.floor(diff / 1000)

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  return { days, hours, mins, secs }
}

export default function CountdownBadge({ kickoff }: { kickoff: string }) {
  const [time, setTime] = useState(() => getCountdown(kickoff))

  useEffect(() => {
    setTime(getCountdown(kickoff))

    const interval = setInterval(() => {
      setTime(getCountdown(kickoff))
    }, 1000)

    return () => clearInterval(interval)
  }, [kickoff])

  if (!time) return null

  const { days, hours, mins, secs } = time

  let label = ''

  if (days > 0) {
    // hide seconds when days exist
    label = `${days}d ${hours}h ${mins}m`
  } else {
    label = `${hours}h ${mins}m ${secs}s`
  }

  return (
    <span className="text-[10px] font-medium text-amber-400/70 tabular-nums">
      {label}
    </span>
  )
}
