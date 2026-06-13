'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { LogOut } from 'lucide-react'

export default function LeaveLeague({ leagueId, leagueName }: {
  leagueId: number
  leagueName: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLeave = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setLoading(false); return }

    const { error: leaveErr } = await supabase
      .from('league_members')
      .delete()
      .eq('league_id', leagueId)
      .eq('user_id', user.id)

    if (leaveErr) {
      setError('Failed to leave league.')
      setLoading(false)
      return
    }

    router.push('/leagues')
    router.refresh()
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2"
        onClick={() => setOpen(true)}
      >
        <LogOut className="h-4 w-4" />
        Leave League
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave &quot;{leagueName}&quot;?</DialogTitle>
            <DialogDescription>
              You will be removed from this league and no longer appear on its leaderboard.
              Your predictions and points are not affected.
              You can rejoin later with the invite code.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeave} disabled={loading}>
              {loading ? 'Leaving...' : 'Leave League'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
