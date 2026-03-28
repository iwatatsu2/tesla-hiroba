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
    return arr.slice(0, 15).map((item: any) => {
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

export default async function NewsSection() {
  const news = await fetchJaNews()

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 48px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#aaa', marginBottom: 10 }}>LATEST NEWS</p>
      <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 20, color: '#111' }}>
        テスラ 最新ニュース
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {news.length === 0
          ? <p style={{ fontSize: 13, color: '#bbb' }}>ニュースを取得できませんでした</p>
          : news.map((n, i) => (
            <a key={i} href={n.link} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'block', padding: '14px 16px',
                border: '1px solid #ebebeb', borderRadius: 8,
                textDecoration: 'none', background: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {n.source && (
                  <span style={{
                    fontSize: 10, color: '#e31937', fontWeight: 600,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140,
                  }}>
                    {n.source}
                  </span>
                )}
                <span style={{ fontSize: 10, color: '#bbb', whiteSpace: 'nowrap' }}>
                  {n.pubDate ? new Date(n.pubDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }) : ''}
                </span>
              </div>
              <p style={{
                fontSize: 14, fontWeight: 400, color: '#222', lineHeight: 1.65, margin: 0,
                wordBreak: 'keep-all', overflowWrap: 'break-word',
              }}>
                {n.title}
              </p>
            </a>
          ))
        }
      </div>
    </section>
  )
}
