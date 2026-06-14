'use client'
import { useState, useEffect } from 'react'

export default function ShareLeague({ code, name }: { code: string; name: string }) {
  const [copied, setCopied] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    const url = `${window.location.origin}/leagues?join=${code}`
    setInviteUrl(url)
    setCanShare(!!navigator.share)
  }, [code])

  const handleCopy = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (!inviteUrl) return
    try {
      await navigator.share({
        title: `Join my World Cup league: ${name}`,
        text: `Predict World Cup scores and compete! Use code ${code} or tap the link.`,
        url: inviteUrl,
      })
    } catch {
      // user cancelled
    }
  }

  return (
    <div className="space-y-2.5">
      {/* URL row */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.07]">
        <span className="text-[11px] font-mono text-white/30 flex-1 truncate">
          {inviteUrl || `…/leagues?join=${code}`}
        </span>
        <button
          onClick={handleCopy}
          className="shrink-0 text-white/25 hover:text-white/60 transition-colors"
          title="Copy link"
        >
          {copied ? (
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 14 14">
              <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
              <rect x="1" y="4" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.3" />
              <path d="M4 4V3a2 2 0 012-2h5a2 2 0 012 2v5a2 2 0 01-2 2h-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Action buttons */}
      <div className={`grid gap-2 ${canShare ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <button
          onClick={handleCopy}
          className={[
            'flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-150',
            copied
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
              : 'bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.07]',
          ].join(' ')}
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                <rect x="1" y="4" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.3" />
                <path d="M4 4V3a2 2 0 012-2h5a2 2 0 012 2v5a2 2 0 01-2 2h-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Copy link
            </>
          )}
        </button>

        {canShare && (
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-all duration-150 active:scale-[0.98]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
              <circle cx="13" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="13" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="3" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M4.5 7.1l7-3.2M4.5 8.9l7 3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Share
          </button>
        )}
      </div>
    </div>
  )
}
