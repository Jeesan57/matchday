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
    .filter(g =>
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

const resultStyles = {
  W: { bg: 'bg-green-500', label: 'W' },
  D: { bg: 'bg-yellow-400', label: 'D' },
  L: { bg: 'bg-red-500', label: 'L' },
}

export default async function StandingsPage() {
  const [groupsRes, teamsRes, gamesRes] = await Promise.all([
    fetch('https://worldcup26.ir/get/groups', { next: { revalidate: 300 } }),
    fetch('https://worldcup26.ir/get/teams', { next: { revalidate: 300 } }),
    fetch('https://worldcup26.ir/get/games', { next: { revalidate: 300 } }),
  ])

  const [groupsData, teamsData, gamesData]: [GroupsResponse, TeamsResponse, GamesResponse] = await Promise.all([
    groupsRes.json(),
    teamsRes.json(),
    gamesRes.json(),
  ])

  const teamMap: Record<string, TeamInfo> = {}
  for (const team of teamsData.teams ?? []) {
    teamMap[String(team.id)] = team
  }

  const games = gamesData.games ?? []
  const groups = (groupsData.groups ?? []).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Group Standings</h1>
        <p className="text-muted-foreground mt-1">World Cup 2026 · Group Stage</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {groups.map(group => {
          const sorted = [...group.teams].sort((a, b) => {
            const ptsDiff = parseInt(b.pts) - parseInt(a.pts)
            if (ptsDiff !== 0) return ptsDiff
            const gdDiff = parseInt(b.gd) - parseInt(a.gd)
            if (gdDiff !== 0) return gdDiff
            return parseInt(b.gf) - parseInt(a.gf)
          })

          return (
            <div key={group.name} className="border rounded-xl overflow-hidden shadow-sm">
              {/* Group Header */}
              <div className="px-4 py-2.5 border-b bg-muted/40 flex items-center justify-between">
                <h2 className="font-bold text-sm">Group {group.name}</h2>
                <span className="text-xs text-muted-foreground">4 teams</span>
              </div>

              {/* Column Headers */}
              <div className="grid items-center px-3 py-1.5 border-b text-[11px] text-muted-foreground font-medium bg-muted/10"
                style={{ gridTemplateColumns: '18px 1fr 26px 26px 26px 26px 26px 26px 26px 32px 100px' }}>
                <span></span>
                <span className="pl-7">Team</span>
                <span className="text-center">MP</span>
                <span className="text-center">W</span>
                <span className="text-center">D</span>
                <span className="text-center">L</span>
                <span className="text-center">GF</span>
                <span className="text-center">GA</span>
                <span className="text-center">GD</span>
                <span className="text-center font-bold text-foreground">Pts</span>
                <span className="text-center">Last 5</span>
              </div>

              {/* Rows */}
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
                    className={`grid items-center px-3 py-2.5 border-b last:border-b-0 hover:bg-accent/30 transition-colors
                      ${qualifying ? 'border-l-[3px] border-l-green-500' : 'border-l-[3px] border-l-transparent'}`}
                    style={{ gridTemplateColumns: '18px 1fr 26px 26px 26px 26px 26px 26px 26px 32px 100px' }}
                  >
                    {/* Rank */}
                    <span className={`text-[11px] font-bold ${qualifying ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {index + 1}
                    </span>

                    {/* Team */}
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={team.flag}
                        alt={team.name_en}
                        width={22}
                        height={15}
                        className="rounded-[2px] object-cover flex-shrink-0 border border-border/30"
                        style={{ width: 22, height: 15 }}
                      />
                      <span className="font-medium text-[12px] leading-tight">{team.name_en}</span>
                    </div>

                    <span className="text-center text-[11px] text-muted-foreground">{entry.mp}</span>
                    <span className="text-center text-[11px] font-semibold">{entry.w}</span>
                    <span className="text-center text-[11px] text-muted-foreground">{entry.d}</span>
                    <span className="text-center text-[11px] text-muted-foreground">{entry.l}</span>
                    <span className="text-center text-[11px] text-muted-foreground">{entry.gf}</span>
                    <span className="text-center text-[11px] text-muted-foreground">{entry.ga}</span>

                    {/* GD */}
                    <span className={`text-center text-[11px] font-semibold
                      ${gd > 0 ? 'text-green-500' : gd < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {gd > 0 ? `+${gd}` : gd}
                    </span>

                    {/* Pts */}
                    <span className={`text-center text-[12px] font-bold
                      ${pts > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {entry.pts}
                    </span>

                    {/* Last 5 */}
                    <div className="flex items-center justify-center gap-[3px]">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const result = last5[i]
                        if (!result) {
                          return (
                            <span
                              key={i}
                              className="w-[18px] h-[18px] rounded-full border border-border/40 bg-muted/30"
                            />
                          )
                        }
                        const style = resultStyles[result]
                        return (
                          <span
                            key={i}
                            className={`w-[18px] h-[18px] rounded-full ${style.bg} flex items-center justify-center text-white font-bold`}
                            style={{ fontSize: 8 }}
                          >
                            {style.label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground pb-6">
        <div className="flex items-center gap-2">
          <span className="w-3 h-4 rounded-sm border-l-[3px] border-green-500 bg-green-500/10 inline-block" />
          Advance to Round of 32
        </div>
        <div className="flex items-center gap-3">
          {(['W', 'D', 'L'] as const).map(r => (
            <span key={r} className="flex items-center gap-1.5">
              <span className={`w-4 h-4 rounded-full ${resultStyles[r].bg} inline-block`} />
              <span>{r === 'W' ? 'Win' : r === 'D' ? 'Draw' : 'Loss'}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
