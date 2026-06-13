import { createClient } from '@/lib/supabase/server'
import MatchTabs from '@/components/MatchTabs'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()

  const today = new Date()
  const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  const [
    { data: liveMatches },
    { data: todayMatches },
    { data: recentMatches },
    { data: upcomingMatches },
  ] = await Promise.all([
    supabase
      .from('matches')
      .select('*')
      .eq('status', 'live')
      .order('kickoff', { ascending: true }),
    supabase
      .from('matches')
      .select('*')
      .gte('kickoff', todayStart)
      .lte('kickoff', todayEnd)
      .order('kickoff', { ascending: true }),
    supabase
      .from('matches')
      .select('*')
      .eq('status', 'finished')
      .order('kickoff', { ascending: false })
      .limit(10),
    supabase
      .from('matches')
      .select('*')
      .eq('status', 'scheduled')
      .gt('kickoff', todayEnd)
      .order('kickoff', { ascending: true })
      .limit(20),
  ])

  // Deduplicate: live matches also appear in today query
  const liveIds = new Set((liveMatches ?? []).map((m) => m.id))
  const todayOnly = (todayMatches ?? []).filter((m) => !liveIds.has(m.id))

  return (
    <div className="pb-16">
      {/* Hero */}
      <div className="pt-2 pb-7 border-b border-white/[0.05] mb-7">
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-emerald-500/70 mb-2">
          FIFA World Cup 2026
        </p>
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-3xl font-black tracking-tight leading-none">
            Match Centre
          </h1>
          {(liveMatches ?? []).length > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 pb-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {liveMatches!.length} live
            </span>
          )}
        </div>
        <p className="text-sm text-white/30 mt-2">
          Predict scores · earn points · top the board
        </p>
      </div>

      {/* Tabs */}
      <MatchTabs
        liveMatches={liveMatches ?? []}
        todayMatches={todayOnly}
        recentMatches={recentMatches ?? []}
        upcomingMatches={upcomingMatches ?? []}
      />
    </div>
  )
}
