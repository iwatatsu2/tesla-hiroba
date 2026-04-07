'use client'
import { useEffect, useState, useRef } from 'react'

interface NewsItem {
  title: string
  link: string
  pubDate: string
  source: string
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pullY, setPullY] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const touchStartY = useRef(0)

  const fetchNews = () => {
    return fetch('/api/news')
      .then(r => r.json())
      .then(data => { setNews(data) })
      .catch(() => {})
  }

  useEffect(() => {
    setLoading(true)
    fetchNews().then(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => { if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY }
    const onTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 0 || refreshing) return
      const dy = e.touches[0].clientY - touchStartY.current
      if (dy > 0) { setIsPulling(true); setPullY(Math.min(dy * 0.4, 72)) }
    }
    const onTouchEnd = async () => {
      if (pullY > 50 && !refreshing) {
        setRefreshing(true); setPullY(48)
        await fetchNews()
        setRefreshing(false)
      }
      setPullY(0); setIsPulling(false)
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [pullY, refreshing])

  return (
    <div>
      {/* Pull indicator */}
      <div style={{ height: pullY, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: isPulling ? 'none' : 'height 300ms', background: '#0A0A0A' }}>
        {(isPulling || refreshing) && (
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#00FFFF' }}>
            {refreshing ? '// LOADING...' : pullY > 50 ? '// RELEASE' : '// PULL'}
          </span>
        )}
      </div>
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#A0A0A0', marginBottom: 10, fontWeight: 600 }}>LATEST NEWS</p>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 28 }}>テスラ 最新ニュース</h1>

      {/* 編集部ピックアップ */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#00FFFF', background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.3)', padding: '3px 10px', borderRadius: 4 }}>EDITOR'S PICK</span>
          <span style={{ fontSize: 11, color: '#555' }}>編集部ピックアップ</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            {
              tag: '🚗 新発売',
              date: '2026年4月3日',
              title: 'Model YL、日本で正式発売開始',
              body: 'テスラ初の3列シート大型SUV「Model YL」が日本で正式販売スタート。8人乗り・全長4,999mmのロングホイールベースモデル。詳細はTesla公式サイトへ。',
              link: 'https://www.tesla.com/ja_jp/modely',
            },
            {
              tag: '📋 スペック',
              date: '2026年4月3日',
              title: 'Model YL スペック概要',
              body: '最大8人乗り・3列シート／デュアルモーターAWD搭載モデルあり／テスラ初のロングホイールベースSUV。航続距離・価格は公式サイトで確認を。',
              link: 'https://www.tesla.com/ja_jp/modely',
            },
            {
              tag: '📸 投稿募集',
              date: '',
              title: 'Model YL オーナー・注文済みの方は投稿を！',
              body: '日本上陸したばかりのModel YL。納車レポート・試乗インプレ・内装写真など、あなたの体験をTSLA PARKにシェアしてください。',
              link: '/new',
            },
          ].map((item, i) => (
            <a key={i} href={item.link} target={item.link.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer"
              style={{ display: 'block', padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(0,255,255,0.2)', background: 'rgba(0,255,255,0.04)', textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: '#00FFFF', fontWeight: 700 }}>{item.tag}</span>
                {item.date && <span style={{ fontSize: 10, color: '#555' }}>{item.date}</span>}
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#F0F0F0', margin: '0 0 5px', lineHeight: 1.5 }}>{item.title}</p>
              <p style={{ fontSize: 12, color: '#888', margin: 0, lineHeight: 1.6 }}>{item.body}</p>
            </a>
          ))}
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 28 }} />

      {loading && <div style={{ padding: '60px 0', textAlign: 'center', color: '#444', fontSize: 13 }}>読み込み中...</div>}
      {!loading && news.length === 0 && <p style={{ color: '#555', fontSize: 14 }}>ニュースを取得できませんでした</p>}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {news.map((n, i) => {
          let dateStr = ''
          if (n.pubDate) {
            try {
              dateStr = new Date(n.pubDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            } catch { /* skip */ }
          }
          return (
            <a key={i} href={n.link} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                {n.source && (
                  <span style={{ fontSize: 9, color: '#A0A0A0', fontWeight: 700, letterSpacing: '0.08em', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4 }}>
                    {n.source}
                  </span>
                )}
                {dateStr && <span style={{ fontSize: 11, color: '#444' }}>{dateStr}</span>}
              </div>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#F0F0F0', lineHeight: 1.65, margin: '0 0 4px' }}>{n.title}</p>
              <p style={{ fontSize: 11, color: '#444', margin: 0 }}>外部サイトで読む →</p>
            </a>
          )
        })}
      </div>
    </div>
    </div>
  )
}
