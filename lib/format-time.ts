export function toBDTime(kickoff: string) {
  return new Date(kickoff).toLocaleTimeString('en-BD', {
    timeZone: 'Asia/Dhaka',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

// If you also show the date
export function toBDDate(kickoff: string) {
  return new Date(kickoff).toLocaleDateString('en-BD', {
    timeZone: 'Asia/Dhaka',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
