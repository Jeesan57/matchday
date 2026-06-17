'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

type Match = {
  id: number
  home_team: string
  away_team: string
  home_flag: string | null
  away_flag: string | null
  home_score: number | null
  away_score: number | null
  kickoff: string
  status: string
  venue: string | null
  round: string | null
  match_minute?: number | null
}

/**
 * Takes an initial list of matches (e.g. fetched server-side) and keeps it
 * live-updated via Supabase Realtime. Any INSERT/UPDATE/DELETE on the
 * `matches` table patches local state immediately, no polling involved.
 */
export function useLiveMatches(initialMatches: Match[]) {
  const [matches, setMatches] = useState<Match[]>(initialMatches)

  useEffect(() => {
    const channel = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          setMatches((current) => {
            if (payload.eventType === 'INSERT') {
              const newMatch = payload.new as Match
              // Avoid duplicates if it somehow already exists
              if (current.some((m) => m.id === newMatch.id)) return current
              return [...current, newMatch]
            }

            if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Match
              return current.map((m) => (m.id === updated.id ? updated : m))
            }

            if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as Match).id
              return current.filter((m) => m.id !== deletedId)
            }

            return current
          })
        }
      )
      .subscribe()

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return matches
}
