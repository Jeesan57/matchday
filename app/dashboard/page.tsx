import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toBDTime } from '@/lib/format-time'
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
  created_at: string
  matches: MatchData
}

function FlagImg({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return null
  return <img src={src} alt={alt} className="w-6 h-4 object-cover rounded-sm shrink-0" />
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: predictions } = await supabase
    .from('predictions')
    .select(`
      id, pred_home, pred_away, points_awarded, scored_at, created_at,
      matches (
        id, home_team, away_team, home_flag, away_flag,
        home_score, away_score, status, kickoff
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const typedPredictions = (predictions ?? []) as unknown as PredictionWithMatch[]
  const scored = typedPredictions.filter(p => p.scored_at !== null)
  const pending = typedPredictions.filter(p => p.scored_at === null)
  const exact = scored.filter(p => p.points_awarded === 5)
  const correct = scored.filter(p => p.points_awarded === 3)

  // Get global rank
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, total_points')
    .order('total_points', { ascending: false })
  const rank = (allProfiles ?? []).findIndex(p => p.id === profile?.id) + 1

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Profile card with actions */}
      <div className="border rounded-xl p-6 space-y-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-lg">
              {(profile?.name ?? 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{profile?.name ?? 'Anonymous'}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {profile?.username && (
              <Link
                href={`/user/${profile.username}`}
                className="text-xs text-primary hover:underline mt-0.5 inline-block"
              >
                View public profile →
              </Link>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold">{profile?.total_points ?? 0}</p>
            <p className="text-xs text-muted-foreground">total points</p>
            {rank > 0 && (
              <p className="text-xs text-muted-foreground">#{rank} globally</p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button asChild size="sm" className="flex-1">
            <Link href="/predict">Make Predictions</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{typedPredictions.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-yellow-500">{pending.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending ⏳</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-500">{exact.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Exact 🎯</p>
        </div>
        <div className="border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-500">{correct.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Correct ✅</p>
        </div>
      </div>

      {/* Pending predictions — with kickoff time, actionable */}
      {pending.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Pending ⏳</h2>
            <span className="text-xs text-muted-foreground">Points awarded after FT</span>
          </div>
          <div className="space-y-2">
            {pending.map(p => (
              <Link key={p.id} href={`/matches/${p.matches.id}`}>
                <div className="border rounded-lg px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-2 text-sm min-w-0">
                    <FlagImg src={p.matches.home_flag} alt={p.matches.home_team} />
                    <span className="truncate">{p.matches.home_team}</span>
                    <span className="text-muted-foreground shrink-0">vs</span>
                    <span className="truncate">{p.matches.away_team}</span>
                    <FlagImg src={p.matches.away_flag} alt={p.matches.away_team} />
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-mono font-bold">
                      {p.pred_home}–{p.pred_away}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {p.matches.status === 'live'
                        ? '🔴 Live'
                        : p.matches.status === 'finished'
                          ? 'Scoring...'
                          : toBDTime(p.matches.kickoff)}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Scored predictions */}
      {scored.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">Results</h2>
          <div className="space-y-2">
            {scored.map(p => {
              const pts = p.points_awarded ?? 0
              const label = pts === 5 ? '🎯 Exact' : pts === 3 ? '✅ Correct' : '❌ Wrong'
              return (
                <Link key={p.id} href={`/matches/${p.matches.id}`}>
                  <div className="border rounded-lg px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <FlagImg src={p.matches.home_flag} alt={p.matches.home_team} />
                      <span className="truncate">{p.matches.home_team}</span>
                      <span className="text-muted-foreground font-mono shrink-0">
                        {p.matches.home_score}–{p.matches.away_score}
                      </span>
                      <span className="truncate">{p.matches.away_team}</span>
                      <FlagImg src={p.matches.away_flag} alt={p.matches.away_team} />
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        {p.pred_home}–{p.pred_away}
                      </span>
                      <Badge variant={pts >= 3 ? 'default' : 'secondary'} className="text-xs">
                        {label} +{pts}
                      </Badge>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {typedPredictions.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <p className="text-4xl">⚽</p>
          <p className="font-medium">No predictions yet</p>
          <Button asChild>
            <Link href="/predict">Make your first prediction</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
