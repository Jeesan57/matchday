'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  matchId: number
  homeTeam: string
  awayTeam: string
  homeFlag: string | null
  awayFlag: string | null
}

function FlagImage({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return null
  if (src.startsWith('http')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className="w-12 h-8 object-contain rounded" />
  }
  return <span className="text-3xl">{src}</span>
}

export default function PredictionForm({ matchId, homeTeam, awayTeam, homeFlag, awayFlag }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be signed in.'); setLoading(false); return }

    const { error: err } = await supabase.from('predictions').insert({
      user_id: user.id,
      match_id: matchId,
      pred_home: homeScore,
      pred_away: awayScore,
    })

    if (err) {
      setError('Failed to save prediction. Try again.')
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Predict the final score. Exact score = 5pts, correct outcome = 3pts.
      </p>

      <div className="flex items-center gap-4">
        {/* Home */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <FlagImage src={homeFlag} alt={homeTeam} />
          <span className="text-sm font-medium">{homeTeam}</span>
          <Input
            type="number"
            min={0}
            max={20}
            value={homeScore}
            onChange={e => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-20 text-center text-xl font-bold h-12"
          />
        </div>

        <span className="text-2xl text-muted-foreground font-bold mt-8">–</span>

        {/* Away */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <FlagImage src={awayFlag} alt={awayTeam} />
          <span className="text-sm font-medium">{awayTeam}</span>
          <Input
            type="number"
            min={0}
            max={20}
            value={awayScore}
            onChange={e => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-20 text-center text-xl font-bold h-12"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <Button onClick={handleSubmit} disabled={loading} className="w-full" size="lg">
        {loading ? 'Saving...' : 'Submit Prediction'}
      </Button>
    </div>
  )
}
