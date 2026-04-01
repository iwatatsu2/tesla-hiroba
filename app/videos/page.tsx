'use client'
import Link from 'next/link'

const YOUTUBERS = [
  {
    name: 'MyTesla / bokutes',
    handle: '@bokutes',
    url: 'https://www.youtube.com/@bokutes',
    description: '日本のテスラオーナーによる試乗レビュー・納車・日常使いの動画',
    thumb: 'https://yt3.googleusercontent.com/ytc/AIdro_lQ4vKUfowgb2kWHGbFMHN8kHXbOWJIQPyQUFxJRQ=s176-c-k-c0x00ffffff-no-rj',
  },
]

export default function VideosPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#A0A0A0', marginBottom: 8, fontWeight: 600 }}>VIDEOS</p>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>おすすめ テスラYouTuber</h1>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 32 }}>日本語でテスラを発信しているクリエイター</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {YOUTUBERS.map(y => (
          <a key={y.handle} href={y.url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 22px', textDecoration: 'none' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#242424' }}>
              <img src={y.thumb} alt={y.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#F0F0F0' }}>{y.name}</span>
                <span style={{ fontSize: 11, color: '#555' }}>{y.handle}</span>
              </div>
              <p style={{ fontSize: 13, color: '#888', margin: 0, lineHeight: 1.6 }}>{y.description}</p>
            </div>
            <span style={{ fontSize: 13, color: '#555', flexShrink: 0 }}>→</span>
          </a>
        ))}
      </div>

      <p style={{ fontSize: 12, color: '#444', marginTop: 32, lineHeight: 1.8 }}>
        おすすめのテスラYouTuberをご存知の方は、<Link href="/new" style={{ color: '#A0A0A0' }}>フィード</Link>でシェアしてください。
      </p>
    </div>
  )
}
