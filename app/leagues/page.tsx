import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CreateLeagueForm from '@/components/CreateLeagueForm'
import JoinLeagueForm from '@/components/JoinLeagueForm'

type LeagueData = {
  id: number
  name: string
  code: string
  sponsor_name: string | null
}

type MembershipData = {
  league_id: number
  leagues: LeagueData
}

export default async function LeaguesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('league_members')
    .select(`league_id, leagues ( id, name, code, sponsor_name )`)
    .eq('user_id', user.id)

  const leagues = ((memberships ?? []) as unknown as MembershipData[]).map(m => m.leagues)

  return (
    <div className="pb-16">

      {/* Hero */}
      <div className="pt-2 pb-7 border-b border-white/[0.05] mb-8">
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-emerald-500/70 mb-2">
          FIFA World Cup 2026
        </p>
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-3xl font-black tracking-tight leading-none">Leagues</h1>
          {leagues.length > 0 && (
            <span className="text-sm font-semibold text-white/25 pb-0.5 tabular-nums">
              {leagues.length} joined
            </span>
          )}
        </div>
        <p className="text-sm text-white/30 mt-2">
          Compete privately · invite friends · climb your own table
        </p>
      </div>

      {/* My leagues */}
      {leagues.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-[11px] font-black tracking-[0.18em] uppercase text-white/40">
              My Leagues
            </h2>
            <div className="flex-1 h-px bg-white/[0.05]" />
          </div>

          <div className="space-y-2.5">
            {leagues.map((league) => (
              <Link key={league.id} href={`/leagues/${league.id}`} className="block group">
                <div className={[
                  'relative flex items-center justify-between gap-4',
                  'px-5 py-4 rounded-2xl border border-white/[0.07] bg-white/[0.03]',
                  'hover:bg-white/[0.06] hover:border-white/[0.12] hover:-translate-y-px',
                  'transition-all duration-200',
                ].join(' ')}>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white/90 truncate leading-tight">
                      {league.name}
                    </p>
                    {league.sponsor_name && (
                      <p className="text-[11px] text-emerald-400/70 mt-0.5 truncate">
                        Sponsored by {league.sponsor_name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-black tracking-[0.15em] font-mono text-white/25 bg-white/[0.05] px-2.5 py-1 rounded-lg">
                      {league.code}
                    </span>
                    <svg className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" fill="none" viewBox="0 0 16 16">
                      <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Create + Join */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Create */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 16 16">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="text-sm font-black text-white/80">Create a League</h2>
            </div>
            <p className="text-[11px] text-white/30 pl-10">
              Start a private league and invite your friends
            </p>
          </div>
          <div className="px-5 py-5">
            <CreateLeagueForm />
          </div>
        </div>

        {/* Join */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 16 16">
                  <path d="M13 8H3M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-sm font-black text-white/80">Join a League</h2>
            </div>
            <p className="text-[11px] text-white/30 pl-10">
              Enter an invite code to join a friend's league
            </p>
          </div>
          <div className="px-5 py-5">
            <JoinLeagueForm />
          </div>
        </div>

      </div>

      {/* Empty state */}
      {leagues.length === 0 && (
        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-10 text-center">
          <p className="text-2xl mb-3 opacity-30">🏆</p>
          <p className="text-sm font-medium text-white/30">You haven't joined any leagues yet</p>
          <p className="text-xs text-white/20 mt-1">Create one above or enter a code to join a friend's</p>
        </div>
      )}

    </div>
  )
}
