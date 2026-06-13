import { createClient } from '@/lib/supabase/server'
import MatchCard from '@/components/MatchCard'
import { Separator } from '@/components/ui/separator'

export const revalidate = 60 // refresh every 60 seconds

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch today's matches + upcoming
  const today = new Date()
  const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  const { data: todayMatches } = await supabase
    .from('matches')
    .select('*')
    .gte('kickoff', todayStart)
    .lte('kickoff', todayEnd)
    .order('kickoff', { ascending: true })

  const { data: liveMatches } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'live')
    .order('kickoff', { ascending: true })

  const { data: upcomingMatches } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'scheduled')
    .gt('kickoff', todayEnd)
    .order('kickoff', { ascending: true })
    .limit(5)

  // Merge live into today (avoid duplicates)
  const liveIds = new Set((liveMatches ?? []).map(m => m.id))
  const todayOnly = (todayMatches ?? []).filter(m => !liveIds.has(m.id))
  const allToday = [...(liveMatches ?? []), ...todayOnly]

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <h1 className="text-3xl font-bold">World Cup 2026 ⚽</h1>
        <p className="text-muted-foreground mt-1">Predict scores, earn points, top the leaderboard.</p>
      </div>

      {/* Live matches */}
      {(liveMatches ?? []).length > 0 && (
        <section>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 live-dot inline-block" />
            Live Now
          </h2>
          <div className="grid gap-3">
            {liveMatches!.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Today's matches */}
      <section>
        <h2 className="font-semibold mb-3">Today's Matches</h2>
        {allToday.length > 0 ? (
          <div className="grid gap-3">
            {allToday.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No matches today.</p>
        )}
      </section>

      {/* Upcoming */}
      {(upcomingMatches ?? []).length > 0 && (
        <>
          <Separator />
          <section>
            <h2 className="font-semibold mb-3">Upcoming Matches</h2>
            <div className="grid gap-3">
              {upcomingMatches!.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
