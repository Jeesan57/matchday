'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, Share2 } from 'lucide-react'

export default function ShareLeague({ code, name }: { code: string; name: string }) {
  const [copied, setCopied] = useState(false)

  const inviteUrl = `${window.location.origin}/leagues?join=${code}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Join my World Cup league: ${name}`,
        text: `Predict World Cup scores and compete with me! Use code ${code} or click the link.`,
        url: inviteUrl,
      })
    } else {
      handleCopy()
    }
  }

  return (
    <div className="space-y-3">
      {/* Invite link box */}
      <div className="flex items-center gap-2 bg-muted/50 border rounded-lg px-3 py-2">
        <span className="text-xs text-muted-foreground flex-1 truncate font-mono">
          {inviteUrl}
        </span>
        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          {copied
            ? <Check className="h-4 w-4 text-green-500" />
            : <Copy className="h-4 w-4" />
          }
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
        <Button size="sm" onClick={handleShare} className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  )
}
