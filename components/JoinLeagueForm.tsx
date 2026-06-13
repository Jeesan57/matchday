'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function JoinLeagueForm() {
  const router = useRouter()
  const supabase = createClient()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleJoin = async () => {
    if (!code.trim()) { setError('Enter an invite code'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setLoading(false); return }

    // Find league by code
    const { data: league } = await supabase
      .from('leagues')
      .select('id, name')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (!league) {
      setError('League not found. Check the code and try again.')
      setLoading(false)
      return
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('league_members')
      .select('league_id')
      .eq('league_id', league.id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      router.push(`/leagues/${league.id}`)
      return
    }

    const { error: joinErr } = await supabase
      .from('league_members')
      .insert({ league_id: league.id, user_id: user.id })

    if (joinErr) {
      setError('Failed to join league')
      setLoading(false)
      return
    }

    router.push(`/leagues/${league.id}`)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Got an invite code? Enter it below to join a league.
      </p>
      <Input
        placeholder="e.g. ABC123"
        value={code}
        onChange={e => setCode(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && handleJoin()}
        className="font-mono"
        maxLength={6}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleJoin} disabled={loading} className="w-full" variant="outline">
        {loading ? 'Joining...' : 'Join League'}
      </Button>
    </div>
  )
}
