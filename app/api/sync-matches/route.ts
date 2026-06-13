import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://worldcup26.ir/get'

function mapStatus(game: any): string {
  if (game.finished === 'TRUE') return 'finished'
  if (game.time_elapsed === 'notstarted') return 'scheduled'
  if (game.time_elapsed === 'finished') return 'finished'
  return 'live'
}

function parseDate(localDate: string): string {
  // "06/11/2026 13:00" → "2026-06-11T13:00:00.000Z"
  const [datePart, timePart] = localDate.split(' ')
  const [month, day, year] = datePart.split('/')
  return `${year}-${month}-${day}T${timePart}:00.000Z`
}

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  if (!isVercelCron && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all 4 endpoints in parallel
  const [gamesRes, teamsRes, stadiumsRes] = await Promise.all([
    fetch(`${BASE}/games`, { cache: 'no-store' }),
    fetch(`${BASE}/teams`, { cache: 'no-store' }),
    fetch(`${BASE}/stadiums`, { cache: 'no-store' }),
  ])

  if (!gamesRes.ok || !teamsRes.ok || !stadiumsRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch from API' }, { status: 500 })
  }

  const [gamesData, teamsData, stadiumsData] = await Promise.all([
    gamesRes.json(),
    teamsRes.json(),
    stadiumsRes.json(),
  ])

  // Build lookup maps
  // flagMap:   { "17": "https://flagcdn.com/w80/de.png" }
  // stadiumMap: { "1": "Estadio Azteca, Mexico City" }
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
      game.home_team_id === '0' || game.away_team_id === '0'
    ) {
      skipped++
      continue
    }

    const status = mapStatus(game)

    const matchData = {
      external_id: `wc26_${game.id}`,
      home_team: homeName,
      away_team: awayName,
      home_flag: flagMap[String(game.home_team_id)] ?? null,
      away_flag: flagMap[String(game.away_team_id)] ?? null,
      kickoff: parseDate(game.local_date),
      status,
      home_score: status === 'finished' ? parseInt(game.home_score) : null,
      away_score: status === 'finished' ? parseInt(game.away_score) : null,
      group_stage: `Group ${game.group}`,
      round: getRound(game.type),
      venue: stadiumMap[String(game.stadium_id)] ?? null,
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
