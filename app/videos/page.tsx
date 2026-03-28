import { XMLParser } from 'fast-xml-parser'

interface Video {
  title: string
  link: string
  published: string
  source: string
  videoId: string
}

async function fetchTeslaVideos(): Promise<Video[]> {
  try {
    // Google News RSS でTesla YouTube動画を検索（APIキー不要）
    const queries = [
      'https://news.google.com/rss/search?q=Tesla+site:youtube.com&hl=ja&gl=JP&ceid=JP:ja',
      'https://news.google.com/rss/search?q=テスラ+site:youtube.com&hl=ja&gl=JP&ceid=JP:ja',
    ]

    const results = await Promise.all(queries.map(async url => {
      const res = await fetch(url, { next: { revalidate: 3600 } })
      const xml = await res.text()
      const parser = new XMLParser({ ignoreAttributes: false })
      const obj = parser.parse(xml)
      const items = obj?.rss?.channel?.item || []
      return Array.isArray(items) ? items : [items]
    }))

    const all = results.flat()
    const videos: Video[] = []
    const seen = new Set<string>()

    for (const item of all) {
      const link: string = item.link || ''
      // youtube.com/watch?v= または youtu.be/ のリンクを抽出
      const m = link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
      if (!m) continue
      const videoId = m[1]
      if (seen.has(videoId)) continue
      seen.add(videoId)

      const full: string = item.title || ''
      const lastDash = full.lastIndexOf(' - ')
      const title = lastDash > 0 ? full.slice(0, lastDash) : full
      const source = lastDash > 0 ? full.slice(lastDash + 3) : ''

      videos.push({
        title,
        link: `https://www.youtube.com/watch?v=${videoId}`,
        published: item.pubDate || '',
        source,
        videoId,
      })
    }

    return videos.slice(0, 24)
  } catch {
    return []
  }
}

export const metadata = { title: 'TSLA PARK – Tesla YouTube動画' }

export default async function VideosPage() {
  const videos = await fetchTeslaVideos()

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#CC0000', marginBottom: 8, fontWeight: 600 }}>VIDEOS</p>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Tesla YouTube動画</h1>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 32 }}>Tesla関連の最新YouTube動画（自動収集・1時間ごと更新）</p>

      {videos.length === 0 ? (
        <p style={{ color: '#555', fontSize: 14 }}>動画を取得できませんでした。</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {videos.map(v => (
            <a key={v.videoId} href={v.link} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', textDecoration: 'none' }}
            >
              <div style={{ position: 'relative', paddingTop: '56.25%', background: '#111' }}>
                <img
                  src={`https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`}
                  alt={v.title}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(204,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 16, marginLeft: 3, color: '#fff' }}>▶</span>
                </div>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {v.source && <span style={{ fontSize: 9, color: '#CC0000', fontWeight: 700, letterSpacing: '0.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{v.source.toUpperCase()}</span>}
                  <span style={{ fontSize: 10, color: '#444', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                    {v.published ? new Date(v.published).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#F0F0F0', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                  {v.title}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
