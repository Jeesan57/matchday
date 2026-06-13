import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'

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

type PredictionWithMatch = {
  id: number
  pred_home: number
  pred_away: number
  points_awarded: number | null
  scored_at: string | null
  matches: MatchData
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Get profile by username
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  // Get their predictions with match data
  const { data: predictions } = await supabase
    .from('predictions')
    .select(`
      id, pred_home, pred_away, points_awarded, scored_at,
      matches (
        id, home_team, away_team, home_flag, away_flag,
        home_score, away_score, status, kickoff
      )
    `)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const typed = (predictions ?? []) as unknown as PredictionWithMatch[]
  const scored = typed.filter(p => p.scored_at !== null)
  const exact = scored.filter(p => p.points_awarded === 5)
  const correct = scored.filter(p => p.points_awarded === 3)
  const wrong = scored.filter(p => p.points_awarded === 0)
  const accuracy = scored.length > 0
    ? Math.round(((exact.length + correct.length) / scored.length) * 100)
    : 0

  // Get global rank
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, total_points')
    .order('total_points', { ascending: false })

  const rank = (allProfiles ?? []).findIndex(p => p.id === profile.id) + 1

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Profile header */}
      <div className="border rounded-xl p-6 space-y-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-2xl">
              {(profile.name ?? 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{profile.name ?? 'Anonymous'}</h1>
              {isOwnProfile && (
                <Badge variant="outline" className="text-xs">You</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.favorite_team && (
              <p className="text-sm text-muted-foreground mt-1">
                ❤️ {profile.favorite_team}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold">{profile.total_points}</p>
            <p className="text-xs text-muted-foreground">total points</p>
            {rank > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                #{rank} globally
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{typed.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Predictions</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-500">{exact.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Exact 🎯</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-500">{correct.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Correct ✅</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{accuracy}%</p>
          <p className="text-xs text-muted-foreground mt-1">Accuracy</p>
        </div>
      </div>

      {/* Prediction accuracy bar */}
      {scored.length > 0 && (
        <div className="border rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-sm">Prediction Breakdown</h2>
          <div className="space-y-2">
            {[
              { label: '🎯 Exact score', count: exact.length, color: 'bg-green-500' },
              { label: '✅ Correct result', count: correct.length, color: 'bg-blue-500' },
              { label: '❌ Wrong', count: wrong.length, color: 'bg-red-400' },
            ].map(({ label, count, color }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{label}</span>
                  <span>{count} / {scored.length}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all`}
                    style={{ width: `${scored.length > 0 ? (count / scored.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Predictions list */}
      <div>
        <h2 className="font-semibold mb-3">
          Predictions
          <span className="text-muted-foreground font-normal text-sm ml-2">
            ({typed.length})
          </span>
        </h2>

        {typed.length === 0 ? (
          <div className="border rounded-xl p-8 text-center">
            <p className="text-4xl mb-2">⚽</p>
            <p className="text-muted-foreground text-sm">No predictions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {typed.map(p => {
              const m = p.matches
              const pts = p.points_awarded
              const isScored = p.scored_at !== null
              const label = pts === 5 ? '🎯 Exact' : pts === 3 ? '✅ Correct' : pts === 0 ? '❌ Wrong' : null

              return (
                <Link key={p.id} href={`/matches/${m.id}`}>
                  <div className="border rounded-lg px-4 py-3 flex items-center gap-3 hover:bg-accent/50 transition-colors">
                    {/* Match */}
                    <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
                      {m.home_flag && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.home_flag} alt={m.home_team} className="w-6 h-4 object-cover rounded-sm shrink-0" />
                      )}
                      <span className="font-medium truncate hidden sm:block">{m.home_team}</span>
                      {m.status === 'finished' ? (
                        <span className="text-xs font-mono text-muted-foreground shrink-0">
                          {m.home_score}–{m.away_score}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground shrink-0">vs</span>
                      )}
                      <span className="font-medium truncate hidden sm:block">{m.away_team}</span>
                      {m.away_flag && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.away_flag} alt={m.away_team} className="w-6 h-4 object-cover rounded-sm shrink-0" />
                      )}
                    </div>

                    {/* Prediction */}
                    <span className="font-mono font-semibold text-sm shrink-0">
                      {p.pred_home}–{p.pred_away}
                    </span>

                    {/* Result */}
                    {isScored && label ? (
                      <Badge
                        variant={pts! >= 3 ? 'default' : 'secondary'}
                        className="text-xs shrink-0"
                      >
                        {label} · +{pts}
                      </Badge>
                    ) : m.status === 'scheduled' ? (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(m.kickoff), 'd MMM')}
                      </span>
                    ) : (
                      <Badge variant="outline" className="text-xs shrink-0">pending</Badge>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
