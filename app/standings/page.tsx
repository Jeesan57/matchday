export const revalidate = 300

type GroupTeam = {
  team_id: string
  mp: string
  w: string
  l: string
  d: string
  pts: string
  gf: string
  ga: string
  gd: string
}

type Group = {
  name: string
  teams: GroupTeam[]
}

type TeamInfo = {
  id: string
  name_en: string
  flag: string
}

type GameResult = {
  home_team_id: string
  away_team_id: string
  home_score: string
  away_score: string
  finished: string
}

type GroupsResponse = { groups?: Group[] }
type TeamsResponse = { teams?: TeamInfo[] }
type GamesResponse = { games?: GameResult[] }

function getLastFive(teamId: string, games: GameResult[]): ('W' | 'D' | 'L')[] {
  return games
    .filter(
      g =>
        g.finished === 'TRUE' &&
        (g.home_team_id === teamId || g.away_team_id === teamId)
    )
    .slice(-5)
    .map(g => {
      const isHome = g.home_team_id === teamId
      const scored = parseInt(isHome ? g.home_score : g.away_score)
      const conceded = parseInt(isHome ? g.away_score : g.home_score)
      if (scored > conceded) return 'W'
      if (scored === conceded) return 'D'
      return 'L'
    })
}

const resultConfig = {
  W: { className: 'bg-emerald-500', label: 'W' },
  D: { className: 'bg-amber-400', label: 'D' },
  L: { className: 'bg-red-500/75', label: 'L' },
} as const

// Single source of truth for both header and rows
// rank | team | MP | W | D | L | GF | GA | GD | Pts | Form
const COLS = '18px minmax(0,1fr) 30px 30px 30px 30px 30px 30px 34px 38px 96px'

// The team name starts at: 18px (rank) + gap(px-4=16px*2 outer, inner gap) + 22px flag + 6px gap
// We use pl-[28px] on the header "Team" label to align with flag+name in rows
const TEAM_HEADER_INDENT = 'pl-[28px]'

