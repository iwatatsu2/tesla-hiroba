import { XMLParser } from 'fast-xml-parser'

const CHANNELS = [
  { id: 'UCgUvkgS7co9VTL98i3jim_g', name: 'Tesla' },
  { id: 'UCb3Ryh3sdgpDBiVVAgi1I7g', name: 'Tesla Japan' },
  { id: 'UCo3TbxrmMSKaVdEJTX9e-4g', name: 'MKBHD' },
  { id: 'UCbEbf0-PoSuHD0TgMbxomDg', name: 'Teslanomics' },
  { id: 'UCbmNph6atAoGfqLoCL_duAg', name: 'Ryan Shaw' },
]

interface Video { id: string; title: string; link: string; published: string; thumbnail: string; channel: string }

async function fetchChannel(channelId: string, channelName: string): Promise<Video[]> {
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const xml = await res.text()
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
    const obj = parser.parse(xml)
    const entries = obj?.feed?.entry || []
    const arr = Array.isArray(entries) ? entries : [entries]
    return arr.slice(0, 5).map((e: any) => ({
      id: e['yt:videoId'] || '', title: e.title || '',
      link: `https://www.youtube.com/watch?v=${e['yt:videoId']}`,
      published: e.published || '',
      thumbnail: `https://img.youtube.com/vi/${e['yt:videoId']}/mqdefault.jpg`,
      channel: channelName,
    }))
  } catch { return [] }
}

export const metadata = { title: 'TSLA PARK – Tesla YouTube動画' }

export default async function VideosPage() {
  const results = await Promise.all(CHANNELS.map(c => fetchChannel(c.id, c.name)))
  const videos = results.flat().filter(v => v.id).sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime()).slice(0, 30)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#CC0000', marginBottom: 8, fontWeight: 600 }}>VIDEOS</p>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Tesla YouTube動画</h1>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 32 }}>人気チャンネルの最新動画（無料RSS・APIキー不要）</p>

      {videos.length === 0 ? (
        <p style={{ color: '#555', fontSize: 14 }}>動画を取得できませんでした。</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {videos.map(v => (
            <a key={v.id} href={v.link} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', textDecoration: 'none' }}
            >
              <div style={{ position: 'relative', paddingTop: '56.25%', background: '#111' }}>
                <img src={v.thumbnail} alt={v.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(204,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 16, marginLeft: 3 }}>▶</span>
                </div>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 9, color: '#CC0000', fontWeight: 700, letterSpacing: '0.08em' }}>{v.channel.toUpperCase()}</span>
                  <span style={{ fontSize: 10, color: '#444' }}>
                    {v.published ? new Date(v.published).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#F0F0F0', lineHeight: 1.5, margin: 0 }}>{v.title}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
