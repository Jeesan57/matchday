'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toBDDate, toBDTime } from '@/lib/format-time'
import { Badge } from '@/components/ui/badge'
import PredictionForm from '@/components/PredictionForm'

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
  group_stage: string | null
  match_minute?: number | null
}

type Prediction = {
  pred_home: number
  pred_away: number
  points_awarded: number | null
  scored_at: string | null
} | null

function FlagImage({ src, alt, size = 'lg' }: { src: string | null; alt: string; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-16 h-11 object-contain' : 'w-8 h-5 object-contain'
  if (!src) return null
  if (src.startsWith('http')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`${cls} rounded-sm`} />
  }
  return <span className={size === 'lg' ? 'text-5xl' : 'text-2xl'}>{src}</span>
}

export default function MatchDetail({
  initialMatch,
  user,
  existingPrediction,
}: {
  initialMatch: Match
  user: { id: string } | null
  existingPrediction: Prediction
}) {
  const [match, setMatch] = useState<Match>(initialMatch)

  useEffect(() => {
    const channel = supabase
      .channel(`match-${initialMatch.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${initialMatch.id}`,
        },
        (payload) => {
          setMatch(payload.new as Match)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialMatch.id])

  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const showScore = isLive || isFinished
  const canPredict = match.status === 'scheduled' && !existingPrediction

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Match header */}
      <div className="border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {match.round} · {match.group_stage}
          </span>
          {isLive && (
            <Badge variant="destructive" className="gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white live-dot inline-block" />
              LIVE
            </Badge>
          )}
          {isFinished && <Badge variant="secondary">Full Time</Badge>}
          {match.status === 'scheduled' && (
            <span className="text-sm text-muted-foreground">
              {toBDDate(match.kickoff)} · {toBDTime(match.kickoff)}
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <FlagImage src={match.home_flag} alt={match.home_team} size="lg" />
            <span className="font-semibold text-center">{match.home_team}</span>
          </div>

          <div className="text-center">
            {showScore ? (
              <span className="text-4xl font-bold tabular-nums">
                {match.home_score ?? 0} – {match.away_score ?? 0}
              </span>
            ) : (
              <span className="text-2xl text-muted-foreground font-medium">vs</span>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            <FlagImage src={match.away_flag} alt={match.away_team} size="lg" />
            <span className="font-semibold text-center">{match.away_team}</span>
          </div>
        </div>

        {match.venue && (
          <p className="text-sm text-muted-foreground text-center">📍 {match.venue}</p>
        )}
      </div>

      {/* Prediction section */}
      <div className="border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Your Prediction</h2>

        {!user && (
          <div className="text-center py-4 space-y-2">
            <p className="text-muted-foreground text-sm">Sign in to make a prediction</p>
            <a href="/login" className="text-primary text-sm underline underline-offset-4">
              Sign in with Google
            </a>
          </div>
        )}

        {user && existingPrediction && (
          <div className="bg-muted rounded-lg p-4 text-center space-y-1">
            <p className="text-sm text-muted-foreground">Your prediction</p>
            <p className="text-2xl font-bold tabular-nums">
              {existingPrediction.pred_home} – {existingPrediction.pred_away}
            </p>
            {existingPrediction.points_awarded !== null && existingPrediction.scored_at && (
              <p className="text-sm font-medium text-primary">
                +{existingPrediction.points_awarded} points earned
              </p>
            )}
            {!existingPrediction.scored_at && (
              <p className="text-xs text-muted-foreground">
                Points awarded after full time
              </p>
            )}
          </div>
        )}

        {user && canPredict && (
          <PredictionForm
            matchId={match.id}
            homeTeam={match.home_team}
            awayTeam={match.away_team}
            homeFlag={match.home_flag}
            awayFlag={match.away_flag}
            kickoff={match.kickoff}
          />
        )}

        {user && !canPredict && !existingPrediction && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isLive
              ? 'Match is in progress — predictions closed.'
              : 'Predictions are closed for this match.'}
          </p>
        )}
      </div>
    </div>
  )
}
