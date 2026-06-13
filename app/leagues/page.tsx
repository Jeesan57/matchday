import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import CreateLeagueForm from '@/components/CreateLeagueForm'
import JoinLeagueForm from '@/components/JoinLeagueForm'

export default async function LeaguesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get leagues user is a member of
  const { data: memberships } = await supabase
    .from('league_members')
    .select(`
      league_id,
      leagues (
        id, name, code, sponsor_name,
        league_members ( count )
      )
    `)
    .eq('user_id', user.id)

  const leagues = (memberships ?? []).map(m => m.leagues as any)

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Leagues</h1>
        <p className="text-muted-foreground mt-1">
          Create a private league or join one with an invite code.
        </p>
      </div>

      {/* My leagues */}
      {leagues.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">My Leagues</h2>
          <div className="space-y-3">
            {leagues.map((league: any) => (
              <Link key={league.id} href={`/leagues/${league.id}`}>
                <div className="border rounded-xl px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors">
                  <div>
                    <p className="font-medium">{league.name}</p>
                    {league.sponsor_name && (
                      <p className="text-xs text-muted-foreground">
                        Sponsored by {league.sponsor_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      {league.code}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Create + Join */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">Create a League</h2>
          <CreateLeagueForm />
        </div>
        <div className="border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">Join a League</h2>
          <JoinLeagueForm />
        </div>
      </div>
    </div>
  )
}
