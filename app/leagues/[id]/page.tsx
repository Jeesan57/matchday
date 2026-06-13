import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

type MemberWithProfile = {
  user_id: string
  profiles: ProfileData
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

  const { data: members } = await supabase
    .from('league_members')
    .select(`user_id, profiles ( id, name, avatar_url, total_points )`)
    .eq('league_id', id)

  const typedMembers = (members ?? []) as unknown as MemberWithProfile[]
  const memberIds = typedMembers.map(m => m.profiles.id)

  const sorted = typedMembers
    .map(m => m.profiles)
    .sort((a, b) => b.total_points - a.total_points)

  // Get all predictions from league members
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .in('user_id', memberIds)
    .order('match_id', { ascending: true })

  const typedPredictions = (predictions ?? []) as PredictionData[]

  // Get matches that have predictions
  const matchIds = [...new Set(typedPredictions.map(p => p.match_id))]
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_team, away_team, home_flag, away_flag, home_score, away_score, status, kickoff')
    .in('id', matchIds.length > 0 ? matchIds : [-1])
    .order('kickoff', { ascending: true })

  const typedMatches = (matches ?? []) as MatchData[]

  // Group predictions by match
  const predsByMatch: Record<number, PredictionData[]> = {}
  for (const pred of typedPredictions) {
    if (!predsByMatch[pred.match_id]) predsByMatch[pred.match_id] = []
    predsByMatch[pred.match_id].push(pred)
  }

  // Build profile map
  const profileMap: Record<string, ProfileData> = {}
  for (const m of typedMembers) {
    profileMap[m.profiles.id] = m.profiles
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* League header */}
      <div className="border rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{league.name}</h1>
            {league.sponsor_name && (
              <p className="text-sm text-muted-foreground mt-1">
                🏆 Sponsored by {league.sponsor_name}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {sorted.length} member{sorted.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Invite code</p>
              <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                {league.code}
              </Badge>
            </div>

            {/* Creator sees Delete, members see Leave */}
            {user?.id === league.created_by ? (
              <DeleteLeague
                leagueId={league.id}
                leagueName={league.name}
                createdBy={league.created_by}
              />
            ) : user ? (
              <LeaveLeague
                leagueId={league.id}
                leagueName={league.name}
              />
            ) : null}
          </div>
        </div>

        {/* Share section */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-3">Invite friends</p>
          <ShareLeague code={league.code} name={league.name} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="standings">
        <TabsList className="w-full">
          <TabsTrigger value="standings" className="flex-1">Standings</TabsTrigger>
          <TabsTrigger value="predictions" className="flex-1">Predictions</TabsTrigger>
        </TabsList>

        {/* Standings Tab */}
        <TabsContent value="standings" className="mt-4">
          <div className="border rounded-xl overflow-hidden">
            {sorted.map((profile, index) => {
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
                      : <span className="text-sm text-muted-foreground font-medium">{rank}</span>
                    }
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url ?? undefined} />
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
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="mt-4 space-y-4">
          {typedMatches.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-8">
              No predictions made yet in this league.
            </p>
          )}

          {typedMatches.map(match => {
            const matchPreds = predsByMatch[match.id] ?? []
            const isFinished = match.status === 'finished'

            return (
              <div key={match.id} className="border rounded-xl overflow-hidden">
                {/* Match header */}
                <div className="bg-muted/30 px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{match.home_flag}</span>
                      <span className="font-semibold text-sm">{match.home_team}</span>
                      {isFinished ? (
                        <span className="font-bold text-sm px-2">
                          {match.home_score} – {match.away_score}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm px-2">vs</span>
                      )}
                      <span className="font-semibold text-sm">{match.away_team}</span>
                      <span className="text-lg">{match.away_flag}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isFinished
                        ? <Badge variant="secondary" className="text-xs">FT</Badge>
                        : <span className="text-xs text-muted-foreground">
                          {format(new Date(match.kickoff), 'd MMM HH:mm')}
                        </span>
                      }
                    </div>
                  </div>
                </div>

                {/* Member predictions */}
                <div className="divide-y">
                  {matchPreds.map(pred => {
                    const profile = profileMap[pred.user_id]
                    if (!profile) return null
                    const pts = pred.points_awarded
                    const isCurrentUser = profile.id === user?.id

                    return (
                      <div
                        key={pred.id}
                        className={`flex items-center gap-3 px-4 py-2.5
                          ${isCurrentUser ? 'bg-primary/5' : 'hover:bg-accent/30'}`}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={profile.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {(profile.name ?? 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm flex-1 truncate">
                          {profile.name ?? 'Anonymous'}
                          {isCurrentUser && <span className="ml-1 text-xs text-primary">(you)</span>}
                        </span>
                        <span className="font-mono font-semibold text-sm">
                          {pred.pred_home} – {pred.pred_away}
                        </span>
                        {pts !== null && pred.scored_at && (
                          <Badge
                            variant={pts >= 3 ? 'default' : 'secondary'}
                            className="text-xs min-w-[52px] text-center"
                          >
                            {pts === 5 ? '🎯' : pts === 3 ? '✅' : '❌'} +{pts}
                          </Badge>
                        )}
                        {pts === null && isFinished && (
                          <Badge variant="outline" className="text-xs">pending</Badge>
                        )}
                        {!isFinished && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {match.status === 'live' ? '🔴 live' : 'upcoming'}
                          </Badge>
                        )}
                      </div>
                    )
                  })}

                  {/* Members who haven't predicted */}
                  {sorted
                    .filter(p => !matchPreds.find(pred => pred.user_id === p.id))
                    .map(profile => (
                      <div key={profile.id} className="flex items-center gap-3 px-4 py-2.5 opacity-40">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={profile.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {(profile.name ?? 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm flex-1">{profile.name ?? 'Anonymous'}</span>
                        <span className="text-xs text-muted-foreground italic">no prediction</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )
          })}
        </TabsContent>
      </Tabs>

      <Button asChild variant="outline" className="w-full">
        <Link href="/leagues">← Back to Leagues</Link>
      </Button>
    </div>
  )
}
