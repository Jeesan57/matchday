import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

export const revalidate = 60

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, total_points, username, current_streak, best_streak')
    .order('total_points', { ascending: false })
    .limit(100)

  if (!profiles || profiles.length === 0) {
    return (
      <div className="pb-16">
        <div className="pt-2 pb-7 border-b border-white/[0.05] mb-8">
          <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-emerald-500/70 mb-2">
            FIFA World Cup 2026
          </p>
          <h1 className="text-3xl font-black tracking-tight leading-none">Leaderboard</h1>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-14 text-center">
          <p className="text-3xl mb-3 opacity-40">🏆</p>
          <p className="text-sm font-medium text-white/30">No scores yet</p>
          <p className="text-xs text-white/20 mt-1">Check back after matches are played</p>
        </div>
      </div>
    )
  }

  const top3 = profiles.slice(0, 3)
  const rest = profiles.slice(3)
  const maxPoints = profiles[0]?.total_points ?? 1
  const currentUserRank = profiles.findIndex(p => p.id === user?.id)
  const currentUserInRest = currentUserRank >= 3

  return (
    <div className="pb-16">

      {/* Hero */}
      <div className="pt-2 pb-7 border-b border-white/[0.05] mb-8">
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-emerald-500/70 mb-2">
          FIFA World Cup 2026
        </p>
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-3xl font-black tracking-tight leading-none">Leaderboard</h1>
          <span className="text-sm font-semibold text-white/25 pb-0.5 tabular-nums">
            {profiles.length} players
          </span>
        </div>
        <p className="text-sm text-white/30 mt-2">
          Top predictors · updated after every match
        </p>
      </div>

      {/* Podium — top 3 */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { profile: top3[1], rank: 2, order: 'order-1' },
          { profile: top3[0], rank: 1, order: 'order-2' },
          { profile: top3[2], rank: 3, order: 'order-3' },
        ].map(({ profile, rank, order }) => {
          if (!profile) return <div key={rank} className={order} />
          const isCurrentUser = profile.id === user?.id
          const podiumBorder =
            rank === 1
              ? 'border-amber-400/35 shadow-[0_0_28px_-6px_rgba(251,191,36,0.18)]'
              : rank === 2
                ? 'border-slate-400/25'
                : 'border-orange-800/25'
          const rankColor =
            rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-400' : 'text-orange-600'
          const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'

          return (
            <div
              key={profile.id}
              className={[
                order,
                'relative flex flex-col items-center text-center rounded-2xl px-2 py-4',
                'border bg-white/[0.03] transition-all duration-200',
                podiumBorder,
                rank === 1 ? 'py-6' : '',
                isCurrentUser ? 'ring-1 ring-emerald-500/30' : '',
              ].join(' ')}
            >
              <span className="text-xl mb-2 leading-none">{medal}</span>

              <Avatar className={`mb-2 ring-2 ring-white/[0.07] ${rank === 1 ? 'h-12 w-12' : 'h-9 w-9'}`}>
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="bg-white/[0.06] text-white/60 text-xs font-bold">
                  {(profile.name ?? 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {profile.username ? (
                <Link
                  href={`/user/${profile.username}`}
                  className="text-[11px] font-bold text-white/85 hover:text-white truncate w-full leading-tight transition-colors"
                >
                  {profile.name ?? 'Anonymous'}
                </Link>
              ) : (
                <span className="text-[11px] font-bold text-white/85 truncate w-full leading-tight">
                  {profile.name ?? 'Anonymous'}
                </span>
              )}

              {isCurrentUser && (
                <span className="text-[9px] text-emerald-400 font-bold tracking-wide mt-0.5">YOU</span>
              )}

              <span className={`text-[12px] font-black tabular-nums mt-2 ${rankColor}`}>
                {profile.total_points}
                <span className="text-[9px] font-semibold opacity-60 ml-0.5">pts</span>
              </span>

              {(profile.current_streak ?? 0) >= 2 && (
                <span className="text-[9px] text-orange-400 mt-1">
                  🔥 {profile.current_streak} streak
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Rest of list */}
      {rest.length > 0 && (
        <div className="rounded-2xl border border-white/[0.07] overflow-hidden">

          {/* Column headers */}
          <div className="grid items-center px-4 py-2 bg-white/[0.02] border-b border-white/[0.05]"
            style={{ gridTemplateColumns: '36px 28px 1fr 56px 80px' }}>
            <span />
            <span />
            <span className="text-[10px] font-bold tracking-widest uppercase text-white/20">Player</span>
            <span className="text-center text-[10px] font-bold tracking-widest uppercase text-white/20">Streak</span>
            <span className="text-right text-[10px] font-bold tracking-widest uppercase text-white/30">Points</span>
          </div>

          {rest.map((profile, i) => {
            const rank = i + 4
            const isCurrentUser = profile.id === user?.id
            const pts = profile.total_points ?? 0
            const barPct = maxPoints > 0 ? Math.max(2, Math.round((pts / maxPoints) * 100)) : 2
            const hasStreak = (profile.current_streak ?? 0) >= 2

            // Milestone rows — visual breathing room every 10
            const showDivider = rank % 10 === 0 && rank !== profiles.length

            return (
              <div key={profile.id}>
                <div
                  className={[
                    'grid items-center px-4 py-2.5',
                    'border-b border-white/[0.04] last:border-b-0',
                    'transition-colors duration-150 group',
                    isCurrentUser
                      ? 'bg-emerald-500/[0.06] border-l-2 border-l-emerald-500/50'
                      : 'hover:bg-white/[0.03] border-l-2 border-l-transparent',
                  ].join(' ')}
                  style={{ gridTemplateColumns: '36px 28px 1fr 56px 80px' }}
                >
                  {/* Rank */}
                  <span className={`text-[11px] font-black tabular-nums text-right pr-2 ${isCurrentUser ? 'text-emerald-500/70' : 'text-white/15'
                    }`}>
                    {rank}
                  </span>

                  {/* Avatar */}
                  <Avatar className="h-6 w-6 ring-1 ring-white/[0.06] shrink-0">
                    <AvatarImage src={profile.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-white/[0.06] text-white/40 text-[9px] font-bold">
                      {(profile.name ?? 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name + bar */}
                  <div className="min-w-0 pl-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      {profile.username ? (
                        <Link
                          href={`/user/${profile.username}`}
                          className={`text-[12px] font-semibold truncate leading-none transition-colors hover:text-white ${isCurrentUser ? 'text-emerald-300' : 'text-white/75'
                            }`}
                        >
                          {profile.name ?? 'Anonymous'}
                        </Link>
                      ) : (
                        <span className={`text-[12px] font-semibold truncate leading-none ${isCurrentUser ? 'text-emerald-300' : 'text-white/75'
                          }`}>
                          {profile.name ?? 'Anonymous'}
                        </span>
                      )}
                      {isCurrentUser && (
                        <span className="text-[9px] font-black text-emerald-500 tracking-wide shrink-0">YOU</span>
                      )}
                    </div>
                    {/* Bar */}
                    <div className="h-[2px] rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isCurrentUser ? 'bg-emerald-500/50' : 'bg-white/[0.15]'
                          }`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Streak */}
                  <div className="text-center">
                    {hasStreak ? (
                      <span className="text-[11px] text-orange-400 tabular-nums">
                        🔥{profile.current_streak}
                      </span>
                    ) : (
                      <span className="text-[11px] text-white/10">—</span>
                    )}
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <span className={`text-[13px] font-black tabular-nums ${isCurrentUser ? 'text-emerald-400' : 'text-white/55'
                      }`}>
                      {pts}
                    </span>
                    <span className="text-[9px] text-white/20 ml-0.5">pts</span>
                  </div>
                </div>

                {/* Milestone divider */}
                {showDivider && (
                  <div className="flex items-center gap-3 px-4 py-1.5 bg-white/[0.015]">
                    <div className="flex-1 h-px bg-white/[0.04]" />
                    <span className="text-[9px] font-bold tracking-widest uppercase text-white/15">
                      Top {rank}
                    </span>
                    <div className="flex-1 h-px bg-white/[0.04]" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Current user sticky summary — shown if user is ranked 4+ */}
      {currentUserInRest && user && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-500/30 bg-[#0c0f14]/95 backdrop-blur-md shadow-[0_8px_32px_-4px_rgba(0,0,0,0.6)]">
            <span className="text-[11px] font-black text-emerald-500/60 tabular-nums w-7 text-right shrink-0">
              #{currentUserRank + 1}
            </span>
            <Avatar className="h-6 w-6 ring-1 ring-emerald-500/30 shrink-0">
              <AvatarImage src={profiles[currentUserRank]?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">
                {(profiles[currentUserRank]?.name ?? 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-[12px] font-semibold text-emerald-300 truncate flex-1">
              {profiles[currentUserRank]?.name ?? 'You'}
            </span>
            <span className="text-[13px] font-black text-emerald-400 tabular-nums shrink-0">
              {profiles[currentUserRank]?.total_points ?? 0}
              <span className="text-[9px] font-semibold text-emerald-500/50 ml-0.5">pts</span>
            </span>
            {/* Gap to next rank */}
            {currentUserRank > 0 && (
              <span className="text-[10px] text-white/25 shrink-0 tabular-nums">
                -{(profiles[currentUserRank - 1]?.total_points ?? 0) - (profiles[currentUserRank]?.total_points ?? 0)} to #{currentUserRank}
              </span>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
