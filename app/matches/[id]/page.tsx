import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import PredictionForm from '@/components/PredictionForm'

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single()

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch existing prediction if logged in
  let existingPrediction = null
  if (user) {
    const { data } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('match_id', match.id)
      .single()
    existingPrediction = data
  }

  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const showScore = isLive || isFinished
  const canPredict = match.status === 'scheduled' && !existingPrediction

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Match header */}
      <div className="border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{match.round} · {match.group_stage}</span>
          {isLive && (
            <Badge variant="destructive" className="gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white live-dot inline-block" />
              LIVE
            </Badge>
          )}
          {isFinished && <Badge variant="secondary">Full Time</Badge>}
          {match.status === 'scheduled' && (
            <span className="text-sm text-muted-foreground">
              {format(new Date(match.kickoff), 'EEE d MMM · HH:mm')}
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <span className="text-5xl">{match.home_flag}</span>
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
            <span className="text-5xl">{match.away_flag}</span>
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
              <p className="text-xs text-muted-foreground">Points awarded after full time</p>
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
          />
        )}

        {user && !canPredict && !existingPrediction && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isLive ? 'Match is in progress — predictions closed.' : 'Predictions are closed for this match.'}
          </p>
        )}
      </div>
    </div>
  )
}
