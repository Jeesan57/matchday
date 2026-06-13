import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export const revalidate = 60

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, total_points')
    .order('total_points', { ascending: false })
    .limit(50)

  if (!profiles || profiles.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Leaderboard 🏆</h1>
        <p className="text-muted-foreground">No predictions scored yet. Check back after matches finish.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard 🏆</h1>
        <p className="text-muted-foreground mt-1">Top predictors after scored matches</p>
      </div>

      <div className="border rounded-xl overflow-hidden">
        {profiles.map((profile, index) => {
          const rank = index + 1
          const isCurrentUser = profile.id === user?.id
          const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null

          return (
            <div
              key={profile.id}
              className={`flex items-center gap-4 px-4 py-3 border-b last:border-b-0 transition-colors
                ${isCurrentUser ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-accent/50'}`}
            >
              {/* Rank */}
              <div className="w-8 text-center">
                {medal ? (
                  <span className="text-xl">{medal}</span>
                ) : (
                  <span className="text-sm text-muted-foreground font-medium">{rank}</span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback>
                  {(profile.name ?? 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {profile.name ?? 'Anonymous'}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-primary font-normal">(you)</span>
                  )}
                </p>
              </div>

              {/* Points */}
              <div className="flex items-center gap-2">
                <Badge variant={isCurrentUser ? 'default' : 'secondary'}>
                  {profile.total_points} pts
                </Badge>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
