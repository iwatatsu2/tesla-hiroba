'use client'
import { useEffect, useState, useRef } from 'react'

interface FeaturedCode {
  id: string
  display_name: string
  referral_code: string
  score: number
}

interface RankEntry {
  rank: number
  display_name: string
  score: number
  referral_code: string
  in_cooldown: boolean
  is_featured: boolean
  featured_count: number
}

interface LogEntry {
  display_name: string
  referral_code: string
  featured_at: string
  used: boolean
}

interface ReferralData {
  featured: FeaturedCode | null
  ranking: RankEntry[]
  display_log: LogEntry[]
}

const TESLA_REFERRAL_BASE = 'https://www.tesla.com/referral/'

// フルURLまたはコードのみに対応
function buildReferralUrl(code: string): string {
  if (code.startsWith('http')) return code
  return TESLA_REFERRAL_BASE + code
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [clicked, setClicked] = useState(false)
  const [pullY, setPullY] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const touchStartY = useRef(0)

  const fetchData = async () => {
    const res = await fetch('/api/referral')
    const json = await res.json()
    setData(json)
  }

  useEffect(() => {
    setLoading(true)
    fetchData().then(() => setLoading(false))
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
        await fetchData()
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

  const handleReferralClick = async () => {
    if (!data?.featured || clicked) return
    // クールダウン設定（バックグラウンド）
    fetch('/api/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referral_code: data.featured.referral_code }),
    })
    setClicked(true)
    window.open(buildReferralUrl(data.featured.referral_code), '_blank', 'noopener,noreferrer')
  }

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
        {/* Header */}
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, letterSpacing: '0.2em', color: '#404040', marginBottom: 10 }}>// REFERRAL SYSTEM</p>
        <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 16, color: '#C0C0C0', marginBottom: 8, lineHeight: 1.5 }}>紹介コード<br/>ランキング</h1>
        <p style={{ fontSize: 12, color: '#505050', marginBottom: 36, lineHeight: 1.8 }}>
          活動実績に応じたランキング上位者の紹介コードを掲載。<br />
          1時間ごとに自動更新・クールダウン制で公平に運用。
        </p>

        {/* Featured Code */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#404040' }}>LOADING...</span>
          </div>
        ) : data?.featured ? (
          <div style={{ border: '2px solid #00FFFF', padding: '24px', marginBottom: 40, background: 'rgba(0,255,255,0.04)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -10, left: 16, background: '#0A0A0A', padding: '0 8px' }}>
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#00FFFF' }}>NOW FEATURED</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #00FFFF, #0088AA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                {(data.featured.display_name || '?')[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#00FFFF', lineHeight: 1.2 }}>{data.featured.display_name || 'OWNER'}</p>
                <p style={{ fontSize: 11, color: '#505050', marginTop: 2 }}>さんの紹介コードで注文できます</p>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#606060', marginBottom: 20 }}>以下のボタンから注文してください。</p>

            <div style={{ marginBottom: 16, padding: '10px 12px', background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)' }}>
              <p style={{ fontSize: 11, color: '#FF6B35', lineHeight: 1.8, margin: 0 }}>
                ⚠ 注文確定<strong>前</strong>に以下のボタンからTesla公式サイトを開いてください。後付け不可。
              </p>
            </div>

            <button
              onClick={handleReferralClick}
              disabled={clicked}
              style={{
                width: '100%',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 9, padding: '14px 20px',
                background: clicked ? '#1A1A1A' : '#00FFFF',
                color: clicked ? '#404040' : '#000',
                border: `2px solid ${clicked ? '#2A2A2A' : '#00FFFF'}`,
                cursor: clicked ? 'default' : 'pointer',
                letterSpacing: '0.05em',
                transition: '150ms',
              }}
            >
              {clicked ? '// OPENED - GOOD LUCK!' : '> TESLA 公式で注文する（紹介コード付き）'}
            </button>
          </div>
        ) : (
          <div style={{ border: '2px solid #2A2A2A', padding: '32px', marginBottom: 40, textAlign: 'center' }}>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#404040' }}>// NO CODE AVAILABLE</p>
            <p style={{ fontSize: 12, color: '#505050', marginTop: 12 }}>現在掲載中の紹介コードがありません。<br />プロフィールから紹介コードを登録して参加しましょう。</p>
          </div>
        )}

        {/* How it works */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#404040', marginBottom: 16 }}>// HOW IT WORKS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { step: '01', text: '会員登録してプロフィールにTesla紹介コードを入力' },
              { step: '02', text: '納車レポート・アリエク購入品・MC情報の投稿やコメントでスコアが上がる' },
              { step: '03', text: 'ランキング上位者の紹介コードが自動掲載（1時間ごと更新）' },
              { step: '04', text: 'コードが使用されたら24時間クールダウン→次点へ切替' },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: '1px solid #1A1A1A', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#00FFFF', flexShrink: 0, marginTop: 2 }}>{step}</span>
                <span style={{ fontSize: 13, color: '#A0A0A0', lineHeight: 1.7 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Score system */}
        <div style={{ marginBottom: 40, border: '1px solid #1A1A1A', padding: '20px' }}>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#404040', marginBottom: 16 }}>// SCORE SYSTEM</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { action: '納車レポート投稿', pts: '+2 pts' },
              { action: 'アリエク購入品投稿', pts: '+3 pts' },
              { action: 'MC情報投稿', pts: '+3 pts' },
              { action: 'いいね（もらう）', pts: '+1~3 pts' },
              { action: 'コメント1件', pts: '+1 pt' },
            ].map(({ action, pts }) => (
              <div key={action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#A0A0A0' }}>{action}</span>
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#00FFFF' }}>{pts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking */}
        {data && data.ranking.length > 0 && (
          <div>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#404040', marginBottom: 16 }}>// RANKING TOP {data.ranking.length}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {data.ranking.map(r => (
                <div key={r.rank} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 0', borderBottom: '1px solid #1A1A1A',
                  opacity: r.in_cooldown ? 0.4 : 1,
                }}>
                  <span style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: r.rank <= 3 ? 10 : 8,
                    color: r.rank === 1 ? '#FFD700' : r.rank === 2 ? '#C0C0C0' : r.rank === 3 ? '#CD7F32' : '#404040',
                    minWidth: 24, flexShrink: 0,
                  }}>{r.rank}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: r.is_featured ? '#00FFFF' : '#E0E0E0', fontWeight: r.is_featured ? 600 : 400 }}>
                        {r.display_name || `USER_${r.rank.toString().padStart(3, '0')}`}
                      </span>
                      {r.is_featured && (
                        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: '#000', background: '#00FFFF', padding: '2px 6px' }}>NOW</span>
                      )}
                      {r.in_cooldown && (
                        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: '#FF6B35', border: '1px solid #FF6B35', padding: '2px 6px' }}>CD</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#303030' }}>{r.score} pts</span>
                      {r.featured_count > 0 && (
                        <span style={{ fontSize: 10, color: '#404040' }}>掲載 {r.featured_count}回</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 掲載履歴 */}
        {data && data.display_log.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#404040', marginBottom: 4 }}>// DISPLAY LOG</p>
            <p style={{ fontSize: 11, color: '#404040', marginBottom: 16 }}>過去の掲載履歴（最新30件）</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {data.display_log.map((log, i) => {
                let dateStr = ''
                try {
                  dateStr = new Date(log.featured_at).toLocaleDateString('ja-JP', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })
                } catch { /* skip */ }
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 0', borderBottom: '1px solid #111',
                  }}>
                    <span style={{ fontSize: 10, color: '#303030', whiteSpace: 'nowrap', minWidth: 90 }}>{dateStr}</span>
                    <span style={{ flex: 1, fontSize: 13, color: '#A0A0A0' }}>OWNER</span>
                    {log.used ? (
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: '#FF6B35', border: '1px solid #FF6B35', padding: '2px 6px', whiteSpace: 'nowrap' }}>USED</span>
                    ) : (
                      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: '#303030', border: '1px solid #222', padding: '2px 6px', whiteSpace: 'nowrap' }}>-</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Join CTA */}
        <div style={{ marginTop: 40, padding: '24px', border: '1px solid #2A2A2A', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#404040', marginBottom: 12 }}>// JOIN THE RANKING</p>
          <p style={{ fontSize: 12, color: '#606060', marginBottom: 16, lineHeight: 1.8 }}>
            プロフィールに紹介コードを登録するだけで参加できます。<br />
            納車レポートやコメントでスコアを積み上げよう。
          </p>
          <a href="/profile" style={{
            display: 'inline-block',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8, padding: '12px 20px',
            background: '#C0C0C0', color: '#000',
            textDecoration: 'none', border: '2px solid #C0C0C0',
          }}>
            &gt; プロフィール設定
          </a>
        </div>
      </div>
    </div>
  )
}
