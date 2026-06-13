import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function calculatePoints(
  predHome: number, predAway: number,
  actualHome: number, actualAway: number
): number {
  if (predHome === actualHome && predAway === actualAway) return 5
  const predResult = Math.sign(predHome - predAway)
  const actualResult = Math.sign(actualHome - actualAway)
  if (predResult === actualResult) return 3
  return 0
}



export async function POST(request: NextRequest) {
  // Accept both manual Bearer token and Vercel cron
  const authHeader = request.headers.get('authorization')
  const cronHeader = request.headers.get('x-vercel-cron')

  if (!cronHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role key — bypasses RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_score, away_score')
    .eq('status', 'finished')
    .not('home_score', 'is', null)
    .not('away_score', 'is', null)

  if (!matches || matches.length === 0) {
    return NextResponse.json({ message: 'No finished matches to score' })
  }

  let totalScored = 0

  for (const match of matches) {
    const { data: predictions } = await supabase
      .from('predictions')
      .select('id, user_id, pred_home, pred_away')
      .eq('match_id', match.id)
      .is('scored_at', null)

    if (!predictions || predictions.length === 0) continue

    for (const pred of predictions) {
      const points = calculatePoints(
        pred.pred_home, pred.pred_away,
        match.home_score!, match.away_score!
      )

      await supabase
        .from('predictions')
        .update({ points_awarded: points, scored_at: new Date().toISOString() })
        .eq('id', pred.id)

      await supabase.rpc('increment_points', {
        uid: pred.user_id,
        amount: points,
      })

      totalScored++
    }
  }

  return NextResponse.json({ message: `Scored ${totalScored} predictions` })
}

// Allow Vercel cron to call this as GET
export async function GET(request: NextRequest) {
  return POST(request)
}
