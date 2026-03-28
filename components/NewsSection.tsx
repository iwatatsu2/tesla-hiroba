import { XMLParser } from 'fast-xml-parser'

interface NewsItem {
  title: string
  link: string
  pubDate: string
  source: string
}

async function fetchGoogleNews(lang: 'ja' | 'en'): Promise<NewsItem[]> {
  const url = lang === 'ja'
    ? 'https://news.google.com/rss/search?q=Tesla&hl=ja&gl=JP&ceid=JP:ja'
    : 'https://news.google.com/rss/search?q=Tesla&hl=en-US&gl=US&ceid=US:en'
  try {
    const res = await fetch(url, { next: { revalidate: 1800 } })
    const xml = await res.text()
    const parser = new XMLParser({ ignoreAttributes: false })
    const obj = parser.parse(xml)
    const items = obj?.rss?.channel?.item || []
    const arr = Array.isArray(items) ? items : [items]
    return arr.slice(0, 10).map((item: any) => {
      // title format: "記事タイトル - メディア名"
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

function formatDate(pubDate: string, locale: string) {
  if (!pubDate) return ''
  try {
    return new Date(pubDate).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  } catch { return '' }
}

function NewsCard({ item, locale }: { item: NewsItem; locale: string }) {
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'block', padding: '14px 16px',
        border: '1px solid #f0f0f0', borderRadius: 6,
        textDecoration: 'none', background: '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {item.source && (
          <span style={{ fontSize: 9, letterSpacing: '0.1em', color: '#e31937', fontWeight: 600 }}>
            {item.source}
          </span>
        )}
        <span style={{ fontSize: 10, color: '#bbb' }}>{formatDate(item.pubDate, locale)}</span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 400, color: '#222', lineHeight: 1.6, margin: 0 }}>
        {item.title}
      </p>
    </a>
  )
}

export default async function NewsSection() {
  const [jaNews, enNews] = await Promise.all([
    fetchGoogleNews('ja'),
    fetchGoogleNews('en'),
  ])

  return (
    <div style={{ borderTop: '1px solid #f0f0f0' }}>
      {/* 日本語ニュース */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 32px' }}>
        <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#aaa', marginBottom: 10 }}>LATEST NEWS · JA</p>
        <h2 style={{ fontSize: 18, fontWeight: 300, marginBottom: 20, color: '#111' }}>
          テスラ 最新ニュース
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {jaNews.length === 0
            ? <p style={{ fontSize: 13, color: '#bbb' }}>ニュースを取得できませんでした</p>
            : jaNews.map((n, i) => <NewsCard key={i} item={n} locale="ja-JP" />)
          }
        </div>
      </section>

      {/* 英語ニュース */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px 48px' }}>
        <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#aaa', marginBottom: 10 }}>LATEST NEWS · EN</p>
        <h2 style={{ fontSize: 18, fontWeight: 300, marginBottom: 20, color: '#111' }}>
          Tesla News
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {enNews.length === 0
            ? <p style={{ fontSize: 13, color: '#bbb' }}>Could not fetch news</p>
            : enNews.map((n, i) => <NewsCard key={i} item={n} locale="en-US" />)
          }
        </div>
      </section>
    </div>
  )
}
