import { createClient } from '@/lib/supabase/server'
import PredictList from '@/components/PredictList'
import Link from 'next/link'

export default async function PredictPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'scheduled')
    .order('kickoff', { ascending: true })

  const predictions: Record<number, { pred_home: number; pred_away: number }> = {}

  if (user) {
    const { data } = await supabase
      .from('predictions')
      .select('match_id, pred_home, pred_away')
      .eq('user_id', user.id)

    for (const p of data ?? []) {
      predictions[p.match_id] = { pred_home: p.pred_home, pred_away: p.pred_away }
    }
  }

  const savedCount = Object.keys(predictions).length

  return (
    <div className="pb-16">
      {/* Hero */}
      <div className="pt-2 pb-7 border-b border-white/[0.05] mb-8">
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-emerald-500/70 mb-2">
          FIFA World Cup 2026
        </p>
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-3xl font-black tracking-tight leading-none">
            Predictions
          </h1>
          {savedCount > 0 && (
            <span className="text-xs font-semibold text-emerald-400 pb-0.5 tabular-nums">
              {savedCount} saved
            </span>
          )}
        </div>
        <p className="text-sm text-white/30 mt-2">
          Exact score <span className="text-white/50 font-semibold">5 pts</span>
          {' · '}
          Correct result <span className="text-white/50 font-semibold">3 pts</span>
          {' · '}
          Lock in before kickoff
        </p>

        {!user && (
          <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.07]">
            <span className="text-sm text-white/40">Sign in to save your predictions</span>
            <Link
              href="/login"
              className="ml-auto text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition-colors shrink-0"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>

      <PredictList
        matches={matches ?? []}
        predictions={predictions}
        isLoggedIn={!!user}
      />
    </div>
  )
}
