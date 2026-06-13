'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toBDTime, toBDDate } from '@/lib/format-time'

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

function FlagImage({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return null
  if (src.startsWith('http'))
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} width={32} height={20}
        className="w-8 h-5 object-cover rounded-sm shrink-0 border border-white/[0.12]" />
    )
  return <span className="text-xl leading-none shrink-0">{src}</span>
}

function ScoreButton({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (v: number) => void
  disabled: boolean
}) {
  return (
    <div className={`flex items-center gap-0 rounded-lg overflow-hidden border transition-colors ${disabled
      ? 'border-white/[0.06] bg-white/[0.02]'
      : 'border-white/[0.12] bg-white/[0.05] focus-within:border-emerald-500/50'
      }`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled || value === 0}
        className="w-8 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed transition-all text-lg font-light select-none"
      >
        −
      </button>
      <span className="w-8 text-center text-lg font-black tabular-nums text-white leading-none select-none">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(20, value + 1))}
        disabled={disabled}
        className="w-8 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed transition-all text-lg font-light select-none"
      >
        +
      </button>
    </div>
  )
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
      [matchId]: { ...prev[matchId], [field]: val, saved: false, error: '' },
    }))
  }

  const save = async (match: Match) => {
    if (!isLoggedIn) return
    if (new Date() >= new Date(match.kickoff)) {
      setPreds(prev => ({
        ...prev,
        [match.id]: { ...prev[match.id], error: 'Predictions closed' },
      }))
      return
    }

    setPreds(prev => ({
      ...prev,
      [match.id]: { ...prev[match.id], saving: true, error: '' },
    }))

    const { data: { user } } = await supabase.auth.getUser()
    const p = preds[match.id]

    const { error } = await supabase.from('predictions').upsert(
      { user_id: user!.id, match_id: match.id, pred_home: p.home, pred_away: p.away },
      { onConflict: 'user_id,match_id' }
    )

    setPreds(prev => ({
      ...prev,
      [match.id]: {
        ...prev[match.id],
        saving: false,
        saved: !error,
        error: error ? 'Failed to save — try again' : '',
      },
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
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-14 text-center">
        <p className="text-3xl mb-3 opacity-40">📭</p>
        <p className="text-sm font-medium text-white/30">No upcoming matches to predict</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {Object.entries(grouped).map(([day, dayMatches]) => (
        <div key={day}>
          {/* Date header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/30">
              {day}
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <div className="space-y-3">
            {dayMatches.map(match => {
              const p = preds[match.id]
              const closed = new Date() >= new Date(match.kickoff)
              const isSaved = p.saved
              const isDirty = !p.saved && !p.saving

              return (
                <div
                  key={match.id}
                  className={[
                    'relative rounded-2xl overflow-hidden transition-all duration-200',
                    'border',
                    isSaved
                      ? 'border-emerald-500/25 bg-emerald-500/[0.04] shadow-[0_0_20px_-6px_rgba(16,185,129,0.15)]'
                      : 'border-white/[0.07] bg-white/[0.03] hover:border-white/[0.11]',
                  ].join(' ')}
                >
                  {/* Saved top shimmer */}
                  {isSaved && (
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
                  )}

                  <div className="px-5 py-4 space-y-4">
                    {/* Top row */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/25">
                        {match.round}
                      </span>
                      <span className="text-[11px] font-medium text-white/30 tabular-nums">
                        {toBDTime(match.kickoff)}
                      </span>
                    </div>

                    {/* Teams + stepper inputs */}
                    <div className="flex items-center gap-3">
                      {/* Home */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FlagImage src={match.home_flag} alt={match.home_team} />
                        <span className="text-sm font-semibold text-white/85 truncate leading-tight">
                          {match.home_team}
                        </span>
                      </div>

                      {/* Steppers */}
                      <div className="flex items-center gap-2 shrink-0">
                        <ScoreButton
                          value={p.home}
                          onChange={v => update(match.id, 'home', v)}
                          disabled={closed || !isLoggedIn}
                        />
                        <span className="text-white/15 font-light select-none w-3 text-center">–</span>
                        <ScoreButton
                          value={p.away}
                          onChange={v => update(match.id, 'away', v)}
                          disabled={closed || !isLoggedIn}
                        />
                      </div>

                      {/* Away */}
                      <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                        <span className="text-sm font-semibold text-white/85 truncate text-right leading-tight">
                          {match.away_team}
                        </span>
                        <FlagImage src={match.away_flag} alt={match.away_team} />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px]">
                        {closed && (
                          <span className="text-white/25 font-medium">Predictions closed</span>
                        )}
                        {!closed && !isLoggedIn && (
                          <span className="text-white/25">Sign in to predict</span>
                        )}
                        {!closed && isLoggedIn && isSaved && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Saved
                          </span>
                        )}
                        {!closed && isLoggedIn && isDirty && (
                          <span className="text-white/25">Unsaved</span>
                        )}
                        {p.error && (
                          <span className="text-red-400 font-medium">{p.error}</span>
                        )}
                      </div>

                      {!closed && isLoggedIn && (
                        <button
                          onClick={() => save(match)}
                          disabled={p.saving || isSaved}
                          className={[
                            'text-[11px] font-bold tracking-wide px-4 py-1.5 rounded-lg transition-all duration-150',
                            isSaved
                              ? 'text-emerald-400/50 cursor-default'
                              : p.saving
                                ? 'text-white/30 bg-white/[0.04] cursor-not-allowed'
                                : 'text-black bg-emerald-500 hover:bg-emerald-400 active:scale-95',
                          ].join(' ')}
                        >
                          {p.saving ? 'Saving…' : isSaved ? 'Saved' : 'Save'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
