import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get all predictions with match data
  const { data: predictions } = await supabase
    .from('predictions')
    .select(`
      *,
      matches (
        id, home_team, away_team, home_flag, away_flag,
        home_score, away_score, status, kickoff
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const scored = (predictions ?? []).filter(p => p.scored_at !== null)
  const pending = (predictions ?? []).filter(p => p.scored_at === null)

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Profile card */}
      <div className="border rounded-xl p-6 flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="text-lg">
            {(profile?.name ?? 'U')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{profile?.name ?? 'Anonymous'}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold">{profile?.total_points ?? 0}</p>
          <p className="text-xs text-muted-foreground">total points</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{predictions?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Predictions</p>
        </div>
        <div className="border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">
            {scored.filter(p => p.points_awarded === 5).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Exact Scores 🎯</p>
        </div>
        <div className="border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">
            {scored.filter(p => p.points_awarded === 3).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Correct Results ✅</p>
        </div>
      </div>

      {/* Pending predictions */}
      {pending.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">Pending ⏳</h2>
          <div className="space-y-2">
            {pending.map(p => {
              const m = p.matches as any
              return (
                <Link key={p.id} href={`/matches/${m.id}`}>
                  <div className="border rounded-lg px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2 text-sm">
                      <span>{m.home_flag} {m.home_team}</span>
                      <span className="text-muted-foreground">vs</span>
                      <span>{m.away_team} {m.away_flag}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono font-medium">
                        {p.pred_home} – {p.pred_away}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {m.status === 'live' ? '🔴 Live' : format(new Date(m.kickoff), 'd MMM HH:mm')}
                      </Badge>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Scored predictions */}
      {scored.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">Results</h2>
          <div className="space-y-2">
            {scored.map(p => {
              const m = p.matches as any
              const pts = p.points_awarded ?? 0
              const label = pts === 5 ? '🎯 Exact' : pts === 3 ? '✅ Correct' : '❌ Wrong'
              const badgeVariant = pts >= 3 ? 'default' : 'secondary'

              return (
                <Link key={p.id} href={`/matches/${m.id}`}>
                  <div className="border rounded-lg px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2 text-sm">
                      <span>{m.home_flag} {m.home_team}</span>
                      <span className="text-muted-foreground font-mono">
                        {m.home_score}–{m.away_score}
                      </span>
                      <span>{m.away_team} {m.away_flag}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono">
                        your: {p.pred_home}–{p.pred_away}
                      </span>
                      <Badge variant={badgeVariant} className="text-xs">
                        {label} · +{pts}
                      </Badge>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {(predictions ?? []).length === 0 && (
        <div className="text-center py-12 space-y-2">
          <p className="text-4xl">⚽</p>
          <p className="font-medium">No predictions yet</p>
          <p className="text-sm text-muted-foreground">
            Go to <Link href="/" className="text-primary underline underline-offset-4">Fixtures</Link> and make your first prediction
          </p>
        </div>
      )}
    </div>
  )
}
