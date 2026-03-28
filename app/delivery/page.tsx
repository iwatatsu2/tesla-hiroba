'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const MODELS = ['Model Y', 'Model 3']
const MODEL_COLOR: Record<string, string> = { 'Model Y': '#CC0000', 'Model 3': '#3B82F6' }

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
  // 全体の時間軸範囲を計算
  const allDates = reports.map(r => toMs(r.order_date)).filter(Boolean) as number[]
  const minMs = Math.min(...allDates)
  const maxMs = Math.max(today, ...reports.map(r => toMs(r.delivery_date) || today))
  const rangeMs = maxMs - minMs || 1

  const toX = (ms: number) => ((ms - minMs) / rangeMs) * 100

  // X軸ラベル（月単位）
  const labels: { label: string; x: number }[] = []
  const start = new Date(minMs)
  start.setDate(1)
  while (start.getTime() <= maxMs) {
    labels.push({
      label: `${start.getMonth() + 1}月`,
      x: toX(start.getTime()),
    })
    start.setMonth(start.getMonth() + 1)
  }

  return (
    <div style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px', marginBottom: 36, overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 13, fontWeight: 600 }}>納車進捗ガントチャート</p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
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
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', border: '2px solid #10B981' }} />
            <span style={{ fontSize: 11, color: '#888' }}>納車🚗</span>
          </div>
        </div>
      </div>

      <div style={{ minWidth: 500 }}>
        {/* X軸ラベル */}
        <div style={{ position: 'relative', height: 20, marginBottom: 4, marginLeft: 80 }}>
          {labels.map((l, i) => (
            <span key={i} style={{
              position: 'absolute', left: `${l.x}%`,
              fontSize: 9, color: '#555', transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
            }}>{l.label}</span>
          ))}
        </div>

        {/* 今日線 */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: `calc(80px + ${toX(today)}% * (100% - 80px) / 100)`,
            top: 0, bottom: 0, width: 1,
            background: 'rgba(255,255,255,0.15)', zIndex: 1, pointerEvents: 'none',
          }} />

          {/* 各レポートの行 */}
          {reports.map(r => {
            const orderMs = toMs(r.order_date)
            if (!orderMs) return null
            const endMs = toMs(r.delivery_date) || today
            const barLeft = toX(orderMs)
            const barRight = toX(endMs)
            const barWidth = Math.max(barRight - barLeft, 0.5)
            const isComplete = !!r.delivery_date
            const waitDays = calcDays(r.order_date, r.delivery_date)
            const color = MODEL_COLOR[r.model] || '#888'

            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 10, minHeight: 32 }}>
                {/* 左ラベル */}
                <div style={{ width: 80, flexShrink: 0, paddingRight: 10 }}>
                  <p style={{ fontSize: 10, color: '#888', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.model}
                  </p>
                  <p style={{ fontSize: 9, color: '#555', margin: 0 }}>{r.grade || ''}</p>
                </div>

                {/* バー */}
                <div style={{ flex: 1, position: 'relative', height: 28 }}>
                  {/* バー本体 */}
                  <div style={{
                    position: 'absolute',
                    left: `${barLeft}%`,
                    width: `${barWidth}%`,
                    height: '100%',
                    background: isComplete
                      ? `linear-gradient(90deg, ${color}60, ${color})`
                      : `repeating-linear-gradient(90deg, ${color}50, ${color}50 8px, ${color}25 8px, ${color}25 16px)`,
                    borderRadius: 4,
                    display: 'flex', alignItems: 'center',
                    paddingLeft: 6,
                    overflow: 'hidden',
                  }}>
                    {waitDays !== null && (
                      <span style={{ fontSize: 10, color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {waitDays}日
                      </span>
                    )}
                  </div>

                  {/* マイルストーン */}
                  {MILESTONES.map(ms => {
                    const msMs = toMs(r[ms.key])
                    if (!msMs) return null
                    const x = toX(msMs)
                    return (
                      <div key={ms.key} title={`${ms.label}: ${new Date(msMs).toLocaleDateString('ja-JP')}`} style={{
                        position: 'absolute',
                        left: `${x}%`,
                        top: '50%', transform: 'translate(-50%, -50%)',
                        width: 8, height: 8, borderRadius: '50%',
                        background: ms.color,
                        border: '1.5px solid #1A1A1A',
                        zIndex: 2,
                      }} />
                    )
                  })}

                  {/* 納車マーク */}
                  {r.delivery_date && (
                    <div title={`納車: ${new Date(r.delivery_date).toLocaleDateString('ja-JP')}`} style={{
                      position: 'absolute',
                      left: `${toX(toMs(r.delivery_date)!)}%`,
                      top: '50%', transform: 'translate(-50%, -50%)',
                      width: 12, height: 12, borderRadius: '50%',
                      background: '#10B981',
                      border: '2px solid #1A1A1A',
                      zIndex: 3,
                    }} />
                  )}
                </div>

                {/* 右ラベル */}
                <div style={{ width: 50, flexShrink: 0, paddingLeft: 8, textAlign: 'right' }}>
                  {isComplete ? (
                    <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>完了</span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#F59E0B' }}>待中</span>
                  )}
                </div>
              </div>
            )
          })}

          {/* 今日ラベル */}
          <div style={{
            position: 'absolute',
            left: `calc(80px + ${toX(today)}% * (100% - 80px) / 100)`,
            top: -20, transform: 'translateX(-50%)',
            fontSize: 9, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap',
          }}>今日</div>
        </div>
      </div>
    </div>
  )
}

const card = { background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 22px' }

export default function DeliveryPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('delivery_reports').select('*').order('order_date', { ascending: true }).then(({ data }) => {
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
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>オーナー報告 {reports.length}件</p>
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
          <Link href="/delivery/new" style={{ color: '#CC0000', fontSize: 13, textDecoration: 'none' }}>最初に報告する →</Link>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[...reports].reverse().map(r => {
          const waitDays = calcDays(r.order_date, r.delivery_date)
          const isComplete = !!r.delivery_date
          const color = MODEL_COLOR[r.model] || '#888'
          return (
            <div key={r.id} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ background: color + '25', color, borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>{r.model}</span>
                {r.grade && <span style={{ fontSize: 12, color: '#888' }}>{r.grade}</span>}
                {r.color && <span style={{ fontSize: 12, color: '#666' }}>· {r.color}</span>}
                {r.region && <span style={{ fontSize: 12, color: '#666' }}>· {r.region}</span>}
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
              {r.note && <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>{r.note}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