export default async function StandingsPage() {
  const [groupsRes, teamsRes, gamesRes] = await Promise.all([
    fetch('https://worldcup26.ir/get/groups', { next: { revalidate: 300 } }),
    fetch('https://worldcup26.ir/get/teams', { next: { revalidate: 300 } }),
    fetch('https://worldcup26.ir/get/games', { next: { revalidate: 300 } }),
  ])

  const [groupsData, teamsData, gamesData]: [GroupsResponse, TeamsResponse, GamesResponse] =
    await Promise.all([groupsRes.json(), teamsRes.json(), gamesRes.json()])

  const teamMap: Record<string, TeamInfo> = {}
  for (const team of teamsData.teams ?? []) {
    teamMap[String(team.id)] = team
  }

  const games = gamesData.games ?? []
  const groups = (groupsData.groups ?? []).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="pb-16">

      {/* Hero */}
      <div className="pt-2 pb-7 border-b border-white/[0.05] mb-8">
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-emerald-500/70 mb-2">
          FIFA World Cup 2026
        </p>
        <h1 className="text-3xl font-black tracking-tight leading-none">
          Group Standings
        </h1>
        <p className="text-sm text-white/30 mt-2">
          Group Stage · Top 2 from each group advance
        </p>
      </div>

      {/* Groups — single column so the wide table doesn't overflow */}
      <div className="space-y-4">
        {groups.map(group => {
          const sorted = [...group.teams].sort((a, b) => {
            const ptsDiff = parseInt(b.pts) - parseInt(a.pts)
            if (ptsDiff !== 0) return ptsDiff
            const gdDiff = parseInt(b.gd) - parseInt(a.gd)
            if (gdDiff !== 0) return gdDiff
            return parseInt(b.gf) - parseInt(a.gf)
          })

          return (
            <div
              key={group.name}
              className="rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.03]"
            >
              {/* Group header */}
              <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                <h2 className="text-xs font-black tracking-[0.15em] uppercase text-white/80">
                  Group {group.name}
                </h2>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-white/20">
                  {sorted.length} teams
                </span>
              </div>

              {/* Scrollable wrapper so it never breaks layout on small screens */}
              <div className="overflow-x-auto">
                <div style={{ minWidth: 560 }}>

                  {/* Column headers */}
                  <div
                    className="grid items-center px-4 py-2 border-b border-white/[0.05]"
                    style={{ gridTemplateColumns: COLS }}
                  >
                    <span />
                    <span className={`${TEAM_HEADER_INDENT} text-[10px] font-bold tracking-widest uppercase text-white/20`}>
                      Team
                    </span>
                    {['MP', 'W', 'D', 'L', 'GF', 'GA', 'GD'].map(col => (
                      <span
                        key={col}
                        className={`text-center text-[10px] font-bold tracking-widest uppercase ${col === 'W' ? 'text-white/40' : 'text-white/20'
                          }`}
                      >
                        {col}
                      </span>
                    ))}
                    <span className="text-center text-[10px] font-bold tracking-widest uppercase text-white/50">
                      Pts
                    </span>
                    <span className="text-center text-[10px] font-bold tracking-widest uppercase text-white/20">
                      Form
                    </span>
                  </div>

                  {/* Team rows */}
                  {sorted.map((entry, index) => {
                    const team = teamMap[entry.team_id]
                    if (!team) return null

                    const qualifying = index < 2
                    const gd = parseInt(entry.gd)
                    const pts = parseInt(entry.pts)
                    const last5 = getLastFive(entry.team_id, games)

                    return (
                      <div
                        key={entry.team_id}
                        className={[
                          'grid items-center px-4 py-3',
                          'border-b border-white/[0.04] last:border-b-0',
                          'transition-colors duration-150 hover:bg-white/[0.04]',
                          qualifying
                            ? 'border-l-2 border-l-emerald-500/60'
                            : 'border-l-2 border-l-transparent',
                        ].join(' ')}
                        style={{ gridTemplateColumns: COLS }}
                      >
                        {/* Rank */}
                        <span
                          className={`text-[11px] font-black leading-none ${qualifying ? 'text-emerald-500' : 'text-white/20'
                            }`}
                        >
                          {index + 1}
                        </span>

                        {/* Team */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={team.flag}
                            alt={team.name_en}
                            width={22}
                            height={15}
                            className="rounded-[3px] object-cover border border-white/[0.12] shrink-0"
                            style={{ width: 22, height: 15 }}
                          />
                          <span className="text-[12px] font-semibold text-white/85 truncate leading-tight">
                            {team.name_en}
                          </span>
                        </div>

                        {/* MP */}
                        <span className="text-center text-[12px] text-white/30 tabular-nums">
                          {entry.mp}
                        </span>

                        {/* W */}
                        <span className="text-center text-[12px] font-bold text-white/80 tabular-nums">
                          {entry.w}
                        </span>

                        {/* D */}
                        <span className="text-center text-[12px] text-white/45 tabular-nums">
                          {entry.d}
                        </span>

                        {/* L */}
                        <span className="text-center text-[12px] text-white/45 tabular-nums">
                          {entry.l}
                        </span>

                        {/* GF */}
                        <span className="text-center text-[12px] text-white/35 tabular-nums">
                          {entry.gf}
                        </span>

                        {/* GA */}
                        <span className="text-center text-[12px] text-white/35 tabular-nums">
                          {entry.ga}
                        </span>

                        {/* GD */}
                        <span
                          className={`text-center text-[12px] font-bold tabular-nums ${gd > 0
                              ? 'text-emerald-400'
                              : gd < 0
                                ? 'text-red-400'
                                : 'text-white/25'
                            }`}
                        >
                          {gd > 0 ? `+${gd}` : gd}
                        </span>

                        {/* Pts — most important, biggest + brightest */}
                        <span
                          className={`text-center text-[14px] font-black tabular-nums ${pts > 0 ? 'text-white' : 'text-white/20'
                            }`}
                        >
                          {entry.pts}
                        </span>

                        {/* Form dots */}
                        <div className="flex items-center justify-center gap-[3px]">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const result = last5[i]
                            if (!result) {
                              return (
                                <span
                                  key={i}
                                  className="inline-flex w-[16px] h-[16px] rounded-full border border-white/[0.08] bg-white/[0.03] shrink-0"
                                />
                              )
                            }
                            const cfg = resultConfig[result]
                            return (
                              <span
                                key={i}
                                title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}
                                className={`inline-flex w-[16px] h-[16px] rounded-full ${cfg.className} items-center justify-center text-white font-black shrink-0`}
                                style={{ fontSize: 7 }}
                              >
                                {cfg.label}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}

                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 mt-8 pt-6 border-t border-white/[0.05]">
        <div className="flex items-center gap-2">
          <span className="w-0.5 h-4 rounded-full bg-emerald-500/60 inline-block" />
          <span className="text-[11px] text-white/30">Advances to Round of 32</span>
        </div>
        <div className="flex items-center gap-5">
          {(['W', 'D', 'L'] as const).map(r => (
            <span key={r} className="flex items-center gap-1.5">
              <span className={`w-3.5 h-3.5 rounded-full ${resultConfig[r].className} inline-block shrink-0`} />
              <span className="text-[11px] text-white/30">
                {r === 'W' ? 'Win' : r === 'D' ? 'Draw' : 'Loss'}
              </span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-5 ml-auto">
          {[
            { label: 'MP', desc: 'Played' },
            { label: 'GF', desc: 'Scored' },
            { label: 'GA', desc: 'Conceded' },
            { label: 'GD', desc: 'Difference' },
          ].map(({ label, desc }) => (
            <span key={label} className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-white/40">{label}</span>
              <span className="text-[11px] text-white/20">{desc}</span>
            </span>
          ))}
        </div>
      </div>

    </div>
  )
}
