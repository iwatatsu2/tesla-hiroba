'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const MODELS = ['Model Y', 'Model 3', 'Model S', 'Model X', 'Cybertruck']
const MODEL_COLORS: Record<string, string> = {
  'Model Y': '#CC0000', 'Model 3': '#3B82F6', 'Model S': '#8B5CF6',
  'Model X': '#F59E0B', 'Cybertruck': '#10B981',
}

interface Report {
  id: string
  model: string
  grade: string
  order_date: string
  delivery_date: string | null
  region: string | null
  color: string | null
  note: string | null
  created_at: string
  wait_days: number | null
}

function calcWaitDays(order: string, delivery: string | null) {
  if (!delivery) return null
  return Math.round((new Date(delivery).getTime() - new Date(order).getTime()) / 86400000)
}

const C = {
  card: { background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px' },
  label: { fontSize: 10, letterSpacing: '0.15em', color: '#666', marginBottom: 6, display: 'block' as const },
  badge: (color: string) => ({ background: color + '20', color, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }),
}

export default function DeliveryPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedModels, setSelectedModels] = useState<string[]>(MODELS)

  useEffect(() => {
    supabase.from('delivery_reports').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      const enriched = (data || []).map(r => ({ ...r, wait_days: calcWaitDays(r.order_date, r.delivery_date) }))
      setReports(enriched)
      setLoading(false)
    })
  }, [])

  // サマリー: モデル別平均待ち日数
  const summaryByModel = MODELS.map(model => {
    const completed = reports.filter(r => r.model === model && r.wait_days !== null)
    const avg = completed.length ? Math.round(completed.reduce((a, r) => a + r.wait_days!, 0) / completed.length) : null
    const waiting = reports.filter(r => r.model === model && !r.delivery_date).length
    return { model, avg, count: completed.length, waiting }
  })

  // 時系列グラフデータ: 月別平均待ち日数
  const last12 = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (11 - i))
    return d.toISOString().slice(0, 7)
  })
  const chartData = last12.map(month => {
    const row: Record<string, any> = { month: month.slice(5) + '月' }
    MODELS.forEach(model => {
      const filtered = reports.filter(r =>
        r.model === model && r.delivery_date?.startsWith(month) && r.wait_days !== null
      )
      row[model] = filtered.length ? Math.round(filtered.reduce((a, r) => a + r.wait_days!, 0) / filtered.length) : null
    })
    return row
  })

  const toggleModel = (m: string) => {
    setSelectedModels(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px 80px' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#CC0000', marginBottom: 6 }}>DELIVERY TRACKER</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>納車待ちトラッカー</h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>実際のオーナーによる納期レポート {reports.length}件</p>
        </div>
        <Link href="/delivery/new" style={{
          padding: '10px 22px', background: '#CC0000', color: '#fff',
          borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
        }}>
          ＋ 報告する
        </Link>
      </div>

      {/* サマリーカード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, marginBottom: 40 }}>
        {summaryByModel.map(s => (
          <div key={s.model} style={C.card}>
            <p style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>{s.model}</p>
            {s.avg !== null ? (
              <>
                <p style={{ fontSize: 42, fontWeight: 700, letterSpacing: '-0.03em', color: MODEL_COLORS[s.model], lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {s.avg}
                </p>
                <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>日（平均 {s.count}件）</p>
              </>
            ) : (
              <p style={{ fontSize: 24, fontWeight: 700, color: '#444' }}>—</p>
            )}
            {s.waiting > 0 && (
              <p style={{ fontSize: 11, color: '#F59E0B', marginTop: 6 }}>待ち中 {s.waiting}人</p>
            )}
          </div>
        ))}
      </div>

      {/* 時系列グラフ */}
      <div style={{ ...C.card, marginBottom: 40 }}>
        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 16, color: '#F0F0F0' }}>モデル別 待ち日数推移（過去12ヶ月）</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {MODELS.map(m => (
            <button key={m} onClick={() => toggleModel(m)} style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: 'none',
              background: selectedModels.includes(m) ? MODEL_COLORS[m] + '30' : 'rgba(255,255,255,0.05)',
              color: selectedModels.includes(m) ? MODEL_COLORS[m] : '#666',
              fontWeight: selectedModels.includes(m) ? 600 : 400, transition: '150ms ease',
              fontFamily: 'inherit',
            }}>
              {m}
            </button>
          ))}
        </div>
        {reports.length === 0 ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: 13 }}>
            データがまだありません
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} unit="日" />
              <Tooltip
                contentStyle={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#888', fontSize: 11 }}
                itemStyle={{ fontSize: 12 }}
                formatter={(v: any) => [v ? `${v}日` : '—', '']}
              />
              {MODELS.filter(m => selectedModels.includes(m)).map(m => (
                <Line key={m} type="monotone" dataKey={m} stroke={MODEL_COLORS[m]}
                  strokeWidth={2} dot={{ fill: MODEL_COLORS[m], r: 3 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 最新レポート */}
      <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.1em', marginBottom: 16, color: '#888' }}>
        最新の納車報告
      </h2>
      {loading && <p style={{ color: '#444', fontSize: 13 }}>読み込み中...</p>}
      {!loading && reports.length === 0 && (
        <div style={{ ...C.card, textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: '#444', fontSize: 14, marginBottom: 16 }}>まだ報告がありません</p>
          <Link href="/delivery/new" style={{ color: '#CC0000', fontSize: 13, textDecoration: 'none' }}>最初に報告する →</Link>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reports.map(r => (
          <div key={r.id} style={{ ...C.card, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={C.badge(MODEL_COLORS[r.model] || '#888')}>{r.model}</span>
              {r.grade && <span style={{ fontSize: 12, color: '#888' }}>{r.grade}</span>}
              {r.color && <span style={{ fontSize: 12, color: '#666' }}>· {r.color}</span>}
              {r.region && <span style={{ fontSize: 12, color: '#666' }}>· {r.region}</span>}
              <span style={{ fontSize: 11, color: '#444', marginLeft: 'auto' }}>
                {new Date(r.created_at).toLocaleDateString('ja-JP')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <span style={C.label}>注文日</span>
                <span style={{ fontSize: 13, color: '#F0F0F0' }}>{new Date(r.order_date).toLocaleDateString('ja-JP')}</span>
              </div>
              {r.delivery_date ? (
                <>
                  <div style={{ color: '#444', fontSize: 18 }}>→</div>
                  <div>
                    <span style={C.label}>納車日</span>
                    <span style={{ fontSize: 13, color: '#F0F0F0' }}>{new Date(r.delivery_date).toLocaleDateString('ja-JP')}</span>
                  </div>
                  {r.wait_days !== null && (
                    <div style={{ marginLeft: 'auto' }}>
                      <span style={{ fontSize: 40, fontWeight: 800, color: '#CC0000', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                        {r.wait_days}
                      </span>
                      <span style={{ fontSize: 14, color: '#888', marginLeft: 4 }}>日待ち</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ background: '#F59E0B20', color: '#F59E0B', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 600 }}>
                  待ち中
                </div>
              )}
            </div>

            {r.note && <p style={{ fontSize: 13, color: '#888', lineHeight: 1.7 }}>{r.note}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
