import { XMLParser } from 'fast-xml-parser'

interface NewsItem {
  title: string
  link: string
  pubDate: string
  source: string
}

async function fetchFeed(url: string, source: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 1800 } })
    const xml = await res.text()
    const parser = new XMLParser()
    const obj = parser.parse(xml)
    const items = obj?.rss?.channel?.item || []
    const arr = Array.isArray(items) ? items : [items]
    return arr.slice(0, 8).map((item: any) => ({
      title: item.title || '',
      link: item.link || '',
      pubDate: item.pubDate || '',
      source,
    }))
  } catch {
    return []
  }
}

export default async function NewsSection() {
  const [electrek, teslarati] = await Promise.all([
    fetchFeed('https://electrek.co/feed/', 'Electrek'),
    fetchFeed('https://www.teslarati.com/feed/', 'Teslarati'),
  ])

  const all = [...electrek, ...teslarati]
    .filter(n => n.title.toLowerCase().includes('tesla'))
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 12)

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#aaa', marginBottom: 12 }}>LATEST NEWS</p>
      <h2 style={{ fontSize: 18, fontWeight: 300, letterSpacing: '-0.01em', marginBottom: 28, color: '#111' }}>
        Tesla 最新ニュース
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {all.length === 0 ? (
          <p style={{ fontSize: 13, color: '#bbb' }}>ニュースを取得できませんでした</p>
        ) : all.map((n, i) => (
          <a key={i} href={n.link} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'block', padding: '16px 18px',
              border: '1px solid #f0f0f0', borderRadius: 6,
              textDecoration: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 9, letterSpacing: '0.12em', color: '#e31937', fontWeight: 500 }}>
                {n.source.toUpperCase()}
              </span>
              <span style={{ fontSize: 10, color: '#bbb' }}>
                {n.pubDate ? new Date(n.pubDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }) : ''}
              </span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 400, color: '#222', lineHeight: 1.6, margin: 0 }}>
              {n.title}
            </p>
          </a>
        ))}
      </div>
    </section>
  )
}
