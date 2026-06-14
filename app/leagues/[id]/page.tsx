import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import ShareLeague from '@/components/ShareLeague'
import { format } from 'date-fns'
import LeaveLeague from '@/components/LeaveLeague'
import DeleteLeague from '@/components/DeleteLeague'

type ProfileData = {
  id: string
  name: string | null
  avatar_url: string | null
  total_points: number
}

type PredictionData = {
  id: number
  user_id: string
  match_id: number
  pred_home: number
  pred_away: number
  points_awarded: number | null
  scored_at: string | null
}

type MatchData = {
  id: number
  home_team: string
  away_team: string
  home_flag: string | null
  away_flag: string | null
  home_score: number | null
  away_score: number | null
  status: string
  kickoff: string
}

function FlagImg({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return null
  if (src.startsWith('http'))
    return (
      <img src={src} alt={alt} width={20} height={14}
        className="rounded-[3px] object-cover border border-white/[0.12] shrink-0"
        style={{ width: 20, height: 14 }} />
    )
  return <span className="text-base leading-none">{src}</span>
}

function PointsBadge({ pts, scored }: { pts: number | null; scored: boolean }) {
  if (!scored || pts === null) return null
  if (pts === 5) return (
    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
      🎯 +5
    </span>
  )
  if (pts === 3) return (
    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
      ✓ +3
    </span>
  )
  return (
    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/[0.05] text-white/25">
      +0
    </span>
  )
}

export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', id)
    .single()

  if (!league) notFound()

  // Two separate queries to avoid RLS issues with nested select
  const { data: memberRows } = await supabase
    .from('league_members')
    .select('user_id')
    .eq('league_id', id)

  const memberIds = (memberRows ?? []).map(m => m.user_id)

  const { data: profileRows } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, total_points')
    .in('id', memberIds.length > 0 ? memberIds : ['none'])

  const sorted = (profileRows ?? []).sort((a, b) => b.total_points - a.total_points) as ProfileData[]

  const profileMap: Record<string, ProfileData> = {}
  for (const p of sorted) {
    profileMap[p.id] = p
  }

  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .in('user_id', memberIds.length > 0 ? memberIds : ['none'])
    .order('match_id', { ascending: true })

  const typedPredictions = (predictions ?? []) as PredictionData[]
  const matchIds = [...new Set(typedPredictions.map(p => p.match_id))]

  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_team, away_team, home_flag, away_flag, home_score, away_score, status, kickoff')
    .in('id', matchIds.length > 0 ? matchIds : [-1])
    .order('kickoff', { ascending: true })

  const typedMatches = (matches ?? []) as MatchData[]

  const predsByMatch: Record<number, PredictionData[]> = {}
  for (const pred of typedPredictions) {
    if (!predsByMatch[pred.match_id]) predsByMatch[pred.match_id] = []
    predsByMatch[pred.match_id].push(pred)
  }

  const maxPoints = sorted[0]?.total_points ?? 1
  const isCreator = user?.id === league.created_by

  return (
    <div className="pb-16">

      {/* Back */}
      <Link
        href="/leagues"
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/30 hover:text-white/60 transition-colors mb-6"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All Leagues
      </Link>

      {/* League hero card */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden mb-6">
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

        <div className="px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-black text-white/90 leading-tight truncate">
                {league.name}
              </h1>
              {league.sponsor_name && (
                <p className="text-[11px] text-emerald-400/70 mt-1">
                  Sponsored by {league.sponsor_name}
                </p>
              )}
              <p className="text-[11px] text-white/25 mt-1">
                {sorted.length} member{sorted.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-widest uppercase text-white/20 mb-1.5">
                  Invite code
                </p>
                <span className="text-base font-black tracking-[0.2em] font-mono text-white/70 bg-white/[0.05] border border-white/[0.08] px-3 py-1.5 rounded-xl">
                  {league.code}
                </span>
              </div>
              <div className="flex gap-2">
                {isCreator ? (
                  <DeleteLeague
                    leagueId={league.id}
                    leagueName={league.name}
                    createdBy={league.created_by}
                  />
                ) : user ? (
                  <LeaveLeague leagueId={league.id} leagueName={league.name} />
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.05]">
            <p className="text-[10px] font-bold tracking-widest uppercase text-white/20 mb-3">
              Invite friends
            </p>
            <ShareLeague code={league.code} name={league.name} />
          </div>
        </div>
      </div>

      {/* Standings */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-[11px] font-black tracking-[0.18em] uppercase text-white/40">
            Standings
          </h2>
          <div className="flex-1 h-px bg-white/[0.05]" />
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          {sorted.map((profile, index) => {
            const rank = index + 1
            const isCurrentUser = profile.id === user?.id
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
            const pts = profile.total_points ?? 0
            const barPct = maxPoints > 0 ? Math.max(2, Math.round((pts / maxPoints) * 100)) : 2

            return (
              <div
                key={profile.id}
                className={[
                  'flex items-center gap-3 px-4 py-3',
                  'border-b border-white/[0.04] last:border-b-0',
                  'transition-colors duration-150',
                  isCurrentUser
                    ? 'bg-emerald-500/[0.05] border-l-2 border-l-emerald-500/50'
                    : 'hover:bg-white/[0.03] border-l-2 border-l-transparent',
                ].join(' ')}
              >
                <div className="w-7 text-center shrink-0">
                  {medal
                    ? <span className="text-base leading-none">{medal}</span>
                    : <span className={`text-[11px] font-black tabular-nums ${isCurrentUser ? 'text-emerald-500/60' : 'text-white/15'}`}>{rank}</span>
                  }
                </div>

                <Avatar className="h-7 w-7 ring-1 ring-white/[0.07] shrink-0">
                  <AvatarImage src={profile.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-white/[0.06] text-white/40 text-[9px] font-bold">
                    {(profile.name ?? 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[12px] font-semibold truncate leading-none ${isCurrentUser ? 'text-emerald-300' : 'text-white/80'}`}>
                      {profile.name ?? 'Anonymous'}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[9px] font-black text-emerald-500 tracking-wide shrink-0">YOU</span>
                    )}
                  </div>
                  <div className="h-[2px] rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isCurrentUser ? 'bg-emerald-500/50' : 'bg-white/[0.15]'}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>

                <span className={`text-[13px] font-black tabular-nums shrink-0 ${isCurrentUser ? 'text-emerald-400' : 'text-white/55'}`}>
                  {pts}
                  <span className="text-[9px] font-semibold text-white/20 ml-0.5">pts</span>
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Predictions per match */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-[11px] font-black tracking-[0.18em] uppercase text-white/40">
            Predictions
          </h2>
          <div className="flex-1 h-px bg-white/[0.05]" />
        </div>

        {typedMatches.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-12 text-center">
            <p className="text-2xl mb-3 opacity-30">📭</p>
            <p className="text-sm font-medium text-white/30">No predictions yet</p>
            <p className="text-xs text-white/20 mt-1">Members haven't predicted any matches</p>
          </div>
        ) : (
          <div className="space-y-3">
            {typedMatches.map(match => {
              const matchPreds = predsByMatch[match.id] ?? []
              const isFinished = match.status === 'finished'
              const isLive = match.status === 'live'

              return (
                <div
                  key={match.id}
                  className={[
                    'rounded-2xl border overflow-hidden',
                    isLive
                      ? 'border-emerald-500/25 shadow-[0_0_20px_-6px_rgba(16,185,129,0.15)]'
                      : 'border-white/[0.07]',
                  ].join(' ')}
                >
                  <div className={`px-4 py-3 border-b border-white/[0.05] ${isLive ? 'bg-emerald-500/[0.04]' : 'bg-white/[0.02]'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FlagImg src={match.home_flag} alt={match.home_team} />
                        <span className="text-[12px] font-bold text-white/80 truncate">
                          {match.home_team}
                        </span>
                        {isFinished ? (
                          <span className="text-[13px] font-black text-white tabular-nums px-1 shrink-0">
                            {match.home_score} – {match.away_score}
                          </span>
                        ) : (
                          <span className="text-[11px] text-white/20 px-1 shrink-0">vs</span>
                        )}
                        <span className="text-[12px] font-bold text-white/80 truncate">
                          {match.away_team}
                        </span>
                        <FlagImg src={match.away_flag} alt={match.away_team} />
                      </div>

                      <div className="shrink-0">
                        {isLive && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                            </span>
                            Live
                          </span>
                        )}
                        {isFinished && (
                          <span className="text-[10px] font-bold tracking-widest uppercase text-white/25">FT</span>
                        )}
                        {!isFinished && !isLive && (
                          <span className="text-[10px] text-white/25 tabular-nums">
                            {format(new Date(match.kickoff), 'd MMM · HH:mm')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/[0.015]">
                    {matchPreds.map(pred => {
                      const profile = profileMap[pred.user_id]
                      if (!profile) return null
                      const isCurrentUser = profile.id === user?.id
                      const scored = pred.points_awarded !== null && pred.scored_at !== null

                      return (
                        <div
                          key={pred.id}
                          className={[
                            'flex items-center gap-2.5 px-4 py-2.5',
                            'border-b border-white/[0.03] last:border-b-0',
                            isCurrentUser ? 'bg-emerald-500/[0.04]' : 'hover:bg-white/[0.02]',
                          ].join(' ')}
                        >
                          <Avatar className="h-5 w-5 ring-1 ring-white/[0.06] shrink-0">
                            <AvatarImage src={profile.avatar_url ?? undefined} />
                            <AvatarFallback className="bg-white/[0.06] text-white/30 text-[8px] font-bold">
                              {(profile.name ?? 'U')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <span className={`text-[12px] font-semibold flex-1 truncate ${isCurrentUser ? 'text-emerald-300' : 'text-white/65'}`}>
                            {profile.name ?? 'Anonymous'}
                            {isCurrentUser && (
                              <span className="ml-1.5 text-[9px] font-black text-emerald-500">YOU</span>
                            )}
                          </span>

                          <span className="text-[12px] font-black tabular-nums text-white/60 font-mono shrink-0">
                            {pred.pred_home} – {pred.pred_away}
                          </span>

                          <div className="shrink-0 w-12 text-right">
                            <PointsBadge pts={pred.points_awarded} scored={scored} />
                            {pred.points_awarded === null && isFinished && (
                              <span className="text-[10px] text-white/20 font-medium">pending</span>
                            )}
                            {!isFinished && (
                              <span className={`text-[10px] font-semibold ${isLive ? 'text-emerald-400/60' : 'text-white/20'}`}>
                                {isLive ? 'live' : '—'}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {sorted
                      .filter(p => !matchPreds.find(pred => pred.user_id === p.id))
                      .map(profile => (
                        <div
                          key={profile.id}
                          className="flex items-center gap-2.5 px-4 py-2.5 border-b border-white/[0.03] last:border-b-0 opacity-30"
                        >
                          <Avatar className="h-5 w-5 shrink-0">
                            <AvatarImage src={profile.avatar_url ?? undefined} />
                            <AvatarFallback className="bg-white/[0.04] text-white/20 text-[8px] font-bold">
                              {(profile.name ?? 'U')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[12px] text-white/40 flex-1 truncate">
                            {profile.name ?? 'Anonymous'}
                          </span>
                          <span className="text-[10px] text-white/25 italic">no prediction</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
