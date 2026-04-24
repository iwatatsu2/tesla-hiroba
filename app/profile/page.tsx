'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Breakdown {
  post_count: number
  total_likes: number
  comment_count: number
  pts_from_posts: number
  pts_from_likes: number
  pts_from_comments: number
  total_score: number
  featured_count?: number
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth'); return }
      setUser(user)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setDisplayName(data.display_name || '')
        setReferralCode(data.referral_code || '')
      }
      // スコア内訳を取得
      const res = await fetch(`/api/referral?user_id=${user.id}`)
      const json = await res.json()
      if (json.breakdown) {
        // 掲載回数も付加
        const myName = data?.display_name || data?.referral_code
        const fc = (json.display_log as any[])?.filter(
          (l: any) => l.display_name === myName || l.referral_code === data?.referral_code
        ).length || 0
        setBreakdown({ ...json.breakdown, featured_count: fc })
      }
      setLoading(false)
    })
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage(null)

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: displayName.trim(),
      referral_code: referralCode.trim(),
    })

    if (error) {
      setMessage({ type: 'error', text: '保存に失敗しました' })
    } else {
      setMessage({ type: 'success', text: '保存しました' })
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ padding: '120px 20px', textAlign: 'center' }}>
      <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#404040' }}>LOADING...</span>
    </div>
  )

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px 80px' }}>
      <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#404040', marginBottom: 10 }}>// PROFILE</p>
      <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 16, color: '#C0C0C0', marginBottom: 32 }}>プロフィール設定</h1>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <label style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#808080', display: 'block', marginBottom: 10 }}>DISPLAY NAME</label>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="ニックネーム"
            style={{ width: '100%', padding: '12px', background: '#111', border: '2px solid #2A2A2A', color: '#E0E0E0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#808080', display: 'block', marginBottom: 10 }}>TESLA REFERRAL CODE</label>
          <input
            value={referralCode}
            onChange={e => setReferralCode(e.target.value)}
            placeholder="例: tesla12345"
            style={{ width: '100%', padding: '12px', background: '#111', border: '2px solid #2A2A2A', color: '#00FFFF', fontSize: 14, fontFamily: "'Press Start 2P', monospace", outline: 'none', boxSizing: 'border-box' }}
          />
          <p style={{ fontSize: 11, color: '#404040', marginTop: 8, lineHeight: 1.7 }}>
            Teslaアプリ右上メニュー →「紹介して獲得する」から確認できます。<br />
            入力するとランキング参加資格が得られます。
          </p>
        </div>

        {message && (
          <p style={{ fontSize: 12, color: message.type === 'success' ? '#00FFFF' : '#FF3B3B', fontWeight: 600 }}>
            {message.type === 'success' ? '✓ ' : '✗ '}{message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9, padding: '14px 24px',
            background: saving ? '#1A1A1A' : '#C0C0C0',
            color: saving ? '#404040' : '#000',
            border: '2px solid #C0C0C0',
            cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? '// SAVING...' : '> SAVE'}
        </button>
      </form>

      {/* スコア内訳 */}
      {breakdown && (
        <div style={{ marginTop: 48 }}>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#404040', marginBottom: 16 }}>// MY SCORE</p>

          {/* 合計スコア */}
          <div style={{ border: '2px solid #00FFFF', padding: '20px', marginBottom: 20, background: 'rgba(0,255,255,0.04)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#606060', marginBottom: 6 }}>TOTAL SCORE</p>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 28, color: '#00FFFF' }}>{breakdown.total_score}</p>
            <p style={{ fontSize: 10, color: '#404040', marginTop: 4 }}>pts</p>
          </div>

          {/* 内訳テーブル */}
          <div style={{ border: '1px solid #1A1A1A', overflow: 'hidden' }}>
            {[
              {
                label: '投稿数', value: `${breakdown.post_count}件`, pts: breakdown.pts_from_posts,
                formula: `${breakdown.post_count} × 2`,
              },
              {
                label: 'もらったいいね', value: `${breakdown.total_likes}件`, pts: breakdown.pts_from_likes,
                formula: `${breakdown.total_likes} × 3`,
              },
              {
                label: 'コメント数', value: `${breakdown.comment_count}件`, pts: breakdown.pts_from_comments,
                formula: `${breakdown.comment_count} × 1`,
              },
            ].map(({ label, value, pts, formula }, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr auto auto',
                alignItems: 'center', gap: 12,
                padding: '14px 16px',
                borderBottom: i < 2 ? '1px solid #1A1A1A' : 'none',
                background: '#0F0F0F',
              }}>
                <div>
                  <p style={{ fontSize: 12, color: '#A0A0A0', marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 10, color: '#404040' }}>{value}（{formula}）</p>
                </div>
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#C0C0C0' }}>+{pts}</span>
              </div>
            ))}
          </div>

          {/* 掲載実績 */}
          {breakdown.featured_count !== undefined && (
            <div style={{ marginTop: 20, padding: '16px', border: '1px solid #2A2A2A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#808080', marginBottom: 4 }}>FEATURED COUNT</p>
                <p style={{ fontSize: 12, color: '#606060' }}>掲載された回数</p>
              </div>
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 18, color: breakdown.featured_count > 0 ? '#00FFFF' : '#303030' }}>
                {breakdown.featured_count}
              </span>
            </div>
          )}
        </div>
      )}
      {/* リファラルランキングリンク */}
      <div style={{ marginTop: 32, padding: '16px', border: '1px solid rgba(0,255,255,0.15)', background: 'rgba(0,255,255,0.03)', textAlign: 'center' }}>
        <Link href="/referral" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#00FFFF', textDecoration: 'none' }}>
          &gt; REFERRAL RANKING
        </Link>
        <p style={{ fontSize: 11, color: '#555', marginTop: 8 }}>紹介コードランキングを見る</p>
      </div>
    </div>
  )
}
