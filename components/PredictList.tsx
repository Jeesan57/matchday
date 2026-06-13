'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toBDTime, toBDDate } from '@/lib/format-time'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Match = {
  id: number
  home_team: string
  away_team: string
  home_flag: string | null
  away_flag: string | null
  kickoff: string
  round: string
}

type Props = {
  matches: Match[]
  predictions: Record<number, { pred_home: number; pred_away: number }>
  isLoggedIn: boolean
}

type PredState = {
  home: number
  away: number
  saved: boolean
  saving: boolean
  error: string
}

export default function PredictList({ matches, predictions, isLoggedIn }: Props) {
  const supabase = createClient()

  const [preds, setPreds] = useState<Record<number, PredState>>(() => {
    const init: Record<number, PredState> = {}
    for (const m of matches) {
      const existing = predictions[m.id]
      init[m.id] = {
        home: existing?.pred_home ?? 0,
        away: existing?.pred_away ?? 0,
        saved: !!existing,
        saving: false,
        error: '',
      }
    }
    return init
  })

  const update = (matchId: number, field: 'home' | 'away', val: number) => {
    setPreds(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: val, saved: false, error: '' }
    }))
  }

  const save = async (match: Match) => {
    if (!isLoggedIn) return

    if (new Date() >= new Date(match.kickoff)) {
      setPreds(prev => ({ ...prev, [match.id]: { ...prev[match.id], error: 'Predictions closed' } }))
      return
    }

    setPreds(prev => ({ ...prev, [match.id]: { ...prev[match.id], saving: true, error: '' } }))

    const { data: { user } } = await supabase.auth.getUser()
    const p = preds[match.id]

    const { error } = await supabase.from('predictions').upsert({
      user_id: user!.id,
      match_id: match.id,
      pred_home: p.home,
      pred_away: p.away,
    }, { onConflict: 'user_id,match_id' })

    setPreds(prev => ({
      ...prev,
      [match.id]: {
        ...prev[match.id],
        saving: false,
        saved: !error,
        error: error ? 'Failed to save' : '',
      }
    }))
  }

  // Group by date
  const grouped: Record<string, Match[]> = {}
  for (const m of matches) {
    const day = toBDDate(m.kickoff)
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(m)
  }

  if (matches.length === 0) {
    return <p className="text-muted-foreground text-sm">No upcoming matches.</p>
  }

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([day, dayMatches]) => (
        <div key={day}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {day}
          </p>
          <div className="space-y-3">
            {dayMatches.map(match => {
              const p = preds[match.id]
              const closed = new Date() >= new Date(match.kickoff)

              return (
                <div
                  key={match.id}
                  className={`border rounded-xl p-4 space-y-3 transition-colors ${p.saved ? 'border-green-500/40 bg-green-500/5' : 'bg-card'
                    }`}
                >
                  {/* Match header */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{match.round}</span>
                    <span>{toBDTime(match.kickoff)}</span>
                  </div>

                  {/* Teams + inputs */}
                  <div className="flex items-center gap-3">
                    {/* Home */}
                    <div className="flex-1 flex items-center gap-2">
                      {match.home_flag && (
                        <img src={match.home_flag} alt={match.home_team} className="w-8 h-5 object-cover rounded-sm" />
                      )}
                      <span className="text-sm font-medium truncate">{match.home_team}</span>
                    </div>

                    {/* Score inputs */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        value={p.home}
                        onChange={e => update(match.id, 'home', Math.max(0, parseInt(e.target.value) || 0))}
                        disabled={closed || !isLoggedIn}
                        className="w-14 h-10 text-center text-lg font-bold p-0"
                      />
                      <span className="text-muted-foreground font-bold">–</span>
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        value={p.away}
                        onChange={e => update(match.id, 'away', Math.max(0, parseInt(e.target.value) || 0))}
                        disabled={closed || !isLoggedIn}
                        className="w-14 h-10 text-center text-lg font-bold p-0"
                      />
                    </div>

                    {/* Away */}
                    <div className="flex-1 flex items-center justify-end gap-2">
                      <span className="text-sm font-medium truncate text-right">{match.away_team}</span>
                      {match.away_flag && (
                        <img src={match.away_flag} alt={match.away_team} className="w-8 h-5 object-cover rounded-sm" />
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    {closed ? (
                      <span className="text-xs text-muted-foreground">Predictions closed</span>
                    ) : !isLoggedIn ? (
                      <span className="text-xs text-muted-foreground">Sign in to predict</span>
                    ) : p.saved ? (
                      <span className="text-xs text-green-600 font-medium">✓ Saved</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unsaved</span>
                    )}

                    {!closed && isLoggedIn && (
                      <Button
                        size="sm"
                        variant={p.saved ? 'outline' : 'default'}
                        onClick={() => save(match)}
                        disabled={p.saving}
                        className="h-7 text-xs"
                      >
                        {p.saving ? 'Saving...' : p.saved ? 'Update' : 'Save'}
                      </Button>
                    )}
                  </div>

                  {p.error && <p className="text-xs text-destructive">{p.error}</p>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
