export const revalidate = 3600

type TeamInfo = {
  id: string
  name_en: string
  flag: string
  fifa_code: string
  groups: string
}

type TeamsResponse = { teams?: TeamInfo[] }

export default async function TeamsPage() {
  const res = await fetch('https://worldcup26.ir/get/teams', {
    next: { revalidate: 3600 },
  })
  const data: TeamsResponse = await res.json()

  const teams = (data.teams ?? []).sort((a, b) =>
    a.groups.localeCompare(b.groups) || a.name_en.localeCompare(b.name_en)
  )

  const grouped: Record<string, TeamInfo[]> = {}
  for (const team of teams) {
    if (!grouped[team.groups]) grouped[team.groups] = []
    grouped[team.groups].push(team)
  }

  const sortedGroups = Object.keys(grouped).sort()

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground mt-1">
            {teams.length} nations · World Cup 2026
          </p>
        </div>
        <span className="text-4xl">🏆</span>
      </div>

      {/* Groups */}
      <div className="space-y-8">
        {sortedGroups.map(group => (
          <div key={group}>
            {/* Group label */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-6 w-1 rounded-full bg-primary" />
              <h2 className="font-bold text-lg">Group {group}</h2>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Team cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {grouped[group].map(team => (
                <div
                  key={team.id}
                  className="group border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-md transition-all duration-200 bg-card"
                >
                  {/* Flag banner */}
                  <div className="relative h-24 overflow-hidden bg-muted/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={team.flag}
                      alt={team.name_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ objectPosition: 'center' }}
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {/* FIFA code badge */}
                    <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {team.fifa_code}
                    </span>
                  </div>

                  {/* Team info */}
                  <div className="px-3 py-2.5">
                    <p className="font-semibold text-sm leading-tight">{team.name_en}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Group {team.groups}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
