export const revalidate = 1800

type NewsItem = {
  title: string
  link: string
  pubDate: string
  source: string
  image: string | null
}

async function getNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `https://newsdata.io/api/1/news?apikey=${process.env.NEWSDATA_API_KEY}&q=FIFA+World+Cup+2026&language=en&category=sports`,
      { next: { revalidate: 1800 } }
    )
    const data = await res.json()

    return (data.results ?? []).slice(0, 20).map((item: any) => ({
      title: item.title ?? '',
      link: item.link ?? '',
      pubDate: item.pubDate ?? '',
      source: item.source_id ?? '',
      image: item.image_url ?? null,
    }))
  } catch {
    return []
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default async function NewsPage() {
  const news = await getNews()

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">News</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Latest World Cup 2026 news
        </p>
      </div>

      {news.length === 0 ? (
        <p className="text-muted-foreground text-sm">Could not load news. Try again later.</p>
      ) : (
        <div className="space-y-3">
          {news.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 p-3 border rounded-xl hover:bg-accent/50 transition-colors"
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-24 h-16 object-cover rounded-lg shrink-0"
                />
              ) : (
                <div className="w-24 h-16 rounded-lg bg-muted shrink-0 flex items-center justify-center text-2xl">
                  ⚽
                </div>
              )}

              <div className="flex flex-col justify-between min-w-0">
                <p className="font-medium text-sm leading-snug line-clamp-2">{item.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  {item.source && <span className="capitalize">{item.source}</span>}
                  {item.source && item.pubDate && <span>·</span>}
                  {item.pubDate && <span>{timeAgo(item.pubDate)}</span>}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
