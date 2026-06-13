'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function CreateLeagueForm() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) { setError('League name is required'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setLoading(false); return }

    // Generate a 6-char invite code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data: league, error: createErr } = await supabase
      .from('leagues')
      .insert({ name: name.trim(), code, created_by: user.id })
      .select()
      .single()

    if (createErr || !league) {
      setError('Failed to create league')
      setLoading(false)
      return
    }

    // Auto-join as creator
    await supabase.from('league_members').insert({
      league_id: league.id,
      user_id: user.id,
    })

    router.push(`/leagues/${league.id}`)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Give your league a name and share the invite code with friends.
      </p>
      <Input
        placeholder="e.g. Office League, Uni Friends..."
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleCreate()}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleCreate} disabled={loading} className="w-full">
        {loading ? 'Creating...' : 'Create League'}
      </Button>
    </div>
  )
}
