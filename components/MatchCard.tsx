import Link from 'next/link'
import { toBDTime } from '@/lib/format-time'
import CountdownBadge from '@/components/Countdownbadge'

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

function FlagImage({ src, alt, dim }: { src: string | null; alt: string; dim?: boolean }) {
  const dimClass = dim ? 'opacity-30 grayscale' : ''
  if (!src)
    return (
      <span className={`w-9 h-6 bg-white/10 rounded text-[10px] flex items-center justify-center text-white/30 font-mono shrink-0 ${dimClass}`}>
        ?
      </span>
    )
  if (src.startsWith('http')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={36}
        height={24}
        className={`w-9 h-6 object-contain rounded-sm shrink-0 transition-all duration-300 ${dimClass}`}
      />
    )
  }
  return <span className={`text-2xl leading-none shrink-0 transition-all duration-300 ${dimClass}`}>{src}</span>
}

function ProgressBar({ minute }: { minute: number }) {
  const pct = Math.min((minute / 90) * 100, 100)
  return (
    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.04] rounded-b-2xl overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const showScore = isLive || isFinished

  const homeScore = match.home_score ?? 0
  const awayScore = match.away_score ?? 0
  const homeLost = isFinished && homeScore < awayScore
  const awayLost = isFinished && awayScore < homeScore

  return (
    <Link href={`/matches/${match.id}`} className="block group">
      <div
        className={[
          'relative rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer',
          'bg-white/[0.03] border border-white/[0.07]',
          'hover:bg-white/[0.06] hover:border-white/[0.12] hover:-translate-y-px',
          isLive
            ? 'ring-1 ring-emerald-500/30 shadow-[0_0_32px_-6px_rgba(16,185,129,0.2)]'
            : 'hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]',
        ].join(' ')}
      >
        {/* Live top shimmer */}
        {isLive && (
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
        )}

        <div className="px-5 pt-4 pb-5">

          {/* Top row: round + status */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/25">
              {match.round ?? 'Group Stage'}
            </span>

            {isLive && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                {match.match_minute ? `${match.match_minute}'` : 'Live'}
              </span>
            )}

            {isFinished && (
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/30">
                Full Time
              </span>
            )}

            {match.status === 'scheduled' && (
              <span className="text-[11px] font-semibold text-white/35 tabular-nums">
                {toBDTime(match.kickoff)}
              </span>
            )}
          </div>

          {/* Teams + score row */}
          <div className="flex items-center gap-2">

            {/* Home team */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <FlagImage src={match.home_flag} alt={match.home_team} dim={homeLost} />
              <span className={[
                'font-semibold text-sm leading-tight truncate transition-all duration-300',
                homeLost ? 'text-white/30' : 'text-white/90',
              ].join(' ')}>
                {match.home_team}
              </span>
            </div>

            {/* Score / VS */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1 min-w-[80px]">
              {showScore ? (
                <div className="flex items-center gap-2.5">
                  <span className={[
                    'text-[22px] font-black tabular-nums leading-none transition-all duration-300',
                    isLive ? 'text-emerald-400' : homeLost ? 'text-white/35' : 'text-white',
                  ].join(' ')}>
                    {homeScore}
                  </span>
                  <span className="text-white/15 text-base font-light select-none">–</span>
                  <span className={[
                    'text-[22px] font-black tabular-nums leading-none transition-all duration-300',
                    isLive ? 'text-emerald-400' : awayLost ? 'text-white/35' : 'text-white',
                  ].join(' ')}>
                    {awayScore}
                  </span>
                </div>
              ) : (
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/15 select-none">
                  vs
                </span>
              )}

              {match.user_prediction && (
                <span className="text-[10px] font-semibold text-amber-400/80 bg-amber-400/[0.08] px-2 py-0.5 rounded-full tracking-wide">
                  You: {match.user_prediction.home}–{match.user_prediction.away}
                </span>
              )}
            </div>

            {/* Away team */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
              <span className={[
                'font-semibold text-sm leading-tight truncate text-right transition-all duration-300',
                awayLost ? 'text-white/30' : 'text-white/90',
              ].join(' ')}>
                {match.away_team}
              </span>
              <FlagImage src={match.away_flag} alt={match.away_team} dim={awayLost} />
            </div>
          </div>

          {/* Bottom row: venue left, countdown right */}
          <div className="grid grid-cols-3 items-center mt-3.5">
            <div />

            {match.venue ? (
              <p className="text-[10px] text-white/20 tracking-wide truncate text-center">
                {match.venue} pp
              </p>
            ) : (
              <div />
            )}

            <div className="justify-self-end">
              {match.status === 'scheduled' && (
                <CountdownBadge kickoff={match.kickoff} />
              )}
            </div>
          </div>
        </div>

        {/* Live progress bar */}
        {isLive && match.match_minute && (
          <ProgressBar minute={match.match_minute} />
        )}
      </div>
    </Link>
  )
}
