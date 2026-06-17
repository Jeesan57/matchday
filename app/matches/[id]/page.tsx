import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MatchDetail from '@/components/MatchDetail'

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single()

  if (!match) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  let existingPrediction = null
  if (user) {
    const { data } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('match_id', match.id)
      .single()
    existingPrediction = data
  }

  return (
    <MatchDetail
      initialMatch={match}
      user={user}
      existingPrediction={existingPrediction}
    />
  )
}
