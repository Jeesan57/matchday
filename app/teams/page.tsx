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

  const teams = (data.teams ?? []).sort(
    (a, b) => a.groups.localeCompare(b.groups) || a.name_en.localeCompare(b.name_en)
  )

  const grouped: Record<string, TeamInfo[]> = {}
  for (const team of teams) {
    if (!grouped[team.groups]) grouped[team.groups] = []
    grouped[team.groups].push(team)
  }

  const sortedGroups = Object.keys(grouped).sort()

  return (
    <div className="pb-16">

      {/* Hero */}
      <div className="pt-2 pb-7 border-b border-white/[0.05] mb-10">
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-emerald-500/70 mb-2">
          FIFA World Cup 2026
        </p>
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-3xl font-black tracking-tight leading-none">Teams</h1>
          <span className="text-sm font-semibold text-white/25 pb-0.5 tabular-nums">
            {teams.length} nations
          </span>
        </div>
        <p className="text-sm text-white/30 mt-2">
          {sortedGroups.length} groups · Group Stage
        </p>
      </div>

      {/* Groups */}
      <div className="space-y-12">
        {sortedGroups.map(group => (
          <div key={group}>

            {/* Group label */}
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-[11px] font-black tracking-[0.18em] uppercase text-white/40">
                Group {group}
              </h2>
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[10px] font-semibold tracking-widest uppercase text-white/20">
                {grouped[group].length} teams
              </span>
            </div>

            {/* Team cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {grouped[group].map(team => (
                <div
                  key={team.id}
                  className={[
                    'group relative rounded-2xl overflow-hidden cursor-default',
                    'border border-white/[0.07] bg-white/[0.03]',
                    'hover:border-white/[0.14] hover:-translate-y-0.5',
                    'transition-all duration-200',
                  ].join(' ')}
                >
                  {/* Flag banner */}
                  <div className="relative h-[72px] overflow-hidden bg-white/[0.04]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={team.flag}
                      alt={team.name_en}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                    />
                    {/* Bottom fade so text below reads cleanly */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f14]/80 via-transparent to-transparent" />

                    {/* FIFA code — bottom left over the fade */}
                    <span className="absolute bottom-2 left-3 text-[10px] font-black tracking-widest text-white/60">
                      {team.fifa_code}
                    </span>
                  </div>

                  {/* Team name */}
                  <div className="px-3 py-2.5">
                    <p className="font-semibold text-[12px] text-white/85 leading-tight truncate">
                      {team.name_en}
                    </p>
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
