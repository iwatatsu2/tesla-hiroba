'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import XPBar from '@/components/XPBar'

const MODELS = ['Model Y', 'Model YL', 'Model 3']
const MODEL_COLOR: Record<string, string> = { 'Model Y': '#A0A0A0', 'Model YL': '#10B981', 'Model 3': '#3B82F6' }

function calcDays(a: string | null, b: string | null) {
  if (!a) return null
  const end = b ? new Date(b) : new Date()
  return Math.round((end.getTime() - new Date(a).getTime()) / 86400000)
}

const card = { background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 22px' }

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set())
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [openModels, setOpenModels] = useState<Set<string>>(new Set(MODELS))

  useEffect(() => {
    // ユーザー情報取得
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUser(user)
        const { data: profile } = await supabase.from('profiles').select('tsla_display_name, display_name').eq('id', user.id).single()
        setDisplayName(profile?.tsla_display_name || profile?.display_name || '')
      }
    })

    // レポート取得（最新10件のみ）
    supabase.from('delivery_reports').select('*').order('created_at', { ascending: false }).limit(10).then(({ data }) => {
      setReports(data || [])
      setLoading(false)
      if (data && data.length > 0) {
        const ids = data.map(r => r.id)
        supabase.from('delivery_comments').select('report_id').in('report_id', ids).then(({ data: comments }) => {
          const counts: Record<string, number> = {}
          comments?.forEach(c => { counts[c.report_id] = (counts[c.report_id] || 0) + 1 })
          setCommentCounts(counts)
        })
        supabase.from('delivery_likes').select('report_id, user_id').in('report_id', ids).then(({ data: likes }) => {
          const counts: Record<string, number> = {}
          likes?.forEach(l => { counts[l.report_id] = (counts[l.report_id] || 0) + 1 })
          setLikeCounts(counts)
        })
      }
    })

    // ログインユーザーのいいね状態
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('delivery_likes').select('report_id').eq('user_id', user.id).then(({ data: likes }) => {
          setMyLikes(new Set(likes?.map(l => l.report_id) || []))
        })
      }
    })
  }, [])

  const handleLike = async (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation()
    if (!user) { router.push('/auth'); return }
    if (myLikes.has(reportId)) {
      await supabase.from('delivery_likes').delete().eq('report_id', reportId).eq('user_id', user.id)
      setMyLikes(prev => { const s = new Set(prev); s.delete(reportId); return s })
      setLikeCounts(prev => ({ ...prev, [reportId]: (prev[reportId] || 1) - 1 }))
    } else {
      const name = displayName || user.email || ''
      await supabase.from('delivery_likes').insert({ report_id: reportId, user_id: user.id, liker_name: name })
      setMyLikes(prev => new Set(prev).add(reportId))
      setLikeCounts(prev => ({ ...prev, [reportId]: (prev[reportId] || 0) + 1 }))
    }
  }

  // サマリー計算（全件取るわけではないが、トップ表示用にはロードしたデータで算出）
  // → 別途全件取得してサマリーを正確に出す
  const [allReports, setAllReports] = useState<any[]>([])
  useEffect(() => {
    supabase.from('delivery_reports').select('model, order_date, delivery_date').then(({ data }) => {
      setAllReports(data || [])
    })
  }, [])

  const summary = MODELS.map(model => {
    const completed = allReports.filter(r => r.model === model && r.order_date && r.delivery_date)
    const days = completed.map(r => calcDays(r.order_date, r.delivery_date)).filter(d => d !== null) as number[]
    const avg = days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : null
    const waiting = allReports.filter(r => r.model === model && !r.delivery_date).length
    return { model, avg, count: days.length, waiting }
  })

  return (
    <>
      {/* Hero */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: '#0A0A0A',
        borderBottom: '2px solid #C0C0C0',
        padding: '64px 20px 48px', textAlign: 'center',
      }}>
        <img src="/illust-optimus.png" alt="" style={{ position: 'absolute', top: 8, left: 8, height: 56, imageRendering: 'pixelated', objectFit: 'contain', mixBlendMode: 'screen' }} />
        <img src="/illust-cybertruck.png" alt="" style={{ position: 'absolute', top: 8, right: 8, height: 56, imageRendering: 'pixelated', objectFit: 'contain', mixBlendMode: 'screen' }} />
        <img src="/illust-model-3-hero.png" alt="" style={{ position: 'absolute', bottom: 8, left: 8, height: 56, imageRendering: 'pixelated', objectFit: 'contain', mixBlendMode: 'screen' }} />
        <img src="/illust-model-x.png" alt="" style={{ position: 'absolute', bottom: 8, right: 8, height: 56, imageRendering: 'pixelated', objectFit: 'contain', mixBlendMode: 'screen' }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#404040', marginBottom: 20, letterSpacing: '0.2em' }}>// TESLA OWNERS COMMUNITY</p>
          <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 'clamp(24px,5vw,48px)', color: '#C0C0C0', marginBottom: 4, lineHeight: 1.2, letterSpacing: '0.1em' }}>
            TSLA
          </h1>
          <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 'clamp(14px,3vw,28px)', color: '#00FFFF', marginBottom: 24, letterSpacing: '0.15em' }}>
            PARK
          </h2>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#404040', marginBottom: 32, letterSpacing: '0.05em' }}>
            CHARGE · DELIVERY · SHARE
          </p>

          {/* ログイン状態表示 */}
          {user ? (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 14, color: '#C0C0C0', marginBottom: 12 }}>
                <span style={{ color: '#00FFFF', fontWeight: 700 }}>{displayName || user.email}</span> さん
              </p>
            </div>
          ) : (
            <Link href="/auth" style={{
              fontFamily: "'Press Start 2P', monospace",
              padding: '12px 32px', background: '#00FFFF', color: '#000',
              border: '2px solid #00FFFF', fontSize: 10, textDecoration: 'none',
              display: 'inline-block', marginBottom: 24,
              transition: '120ms',
            }}>
              &gt; LOGIN
            </Link>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/delivery/new" style={{
              fontFamily: "'Press Start 2P', monospace",
              padding: '12px 24px', background: '#C0C0C0', color: '#000',
              border: '2px solid #C0C0C0', fontSize: 9, textDecoration: 'none',
              transition: '120ms',
            }}>
              &gt; REPORT
            </Link>
            <Link href="/delivery" style={{
              fontFamily: "'Press Start 2P', monospace",
              padding: '12px 20px', background: 'transparent', color: '#00FFFF',
              border: '2px solid #00FFFF', fontSize: 9, textDecoration: 'none',
              transition: '120ms',
            }}>
              &gt; FEED
            </Link>
          </div>
        </div>
      </section>

      {/* サマリー + 最新レポート */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* サマリーカード */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
          {summary.map(s => (
            <div key={s.model} style={{ ...card, flex: 1, minWidth: 0, padding: '16px 12px' }}>
              <p style={{ fontSize: 10, color: '#888', marginBottom: 6 }}>{s.model}</p>
              {s.avg !== null ? (
                <>
                  <p style={{ fontSize: 'clamp(24px, 7vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', color: MODEL_COLOR[s.model], lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.avg}</p>
                  <p style={{ fontSize: 'clamp(9px, 2.5vw, 12px)', color: '#666', marginTop: 4 }}>日（平均·{s.count}件）</p>
                </>
              ) : (
                <p style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>データなし</p>
              )}
              {s.waiting > 0 && <p style={{ fontSize: 'clamp(9px, 2.5vw, 12px)', color: '#F59E0B', marginTop: 6 }}>⏳ {s.waiting}人待ち</p>}
            </div>
          ))}
        </div>

        {/* 最新レポート */}
        <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', color: '#666', marginBottom: 16 }}>最新の進捗レポート</h2>
        {loading && <p style={{ color: '#444', fontSize: 13 }}>読み込み中...</p>}
        {!loading && reports.length === 0 && (
          <div style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ color: '#444', fontSize: 14, marginBottom: 16 }}>まだ報告がありません</p>
            <Link href="/delivery/new" style={{ color: '#A0A0A0', fontSize: 13, textDecoration: 'none' }}>最初に報告する →</Link>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {MODELS.map(model => {
            const modelReports = reports.filter(r => r.model === model)
            if (modelReports.length === 0) return null
            const isOpen = openModels.has(model)
            const mColor = MODEL_COLOR[model] || '#888'
            return (
              <div key={model}>
                <button
                  onClick={() => setOpenModels(prev => { const s = new Set(prev); s.has(model) ? s.delete(model) : s.add(model); return s })}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <span style={{ fontSize: 12, color: '#888', transition: 'transform 150ms', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                  <span style={{ background: mColor + '25', color: mColor, borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>{model}</span>
                  <span style={{ fontSize: 12, color: '#666' }}>{modelReports.length}件</span>
                </button>
                {isOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                    {modelReports.map(r => {
                      const waitDays = calcDays(r.order_date, r.delivery_date)
                      const isComplete = !!r.delivery_date
                      const color = MODEL_COLOR[r.model] || '#888'
                      const cc = commentCounts[r.id] || 0
                      return (
                        <div key={r.id} onClick={() => router.push(`/delivery/${r.id}`)} style={{ ...card, cursor: 'pointer', transition: '120ms' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                            {r.grade && <span style={{ fontSize: 12, color: '#888' }}>{r.grade}</span>}
                            {r.color && <span style={{ fontSize: 12, color: '#666' }}>· {r.color}</span>}
                            {r.region && <span style={{ fontSize: 12, color: '#666' }}>· {r.region}</span>}
                            {r.author_name && r.author_name !== '匿名' && <span style={{ fontSize: 11, color: '#555' }}>by {r.author_name}</span>}
                            {isComplete && waitDays !== null ? (
                              <div style={{ marginLeft: 'auto' }}>
                                <span style={{ fontSize: 36, fontWeight: 800, color: '#10B981', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{waitDays}</span>
                                <span style={{ fontSize: 13, color: '#888', marginLeft: 4 }}>日で納車</span>
                              </div>
                            ) : (
                              <span style={{ marginLeft: 'auto', background: '#F59E0B20', color: '#F59E0B', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600 }}>進行中 {calcDays(r.order_date, null)}日目</span>
                            )}
                          </div>
                          <XPBar orderDate={r.order_date} vinDate={r.vin_date} docsDate={r.docs_date} deliveryDate={r.delivery_date} model={r.model} color={r.color} />
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                              <button onClick={(e) => handleLike(e, r.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: myLikes.has(r.id) ? '#EF4444' : '#444', fontFamily: 'inherit', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4, transition: '150ms' }}>
                                {myLikes.has(r.id) ? '❤️' : '🤍'} {(likeCounts[r.id] || 0) > 0 ? likeCounts[r.id] : ''}
                              </button>
                              {cc > 0 ? (
                                <span style={{ fontSize: 12, color: '#666' }}>💬 {cc}</span>
                              ) : (
                                <span style={{ fontSize: 12, color: '#444' }}>💬</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {reports.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link href="/delivery" style={{ color: '#00FFFF', fontSize: 13, textDecoration: 'none' }}>
              すべてのレポートを見る →
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
