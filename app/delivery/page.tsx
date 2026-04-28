'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import XPBar from '@/components/XPBar'

const MODELS = ['Model Y', 'Model YL', 'Model 3']
const MODEL_COLOR: Record<string, string> = { 'Model Y': '#A0A0A0', 'Model YL': '#10B981', 'Model 3': '#3B82F6' }

const MILESTONES = [
  { key: 'vin_date', label: 'VIN', color: '#F59E0B' },
  { key: 'docs_date', label: '書類', color: '#8B5CF6' },
  { key: 'confirmed_date', label: '確定', color: '#10B981' },
]

function calcDays(a: string | null, b: string | null) {
  if (!a) return null
  const end = b ? new Date(b) : new Date()
  return Math.round((end.getTime() - new Date(a).getTime()) / 86400000)
}

function toMs(d: string | null) {
  return d ? new Date(d).getTime() : null
}

// ガントチャート
function GanttChart({ reports }: { reports: any[] }) {
  if (reports.length === 0) return null

  const today = Date.now()
  const todayDate = new Date()

  const allOrderMs = reports.map(r => toMs(r.order_date)).filter(Boolean) as number[]
  const startDate = new Date(Math.min(...allOrderMs))
  startDate.setDate(1)
  startDate.setMonth(startDate.getMonth() - 1)
  const endDate = new Date(todayDate)
  endDate.setMonth(endDate.getMonth() + 2)
  endDate.setDate(1)
  const maxDelivery = Math.max(...reports.map(r => toMs(r.delivery_date) || 0).filter(Boolean))
  if (maxDelivery > endDate.getTime()) {
    const d = new Date(maxDelivery)
    d.setMonth(d.getMonth() + 1)
    d.setDate(1)
    endDate.setTime(d.getTime())
  }

  const minMs = startDate.getTime()
  const maxMs = endDate.getTime()
  const rangeMs = maxMs - minMs || 1
  const toX = (ms: number) => Math.max(0, Math.min(100, ((ms - minMs) / rangeMs) * 100))
  const todayX = toX(today)

  const labels: { label: string; x: number }[] = []
  const d = new Date(startDate)
  let prevYear = -1
  while (d.getTime() < maxMs) {
    const yr = d.getFullYear()
    const mo = d.getMonth() + 1
    const label = yr !== prevYear ? `${yr}/${mo}月` : `${mo}月`
    labels.push({ label, x: toX(d.getTime()) })
    prevYear = yr
    d.setMonth(d.getMonth() + 1)
  }

  return (
    <div style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px', marginBottom: 36, overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 13, fontWeight: 600 }}>納車進捗ガントチャート</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {MODELS.map(m => (
            <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 4, borderRadius: 2, background: MODEL_COLOR[m] }} />
              <span style={{ fontSize: 11, color: '#888' }}>{m}</span>
            </div>
          ))}
          {MILESTONES.map(m => (
            <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
              <span style={{ fontSize: 11, color: '#888' }}>{m.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: 11, color: '#888' }}>納車</span>
          </div>
        </div>
      </div>

      <div style={{ minWidth: 500, display: 'flex' }}>
        <div style={{ width: 80, flexShrink: 0 }}>
          <div style={{ height: 24 }} />
          {reports.map(r => (
            <div key={r.id} style={{ height: 36, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontSize: 10, color: '#888', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.model}</p>
              <p style={{ fontSize: 9, color: '#555', margin: 0 }}>{r.grade || ''}</p>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ position: 'relative', height: 28 }}>
            {labels.map((l, i) => (
              <span key={i} style={{ position: 'absolute', left: `${l.x}%`, top: 8, fontSize: 9, color: '#555', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>{l.label}</span>
            ))}
            <span style={{ position: 'absolute', left: `${todayX}%`, top: 6, fontSize: 9, fontWeight: 700, color: '#E0E0E0', transform: 'translateX(-50%)', whiteSpace: 'nowrap', background: '#2A2A2A', padding: '1px 5px', borderRadius: 3 }}>TODAY</span>
          </div>

          <div style={{ position: 'absolute', left: `${todayX}%`, top: 28, bottom: 0, width: 2, background: 'rgba(220,220,220,0.4)', zIndex: 1 }} />

          {reports.map(r => {
            const orderMs = toMs(r.order_date)
            if (!orderMs) return null
            const endMs = toMs(r.delivery_date) || today
            const barLeft = toX(orderMs)
            const barWidth = Math.max(toX(endMs) - barLeft, 0.5)
            const isComplete = !!r.delivery_date
            const waitDays = calcDays(r.order_date, r.delivery_date)
            const color = MODEL_COLOR[r.model] || '#888'
            return (
              <div key={r.id} style={{ position: 'relative', height: 36, display: 'flex', alignItems: 'center' }}>
                <div style={{
                  position: 'absolute', left: `${barLeft}%`, width: `${barWidth}%`, height: 24, borderRadius: 5,
                  background: isComplete ? `linear-gradient(90deg, ${color}70, ${color})` : `repeating-linear-gradient(90deg, ${color}55, ${color}55 8px, ${color}28 8px, ${color}28 16px)`,
                  display: 'flex', alignItems: 'center', paddingLeft: 8, overflow: 'hidden',
                }}>
                  {waitDays !== null && (
                    <span style={{ fontSize: 10, color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{waitDays}日</span>
                  )}
                </div>
                {MILESTONES.map(ms => {
                  const msMs = toMs(r[ms.key])
                  if (!msMs) return null
                  return (
                    <div key={ms.key} title={`${ms.label}: ${new Date(msMs).toLocaleDateString('ja-JP')}`} style={{
                      position: 'absolute', left: `${toX(msMs)}%`, top: '50%', transform: 'translate(-50%, -50%)',
                      width: 9, height: 9, borderRadius: '50%', background: ms.color, border: '2px solid #1A1A1A', zIndex: 2,
                    }} />
                  )
                })}
                {r.delivery_date && (
                  <div title={`納車: ${new Date(r.delivery_date).toLocaleDateString('ja-JP')}`} style={{
                    position: 'absolute', left: `${toX(toMs(r.delivery_date)!)}%`, top: '50%', transform: 'translate(-50%, -50%)',
                    width: 14, height: 14, borderRadius: '50%', background: '#10B981', border: '2px solid #1A1A1A', zIndex: 3,
                  }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


// オーナーバッジ定義
const OWNER_BADGES = [
  { days: 30, icon: '🌱' },
  { days: 100, icon: '💯' },
  { days: 365, icon: '🏆' },
  { days: 730, icon: '👑' },
]

function getTopBadge(deliveryDate: string | null): string | null {
  if (!deliveryDate) return null
  const days = Math.round((Date.now() - new Date(deliveryDate).getTime()) / 86400000)
  const earned = OWNER_BADGES.filter(b => days >= b.days)
  return earned.length > 0 ? earned[earned.length - 1].icon : null
}

const card = { background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 22px' }

export default function DeliveryPage() {
  const router = useRouter()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set())
  const [reviews, setReviews] = useState<Record<string, number>>({})

  useEffect(() => {
    // ユーザー情報
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUser(user)
        const { data: profile } = await supabase.from('profiles').select('tsla_display_name, display_name').eq('id', user.id).single()
        setDisplayName(profile?.tsla_display_name || profile?.display_name || '')
        // 自分のいいね
        supabase.from('delivery_likes').select('report_id').eq('user_id', user.id).then(({ data: likes }) => {
          setMyLikes(new Set(likes?.map(l => l.report_id) || []))
        })
      }
    })

    supabase.from('delivery_reports').select('*').order('order_date', { ascending: true }).then(({ data }) => {
      setReports(data || [])
      setLoading(false)
      if (data && data.length > 0) {
        supabase.from('delivery_comments').select('report_id').then(({ data: comments }) => {
          const counts: Record<string, number> = {}
          comments?.forEach(c => { counts[c.report_id] = (counts[c.report_id] || 0) + 1 })
          setCommentCounts(counts)
        })
        supabase.from('delivery_likes').select('report_id').then(({ data: likes }) => {
          const counts: Record<string, number> = {}
          likes?.forEach(l => { counts[l.report_id] = (counts[l.report_id] || 0) + 1 })
          setLikeCounts(counts)
        })
        // レビュー取得
        supabase.from('delivery_reviews').select('report_id, rating').then(({ data: rvs }) => {
          const map: Record<string, number> = {}
          rvs?.forEach(r => { map[r.report_id] = r.rating })
          setReviews(map)
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

  const summary = MODELS.map(model => {
    const completed = reports.filter(r => r.model === model && r.order_date && r.delivery_date)
    const days = completed.map(r => calcDays(r.order_date, r.delivery_date)).filter(d => d !== null) as number[]
    const avg = days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : null
    const waiting = reports.filter(r => r.model === model && !r.delivery_date).length
    return { model, avg, count: days.length, waiting }
  })

  const last12 = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (11 - i))
    return d.toISOString().slice(0, 7)
  })
  const chartData = last12.map(month => {
    const row: Record<string, any> = { month: month.slice(5) + '月' }
    MODELS.forEach(model => {
      const items = reports.filter(r => r.model === model && r.delivery_date?.startsWith(month) && r.order_date)
      const days = items.map(r => calcDays(r.order_date, r.delivery_date)).filter(d => d !== null) as number[]
      row[model] = days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : null
    })
    return row
  })

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#A0A0A0', marginBottom: 6, fontWeight: 600 }}>DELIVERY TRACKER</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>納車待ちトラッカー</h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>オーナー報告 {reports.length}件</p>
        </div>
        <Link href="/delivery/new" style={{ padding: '10px 22px', background: '#A0A0A0', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          ＋ 進捗を報告
        </Link>
      </div>

      {/* サマリーカード */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
        {summary.map(s => (
          <div key={s.model} onClick={() => setSelectedModel(prev => prev === s.model ? null : s.model)} style={{ ...card, flex: 1, minWidth: 0, cursor: 'pointer', outline: selectedModel === s.model ? `2px solid ${MODEL_COLOR[s.model]}` : 'none', opacity: selectedModel && selectedModel !== s.model ? 0.4 : 1, transition: 'opacity 150ms, outline 150ms', padding: '16px 12px' }}>
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

      {/* オーナー満足度 */}
      {(() => {
        const ratings = Object.values(reviews)
        if (ratings.length === 0) return null
        const avg = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        return (
          <div style={{ ...card, marginBottom: 36, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>OWNER SATISFACTION</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: '#F59E0B', lineHeight: 1 }}>{avg}</span>
                <span style={{ fontSize: 20, color: '#F59E0B' }}>{'★'.repeat(Math.round(Number(avg)))}</span>
              </div>
              <p style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{ratings.length}件のオーナーレビュー</p>
            </div>
            <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 120 }}>
              {[5, 4, 3, 2, 1].map(n => {
                const count = ratings.filter(r => r === n).length
                const pct = (count / ratings.length) * 100
                return (
                  <div key={n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: '100%', height: 40, background: '#242424', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${pct}%`, background: '#F59E0B40', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 9, color: '#666' }}>{n}★</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {selectedModel && (
        <p onClick={() => setSelectedModel(null)} style={{ fontSize: 12, color: '#888', marginBottom: 12, cursor: 'pointer' }}>
          🔍 {selectedModel} でフィルター中　<span style={{ color: '#555', textDecoration: 'underline' }}>すべて表示</span>
        </p>
      )}

      {/* ガントチャート */}
      {!loading && <GanttChart reports={selectedModel ? reports.filter(r => r.model === selectedModel) : reports} />}

      {/* 時系列グラフ */}
      <div style={{ ...card, marginBottom: 36 }}>
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>モデル別 待ち日数推移（過去12ヶ月）</p>
        {reports.length === 0 ? (
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: 13 }}>データがまだありません</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <XAxis dataKey="month" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} unit="日" />
              <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} labelStyle={{ color: '#888', fontSize: 11 }} formatter={(v: any) => [v ? `${v}日` : '—', '']} />
              {MODELS.map(m => <Line key={m} type="monotone" dataKey={m} stroke={MODEL_COLOR[m]} strokeWidth={2} dot={{ fill: MODEL_COLOR[m], r: 3 }} connectNulls />)}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* レポート一覧 */}
      <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', color: '#666', marginBottom: 16 }}>最新の進捗レポート</h2>
      {loading && <p style={{ color: '#444', fontSize: 13 }}>読み込み中...</p>}
      {!loading && reports.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: '#444', fontSize: 14, marginBottom: 16 }}>まだ報告がありません</p>
          <Link href="/delivery/new" style={{ color: '#A0A0A0', fontSize: 13, textDecoration: 'none' }}>最初に報告する →</Link>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[...reports].filter(r => !selectedModel || r.model === selectedModel).reverse().map(r => {
          const waitDays = calcDays(r.order_date, r.delivery_date)
          const isComplete = !!r.delivery_date
          const color = MODEL_COLOR[r.model] || '#888'
          const isMyPost = user && r.user_id === user.id
          const cc = commentCounts[r.id] || 0
          return (
            <div key={r.id} onClick={() => router.push(`/delivery/${r.id}`)} style={{ ...card, border: isMyPost ? '1px solid rgba(255,255,255,0.25)' : card.border, cursor: 'pointer', transition: '120ms' }}>
              {isMyPost && (
                <div style={{ fontSize: 10, color: '#A0A0A0', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 8 }}>👤 あなたの投稿</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ background: color + '25', color, borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>{r.model}</span>
                {r.grade && <span style={{ fontSize: 12, color: '#888' }}>{r.grade}</span>}
                {r.color && <span style={{ fontSize: 12, color: '#666' }}>· {r.color}</span>}
                {r.region && <span style={{ fontSize: 12, color: '#666' }}>· {r.region}</span>}
                {r.author_name && r.author_name !== '匿名' && <span style={{ fontSize: 11, color: '#555' }}>by {r.author_name}</span>}
                {getTopBadge(r.delivery_date) && <span style={{ fontSize: 14 }}>{getTopBadge(r.delivery_date)}</span>}
                {reviews[r.id] && <span style={{ fontSize: 11, color: '#F59E0B' }}>{'★'.repeat(reviews[r.id])}</span>}
                {isComplete && waitDays !== null ? (
                  <div style={{ marginLeft: 'auto' }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: '#10B981', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{waitDays}</span>
                    <span style={{ fontSize: 13, color: '#888', marginLeft: 4 }}>日で納車</span>
                  </div>
                ) : (
                  <span style={{ marginLeft: 'auto', background: '#F59E0B20', color: '#F59E0B', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600 }}>進行中 {calcDays(r.order_date, null)}日目</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { key: 'order_date', icon: '📋', label: '注文' },
                  { key: 'vin_date', icon: '🔢', label: 'VIN' },
                  { key: 'docs_date', icon: '📄', label: '書類' },
                  { key: 'confirmed_date', icon: '✅', label: '確定' },
                  { key: 'delivery_date', icon: '🚗', label: '納車' },
                ].filter(s => r[s.key]).map(s => (
                  <div key={s.key}>
                    <p style={{ fontSize: 9, color: '#555', marginBottom: 2 }}>{s.icon} {s.label}</p>
                    <p style={{ fontSize: 12, color: '#F0F0F0', fontVariantNumeric: 'tabular-nums' }}>
                      {new Date(r[s.key]).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
              <XPBar
                orderDate={r.order_date}
                vinDate={r.vin_date}
                docsDate={r.docs_date}
                deliveryDate={r.delivery_date}
                model={r.model}
                color={r.color}
              />
              {r.note && <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>{r.note}</p>}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <button onClick={(e) => handleLike(e, r.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: myLikes.has(r.id) ? '#EF4444' : '#444', fontFamily: 'inherit', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4, transition: '150ms' }}>
                    {myLikes.has(r.id) ? '❤️' : '🤍'} {(likeCounts[r.id] || 0) > 0 ? likeCounts[r.id] : ''}
                  </button>
                  {cc > 0 ? (
                    <span style={{ fontSize: 12, color: '#666' }}>💬 {cc}</span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#444' }}>💬 コメントする</span>
                  )}
                </div>
                {isMyPost && (
                  <button onClick={(e) => { e.stopPropagation(); router.push(`/delivery/edit?id=${r.id}`) }}
                    style={{ padding: '5px 14px', fontSize: 11, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#666', cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✏️ 修正する
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
