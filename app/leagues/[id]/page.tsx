import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get league details
  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', id)
    .single()

  if (!league) notFound()

  // Get members with their points
  const { data: members } = await supabase
    .from('league_members')
    .select(`
      user_id,
      profiles (
        id, name, avatar_url, total_points
      )
    `)
    .eq('league_id', id)
    .order('joined_at', { ascending: true })

  const sorted = (members ?? [])
    .map(m => m.profiles as any)
    .sort((a: any, b: any) => b.total_points - a.total_points)

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* League header */}
      <div className="border rounded-xl p-6 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{league.name}</h1>
            {league.sponsor_name && (
              <p className="text-sm text-muted-foreground">Sponsored by {league.sponsor_name}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Invite code</p>
            <Badge variant="outline" className="font-mono text-base px-3 py-1">
              {league.code}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Share the invite code with friends to let them join.
        </p>
      </div>

      {/* Leaderboard */}
      <div>
        <h2 className="font-semibold mb-3">Standings — {sorted.length} members</h2>
        <div className="border rounded-xl overflow-hidden">
          {sorted.map((profile: any, index: number) => {
            const rank = index + 1
            const isCurrentUser = profile.id === user?.id
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null

            return (
              <div
                key={profile.id}
                className={`flex items-center gap-4 px-4 py-3 border-b last:border-b-0
                  ${isCurrentUser ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-accent/50'}`}
              >
                <div className="w-8 text-center">
                  {medal
                    ? <span className="text-xl">{medal}</span>
                    : <span className="text-sm text-muted-foreground">{rank}</span>
                  }
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>{(profile.name ?? 'U')[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {profile.name ?? 'Anonymous'}
                    {isCurrentUser && <span className="ml-2 text-xs text-primary">(you)</span>}
                  </p>
                </div>
                <Badge variant={isCurrentUser ? 'default' : 'secondary'}>
                  {profile.total_points} pts
                </Badge>
              </div>
            )
          })}
        </div>
      </div>

      <Button asChild variant="outline" className="w-full">
        <Link href="/leagues">← Back to Leagues</Link>
      </Button>
    </div>
  )
}
