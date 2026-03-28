'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const MODELS = ['Model Y', 'Model 3']
const MODEL_COLOR: Record<string, string> = { 'Model Y': '#CC0000', 'Model 3': '#3B82F6' }

const STAGES = [
  { key: 'order_date', label: '注文', icon: '📋' },
  { key: 'vin_date', label: 'VIN', icon: '🔢' },
  { key: 'docs_date', label: '書類', icon: '📄' },
  { key: 'confirmed_date', label: '納車確定', icon: '✅' },
  { key: 'delivery_date', label: '納車', icon: '🚗' },
]

function calcDays(a: string | null, b: string | null) {
  if (!a || !b) return null
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

function ProgressBar({ report }: { report: any }) {
  const filled = STAGES.filter(s => report[s.key]).length
  const total = STAGES.length
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {STAGES.map((s, i) => {
          const done = !!report[s.key]
          const isLast = i === STAGES.length - 1
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1 }}>
              <div title={s.label} style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: done ? (s.key === 'delivery_date' ? '#10B981' : MODEL_COLOR[report.model] || '#CC0000') : '#2A2A2A',
                border: `2px solid ${done ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, transition: '150ms ease',
              }}>
                {done ? <span style={{ fontSize: 12 }}>✓</span> : <span style={{ fontSize: 11, opacity: 0.4 }}>{i+1}</span>}
              </div>
              {!isLast && (
                <div style={{ flex: 1, height: 2, background: done && report[STAGES[i+1]?.key] ? MODEL_COLOR[report.model] || '#CC0000' : '#2A2A2A', margin: '0 2px' }} />
              )}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {STAGES.map(s => (
          <span key={s.key} style={{ fontSize: 9, color: report[s.key] ? '#888' : '#333', textAlign: 'center', flex: 1 }}>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

const card = { background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 22px' }

export default function DeliveryPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('delivery_reports').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setReports(data || [])
      setLoading(false)
    })
  }, [])

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
          <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#CC0000', marginBottom: 6, fontWeight: 600 }}>DELIVERY TRACKER</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>納車待ちトラッカー</h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>オーナー報告 {reports.length}件 · 途中経過も随時更新中</p>
        </div>
        <Link href="/delivery/new" style={{ padding: '10px 22px', background: '#CC0000', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          ＋ 進捗を報告
        </Link>
      </div>

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
              <p style={{ fontSize: 28, fontWeight: 700, color: '#333' }}>データなし</p>
            )}
            {s.waiting > 0 && <p style={{ fontSize: 12, color: '#F59E0B', marginTop: 8 }}>⏳ 待ち中 {s.waiting}人</p>}
          </div>
        ))}
      </div>

      {/* 時系列グラフ */}
      <div style={{ ...card, marginBottom: 36 }}>
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>モデル別 待ち日数推移（過去12ヶ月）</p>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {MODELS.map(m => (
            <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 3, borderRadius: 2, background: MODEL_COLOR[m] }} />
              <span style={{ fontSize: 11, color: '#888' }}>{m}</span>
            </div>
          ))}
        </div>
        {reports.length === 0 ? (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: 13 }}>データがまだありません</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
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
          <Link href="/delivery/new" style={{ color: '#CC0000', fontSize: 13, textDecoration: 'none' }}>最初に報告する →</Link>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reports.map(r => {
          const waitDays = calcDays(r.order_date, r.delivery_date)
          const isComplete = !!r.delivery_date
          return (
            <div key={r.id} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ background: (MODEL_COLOR[r.model] || '#888') + '25', color: MODEL_COLOR[r.model] || '#888', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>{r.model}</span>
                {r.grade && <span style={{ fontSize: 12, color: '#888' }}>{r.grade}</span>}
                {r.color && <span style={{ fontSize: 12, color: '#666' }}>· {r.color}</span>}
                {r.region && <span style={{ fontSize: 12, color: '#666' }}>· {r.region}</span>}
                {isComplete && waitDays !== null ? (
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: '#10B981', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{waitDays}</span>
                    <span style={{ fontSize: 13, color: '#888', marginLeft: 4 }}>日で納車</span>
                  </div>
                ) : (
                  <span style={{ marginLeft: 'auto', background: '#F59E0B20', color: '#F59E0B', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600 }}>進行中</span>
                )}
              </div>

              {/* 進捗バー */}
              <ProgressBar report={r} />

              {/* 各ステージの日付 */}
              <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
                {STAGES.filter(s => r[s.key]).map(s => (
                  <div key={s.key}>
                    <p style={{ fontSize: 9, color: '#555', marginBottom: 2, letterSpacing: '0.05em' }}>{s.icon} {s.label}</p>
                    <p style={{ fontSize: 12, color: '#F0F0F0', fontVariantNumeric: 'tabular-nums' }}>
                      {new Date(r[s.key]).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>

              {r.note && <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>{r.note}</p>}
              <p style={{ fontSize: 10, color: '#333', marginTop: 8 }}>{new Date(r.created_at).toLocaleDateString('ja-JP')}投稿</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
