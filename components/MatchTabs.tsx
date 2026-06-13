'use client'

import { useState } from 'react'
import MatchCard from '@/components/MatchCard'

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
  user_prediction?: { home: number; away: number } | null
}

function groupByDate<T extends { kickoff: string }>(matches: T[]) {
  const groups: Record<string, T[]> = {}
  for (const m of matches) {
    const key = new Date(m.kickoff).toDateString()
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  }
  return Object.entries(groups)
}

function DateLabel({ iso }: { iso: string }) {
  const d = new Date(iso)
  const isToday = new Date().toDateString() === d.toDateString()
  const isTomorrow = new Date(Date.now() + 86400000).toDateString() === d.toDateString()
  const label = isToday
    ? 'Today'
    : isTomorrow
      ? 'Tomorrow'
      : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/30">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  )
}

function EmptyState({ message, sub }: { message: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-14 text-center">
      <p className="text-3xl mb-3 opacity-40">📭</p>
      <p className="text-sm font-medium text-white/30">{message}</p>
      {sub && <p className="text-xs text-white/20 mt-1">{sub}</p>}
    </div>
  )
}

type Tab = 'live' | 'today' | 'results' | 'upcoming'

type Props = {
  liveMatches: Match[]
  todayMatches: Match[]
  recentMatches: Match[]
  upcomingMatches: Match[]
}

export default function MatchTabs({
  liveMatches,
  todayMatches,
  recentMatches,
  upcomingMatches,
}: Props) {
  const defaultTab: Tab = liveMatches.length > 0 ? 'live' : 'today'
  const [active, setActive] = useState<Tab>(defaultTab)

  const tabs: { id: Tab; label: string; count?: number; live?: boolean }[] = [
    ...(liveMatches.length > 0
      ? [{ id: 'live' as Tab, label: 'Live', count: liveMatches.length, live: true }]
      : []),
    { id: 'today', label: 'Today', count: todayMatches.length },
    { id: 'results', label: 'Results', count: recentMatches.length },
    { id: 'upcoming', label: 'Upcoming' },
  ]

  const upcomingGroups = groupByDate(upcomingMatches)

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-6 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={[
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold tracking-wide whitespace-nowrap transition-all duration-200 flex-1 justify-center',
                isActive
                  ? tab.live
                    ? 'bg-emerald-500/15 text-emerald-400 shadow-[0_0_12px_-2px_rgba(16,185,129,0.2)]'
                    : 'bg-white/[0.08] text-white'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]',
              ].join(' ')}
            >
              {tab.live && (
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
              )}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={[
                    'text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none',
                    isActive && tab.live
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isActive
                        ? 'bg-white/10 text-white/60'
                        : 'bg-white/[0.06] text-white/25',
                  ].join(' ')}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab panels */}
      {active === 'live' && (
        <div className="grid gap-2.5">
          {liveMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}

      {active === 'today' && (
        <div>
          {todayMatches.length > 0 ? (
            <div className="grid gap-2.5">
              {todayMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <EmptyState
              message="No matches today"
              sub="Check upcoming fixtures for the next games"
            />
          )}
        </div>
      )}

      {active === 'results' && (
        <div>
          {recentMatches.length > 0 ? (
            <div className="grid gap-2.5">
              {recentMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <EmptyState message="No results yet" sub="Check back after matches are played" />
          )}
        </div>
      )}

      {active === 'upcoming' && (
        <div>
          {upcomingGroups.length > 0 ? (
            <div className="space-y-6">
              {upcomingGroups.map(([dateKey, matches]) => (
                <div key={dateKey}>
                  <DateLabel iso={matches[0].kickoff} />
                  <div className="grid gap-2.5">
                    {matches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No upcoming fixtures" sub="All matches have been played" />
          )}
        </div>
      )}
    </div>
  )
}
