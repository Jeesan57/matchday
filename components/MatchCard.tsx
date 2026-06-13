import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

type Match = {
  id: number
  home_team: string
  away_team: string
  home_flag: string | null
  away_flag: string | null
  home_score: number | null
  away_score: number | null
  kickoff: string
  status: string
  venue: string | null
  round: string | null
}

function FlagImage({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return <span className="w-8 h-5 bg-muted rounded text-xs flex items-center justify-center">?</span>
  if (src.startsWith('http')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={32}
        height={20}
        className="w-8 h-5 object-contain rounded-sm"
      />
    )
  }
  return <span className="text-2xl leading-none">{src}</span>
}

export default function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const showScore = isLive || isFinished

  return (
    <Link href={`/matches/${match.id}`}>
      <div className="border rounded-xl p-4 hover:bg-accent/50 transition-colors cursor-pointer">

        {/* Top row: round + status */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">
            {match.round ?? 'Group Stage'}
          </span>
          {isLive && (
            <Badge variant="destructive" className="text-xs gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white live-dot inline-block" />
              LIVE
            </Badge>
          )}
          {isFinished && (
            <Badge variant="secondary" className="text-xs">FT</Badge>
          )}
          {match.status === 'scheduled' && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(match.kickoff), 'HH:mm')}
            </span>
          )}
        </div>

        {/* Teams + score */}
        <div className="flex items-center justify-between gap-4">

          {/* Home team */}
          <div className="flex items-center gap-2 flex-1">
            <FlagImage src={match.home_flag} alt={match.home_team} />
            <span className="font-medium text-sm">{match.home_team}</span>
          </div>

          {/* Score or VS */}
          <div className="text-center min-w-[60px]">
            {showScore ? (
              <span className="text-xl font-bold tabular-nums">
                {match.home_score ?? 0} – {match.away_score ?? 0}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground font-medium">vs</span>
            )}
          </div>

          {/* Away team */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className="font-medium text-sm">{match.away_team}</span>
            <FlagImage src={match.away_flag} alt={match.away_team} />
          </div>
        </div>

        {/* Venue */}
        {match.venue && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            📍 {match.venue}
          </p>
        )}
      </div>
    </Link>
  )
}
