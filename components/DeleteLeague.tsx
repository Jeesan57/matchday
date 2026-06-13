'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'

export default function DeleteLeague({ leagueId, leagueName, createdBy }: {
  leagueId: number
  leagueName: string
  createdBy: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== createdBy) {
      setError('Only the league creator can delete it.')
      setLoading(false)
      return
    }

    await supabase.from('league_members').delete().eq('league_id', leagueId)
    const { error: deleteErr } = await supabase.from('leagues').delete().eq('id', leagueId)

    if (deleteErr) {
      setError('Failed to delete league.')
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
        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        Delete League
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{leagueName}&quot;?</DialogTitle>
            <DialogDescription>
              This will permanently delete the league and remove all members.
              Predictions and points are not affected.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete League'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
