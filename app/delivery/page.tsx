'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import XPBar from '@/components/XPBar'

interface FeaturedCode {
  id: string
  display_name: string
  referral_code: string
  score: number
}

const TESLA_REFERRAL_BASE = 'https://www.tesla.com/referral/'
function buildReferralUrl(code: string): string {
  if (code.startsWith('http')) return code
  return TESLA_REFERRAL_BASE + code
}

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

  // 表示範囲：最も古い注文日の1ヶ月前 〜 今日+2ヶ月
  const allOrderMs = reports.map(r => toMs(r.order_date)).filter(Boolean) as number[]
  const startDate = new Date(Math.min(...allOrderMs))
  startDate.setDate(1)
  startDate.setMonth(startDate.getMonth() - 1)
  const endDate = new Date(todayDate)
  endDate.setMonth(endDate.getMonth() + 2)
  endDate.setDate(1)
  // 納車済みで範囲外のものも含める
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

  // 月ラベル生成（年が変わる月は年も表示）
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
        {/* 左ラベル列 */}
        <div style={{ width: 80, flexShrink: 0 }}>
          <div style={{ height: 24 }} />
          {reports.map(r => (
            <div key={r.id} style={{ height: 36, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontSize: 10, color: '#888', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.model}</p>
              <p style={{ fontSize: 9, color: '#555', margin: 0 }}>{r.grade || ''}</p>
            </div>
          ))}
        </div>

        {/* 右バー列 */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* X軸ラベル */}
          <div style={{ position: 'relative', height: 28 }}>
            {labels.map((l, i) => (
              <span key={i} style={{ position: 'absolute', left: `${l.x}%`, top: 8, fontSize: 9, color: '#555', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>{l.label}</span>
            ))}
            {/* 今日ラベル（X軸上） */}
            <span style={{ position: 'absolute', left: `${todayX}%`, top: 6, fontSize: 9, fontWeight: 700, color: '#E0E0E0', transform: 'translateX(-50%)', whiteSpace: 'nowrap', background: '#2A2A2A', padding: '1px 5px', borderRadius: 3 }}>TODAY</span>
          </div>

          {/* 今日線 */}
          <div style={{ position: 'absolute', left: `${todayX}%`, top: 28, bottom: 0, width: 2, background: 'rgba(220,220,220,0.4)', zIndex: 1 }} />

          {/* バー行 */}
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


const card = { background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 22px' }

export default function DeliveryPage() {
  const router = useRouter()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [myNickname, setMyNickname] = useState('')
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [featured, setFeatured] = useState<FeaturedCode | null>(null)
  const [referralClicked, setReferralClicked] = useState(false)

  useEffect(() => {
    setMyNickname(localStorage.getItem('delivery_nickname') || '')
    supabase.from('delivery_reports').select('*').order('order_date', { ascending: true }).then(({ data }) => {
      setReports(data || [])
      setLoading(false)
      // コメント数を取得
      if (data && data.length > 0) {
        supabase.from('delivery_comments').select('report_id').then(({ data: comments }) => {
          const counts: Record<string, number> = {}
          comments?.forEach(c => { counts[c.report_id] = (counts[c.report_id] || 0) + 1 })
          setCommentCounts(counts)
        })
      }
    })
    // 紹介コード取得
    fetch('/api/referral').then(r => r.json()).then(d => setFeatured(d.featured))
  }, [])

  const handleReferralClick = async () => {
    if (!featured || referralClicked) return
    fetch('/api/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referral_code: featured.referral_code }),
    })
    setReferralClicked(true)
    window.open(buildReferralUrl(featured.referral_code), '_blank', 'noopener,noreferrer')
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

      {/* 紹介コード */}
      {featured && (
        <div style={{ ...card, marginBottom: 24, border: '1px solid rgba(0,255,255,0.2)', background: 'rgba(0,255,255,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#00FFFF', marginBottom: 6 }}>REFERRAL CODE</p>
              <p style={{ fontSize: 12, color: '#888' }}>これから注文する方はこちらの紹介リンクをご利用ください</p>
            </div>
            <button onClick={handleReferralClick} disabled={referralClicked}
              style={{
                fontFamily: "'Press Start 2P', monospace", fontSize: 8, padding: '10px 18px',
                background: referralClicked ? '#1A1A1A' : '#00FFFF', color: referralClicked ? '#404040' : '#000',
                border: `1px solid ${referralClicked ? '#2A2A2A' : '#00FFFF'}`,
                cursor: referralClicked ? 'default' : 'pointer', whiteSpace: 'nowrap',
              }}>
              {referralClicked ? 'OPENED!' : '> 紹介リンクで注文'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#FF6B35', marginTop: 10 }}>⚠ 注文確定前にこのボタンからTesla公式サイトを開いてください</p>
          <Link href="/referral" style={{ fontSize: 11, color: '#555', marginTop: 6, display: 'inline-block', textDecoration: 'none' }}>
            ランキング詳細を見る →
          </Link>
        </div>
      )}

      {/* サマリーカード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 36 }}>
        {summary.map(s => (
          <div key={s.model} style={card}>
            <p style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>{s.model}</p>
            {s.avg !== null ? (
              <>
                <p style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em', color: MODEL_COLOR[s.model], lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.avg}</p>
                <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>日（注文→納車 平均 · {s.count}件）</p>
              </>
            ) : (
              <p style={{ fontSize: 24, fontWeight: 700, color: '#333' }}>データなし</p>
            )}
            {s.waiting > 0 && <p style={{ fontSize: 12, color: '#F59E0B', marginTop: 8 }}>⏳ 待ち中 {s.waiting}人</p>}
          </div>
        ))}
      </div>

      {/* ガントチャート */}
      {!loading && <GanttChart reports={reports} />}

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
        {[...reports].reverse().map(r => {
          const waitDays = calcDays(r.order_date, r.delivery_date)
          const isComplete = !!r.delivery_date
          const color = MODEL_COLOR[r.model] || '#888'
          const isMyPost = myNickname && r.author_name === myNickname
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
                {cc > 0 ? (
                  <span style={{ fontSize: 12, color: '#666' }}>💬 {cc}</span>
                ) : (
                  <span style={{ fontSize: 12, color: '#444' }}>💬 コメントする</span>
                )}
                <button onClick={(e) => { e.stopPropagation(); router.push(`/delivery/edit?id=${r.id}`) }}
                  style={{ padding: '5px 14px', fontSize: 11, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#666', cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✏️ 修正する
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
