import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

type ApiGame = {
  id: string | number
  finished: string
  time_elapsed: string
  home_team_name_en?: string | null
  away_team_name_en?: string | null
  home_team_id: string | number
  away_team_id: string | number
  home_score?: string | number | null
  away_score?: string | number | null
  local_date: string
  group: string
  type: string
  stadium_id: string | number
}

type ApiTeam = {
  id: string | number
  flag: string
}

type ApiStadium = {
  id: string | number
  name_en: string
  city_en: string
}

type ApiGamesResponse = { games?: ApiGame[] }
type ApiTeamsResponse = { teams?: ApiTeam[] }
type ApiStadiumsResponse = { stadiums?: ApiStadium[] }

const BASE = 'https://worldcup26.ir/get'

function mapStatus(game: ApiGame): string {
  if (game.finished === 'TRUE') return 'finished'
  if (game.time_elapsed === 'notstarted') return 'scheduled'
  if (game.time_elapsed === 'finished') return 'finished'
  return 'live'
}

function parseScore(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const score = Number(value)
  return Number.isFinite(score) ? score : null
}

function parseDate(localDate: string, stadiumId: string): string {
  const [datePart, timePart] = localDate.split(' ')
  const [month, day, year] = datePart.split('/')

  // Local time offset from UTC for each stadium
  const offsetMap: Record<string, number> = {
    '1': -5, // Estadio Azteca, Mexico City (CDT)
    '2': -5, // Estadio Akron, Guadalajara (CDT)
    '3': -5, // Estadio BBVA, Monterrey (CDT)
    '4': -5, // AT&T Stadium, Dallas (CDT)
    '5': -5, // NRG Stadium, Houston (CDT)
    '6': -5, // Arrowhead, Kansas City (CDT)
    '7': -4, // Mercedes-Benz, Atlanta (EDT)
    '8': -4, // Hard Rock, Miami (EDT)
    '9': -4, // Gillette, Boston (EDT)
    '10': -4, // Lincoln Financial, Philadelphia (EDT)
    '11': -4, // MetLife, New York (EDT)
    '12': -4, // BMO Field, Toronto (EDT)
    '13': -7, // BC Place, Vancouver (PDT)
    '14': -7, // Lumen Field, Seattle (PDT)
    '15': -7, // Levi's Stadium, San Francisco (PDT)
    '16': -7, // SoFi Stadium, Los Angeles (PDT)
  }

  const offsetHours = offsetMap[stadiumId] ?? -5
  const utcDate = new Date(`${year}-${month}-${day}T${timePart}:00Z`)
  const utcMs = utcDate.getTime() - offsetHours * 60 * 60 * 1000
  return new Date(utcMs).toISOString()
}

function getRound(type: string): string {
  const map: Record<string, string> = {
    group: 'Group Stage',
    r32: 'Round of 32',
    r16: 'Round of 16',
    qf: 'Quarter Final',
    sf: 'Semi Final',
    third: 'Third Place',
    final: 'Final',
  }
  return map[type] ?? type.toUpperCase()
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  if (!isVercelCron && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [gamesRes, teamsRes, stadiumsRes] = await Promise.all([
    fetch(`${BASE}/games`, { cache: 'no-store' }),
    fetch(`${BASE}/teams`, { cache: 'no-store' }),
    fetch(`${BASE}/stadiums`, { cache: 'no-store' }),
  ])

  if (!gamesRes.ok || !teamsRes.ok || !stadiumsRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch from API' }, { status: 500 })
  }

  const [gamesData, teamsData, stadiumsData] = await Promise.all([
    gamesRes.json() as Promise<ApiGamesResponse>,
    teamsRes.json() as Promise<ApiTeamsResponse>,
    stadiumsRes.json() as Promise<ApiStadiumsResponse>,
  ])

  const flagMap: Record<string, string> = {}
  for (const team of teamsData.teams ?? []) {
    flagMap[String(team.id)] = team.flag
  }

  const stadiumMap: Record<string, string> = {}
  for (const s of stadiumsData.stadiums ?? []) {
    stadiumMap[String(s.id)] = `${s.name_en}, ${s.city_en}`
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let synced = 0
  let skipped = 0

  for (const game of gamesData.games ?? []) {
    const homeName = game.home_team_name_en
    const awayName = game.away_team_name_en

    // Skip knockout matches where teams aren't decided yet
    if (
      !homeName || !awayName ||
      game.home_team_id === '0' || game.away_team_id === '0' ||
      Number(game.home_team_id) === 0 || Number(game.away_team_id) === 0
    ) {
      skipped++
      continue
    }

    const status = mapStatus(game)
    const stadiumId = String(game.stadium_id)

    const matchData = {
      external_id: `wc26_${game.id}`,
      home_team: homeName,
      away_team: awayName,
      home_flag: flagMap[String(game.home_team_id)] ?? null,
      away_flag: flagMap[String(game.away_team_id)] ?? null,
      kickoff: parseDate(game.local_date, stadiumId),
      status,
      home_score: status === 'finished' ? parseScore(game.home_score) : null,
      away_score: status === 'finished' ? parseScore(game.away_score) : null,
      group_stage: `Group ${game.group}`,
      round: getRound(game.type),
      venue: stadiumMap[stadiumId] ?? null,
    }

    const { error } = await supabase
      .from('matches')
      .upsert(matchData, { onConflict: 'external_id' })

    if (error) {
      console.error(`[sync] failed for game ${game.id}:`, error.message)
    } else {
      synced++
    }
  }

  return NextResponse.json({ synced, skipped })
}
