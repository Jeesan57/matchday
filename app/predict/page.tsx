import { createClient } from '@/lib/supabase/server'
import PredictList from '@/components/PredictList'

export default async function PredictPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'scheduled')
    .order('kickoff', { ascending: true })

  let predictions: Record<number, { pred_home: number; pred_away: number }> = {}

  if (user) {
    const { data } = await supabase
      .from('predictions')
      .select('match_id, pred_home, pred_away')
      .eq('user_id', user.id)

    for (const p of data ?? []) {
      predictions[p.match_id] = { pred_home: p.pred_home, pred_away: p.pred_away }
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Make Predictions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Predict before kickoff. Exact score = 5pts, correct outcome = 3pts.
        </p>
      </div>
      <PredictList matches={matches ?? []} predictions={predictions} isLoggedIn={!!user} />
    </div>
  )
}
