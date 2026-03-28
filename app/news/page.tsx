import { XMLParser } from 'fast-xml-parser'

interface NewsItem {
  title: string
  link: string
  pubDate: string
  source: string
}

async function fetchJaNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      'https://news.google.com/rss/search?q=Tesla&hl=ja&gl=JP&ceid=JP:ja',
      { next: { revalidate: 1800 } }
    )
    const xml = await res.text()
    const parser = new XMLParser({ ignoreAttributes: false })
    const obj = parser.parse(xml)
    const items = obj?.rss?.channel?.item || []
    const arr = Array.isArray(items) ? items : [items]
    return arr.slice(0, 20).map((item: any) => {
      const full: string = item.title || ''
      const lastDash = full.lastIndexOf(' - ')
      const title = lastDash > 0 ? full.slice(0, lastDash) : full
      const source = lastDash > 0 ? full.slice(lastDash + 3) : ''
      return { title, link: item.link || '', pubDate: item.pubDate || '', source }
    })
  } catch {
    return []
  }
}

export const metadata = {
  title: 'TSLA PARK – Tesla最新ニュース',
}

export default async function NewsPage() {
  const news = await fetchJaNews()

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#aaa', marginBottom: 10 }}>LATEST NEWS</p>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 28 }}>テスラ 最新ニュース</h1>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {news.length === 0 ? (
          <p style={{ fontSize: 14, color: '#bbb' }}>ニュースを取得できませんでした</p>
        ) : news.map((n, i) => (
          <a key={i} href={n.link} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'block', padding: '18px 0',
              borderBottom: '1px solid #f0f0f0',
              textDecoration: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              {n.source && (
                <span style={{ fontSize: 10, color: '#e31937', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {n.source}
                </span>
              )}
              <span style={{ fontSize: 11, color: '#bbb', whiteSpace: 'nowrap' }}>
                {n.pubDate ? new Date(n.pubDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' }) : ''}
              </span>
            </div>
            <p style={{
              fontSize: 15, fontWeight: 500, color: '#111', lineHeight: 1.65, margin: 0,
            }}>
              {n.title}
            </p>
          </a>
        ))}
      </div>
    </div>
  )
}
