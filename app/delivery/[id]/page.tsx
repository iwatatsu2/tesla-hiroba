'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, DeliveryComment } from '@/lib/supabase'
import XPBar from '@/components/XPBar'

const MODEL_COLOR: Record<string, string> = { 'Model Y': '#A0A0A0', 'Model YL': '#10B981', 'Model 3': '#3B82F6' }

function calcDays(a: string | null, b: string | null) {
  if (!a) return null
  const end = b ? new Date(b) : new Date()
  return Math.round((end.getTime() - new Date(a).getTime()) / 86400000)
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'たった今'
  if (min < 60) return `${min}分前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}時間前`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}日前`
  return new Date(dateStr).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const ch = name?.[0]?.toUpperCase() || '?'
  const hue = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue},25%,28%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: `hsl(${hue},40%,75%)`,
    }}>{ch}</div>
  )
}

const card = { background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 22px' }

const MILESTONES = [
  { key: 'order_date', icon: '📋', label: '注文' },
  { key: 'vin_date', icon: '🔢', label: 'VIN' },
  { key: 'docs_date', icon: '📄', label: '書類' },
  { key: 'confirmed_date', icon: '✅', label: '確定' },
  { key: 'delivery_date', icon: '🚗', label: '納車' },
]

export default function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [report, setReport] = useState<any>(null)
  const [comments, setComments] = useState<DeliveryComment[]>([])
  const [commentBody, setCommentBody] = useState('')
  const [commentName, setCommentName] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('delivery_nickname') || '' : ''
  )
  const [submitting, setSubmitting] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: r } = await supabase.from('delivery_reports').select('*').eq('id', id).single()
      setReport(r)
      const { data: c } = await supabase.from('delivery_comments').select('*').eq('report_id', id).order('created_at')
      setComments(c || [])
      // いいね取得
      const { data: likes } = await supabase.from('delivery_likes').select('liker_name').eq('report_id', id)
      setLikeCount(likes?.length || 0)
      const nick = localStorage.getItem('delivery_nickname') || ''
      if (nick && likes?.some(l => l.liker_name === nick)) setLiked(true)
    }
    load()
  }, [id])

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentBody.trim()) return
    setSubmitting(true)
    const name = commentName.trim() || '匿名'
    if (commentName.trim()) localStorage.setItem('delivery_nickname', commentName.trim())
    const { data } = await supabase.from('delivery_comments').insert({
      report_id: id, body: commentBody.trim(), author_name: name,
    }).select().single()
    if (data) setComments(prev => [...prev, data])
    setCommentBody('')
    setSubmitting(false)
  }

  if (!report) return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px', color: '#444', textAlign: 'center', fontSize: 14 }}>
      読み込み中...
    </div>
  )

  const color = MODEL_COLOR[report.model] || '#888'
  const waitDays = calcDays(report.order_date, report.delivery_date)
  const isComplete = !!report.delivery_date

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* ナビ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 60, background: 'rgba(13,13,13,0.97)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 20, fontFamily: 'inherit', padding: '4px 8px' }}>←</button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>納車レポート</span>
      </div>

      {/* レポート詳細 */}
      <div style={{ padding: '20px' }}>
        <div style={{ ...card, marginBottom: 16 }}>
          {/* モデル・ステータス */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{ background: color + '25', color, borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>{report.model}</span>
            {report.grade && <span style={{ fontSize: 12, color: '#888' }}>{report.grade}</span>}
            {report.color && <span style={{ fontSize: 12, color: '#666' }}>· {report.color}</span>}
            {report.region && <span style={{ fontSize: 12, color: '#666' }}>· {report.region}</span>}
            {report.author_name && report.author_name !== '匿名' && (
              <span style={{ fontSize: 11, color: '#555' }}>by {report.author_name}</span>
            )}
          </div>

          {/* 納車日数 */}
          {isComplete && waitDays !== null ? (
            <div style={{ textAlign: 'center', marginBottom: 16, padding: '16px 0', background: 'rgba(16,185,129,0.06)', borderRadius: 8 }}>
              <span style={{ fontSize: 56, fontWeight: 800, color: '#10B981', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{waitDays}</span>
              <span style={{ fontSize: 14, color: '#888', marginLeft: 6 }}>日で納車</span>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: 16, padding: '12px 0' }}>
              <span style={{ background: '#F59E0B20', color: '#F59E0B', borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 600 }}>
                進行中 {calcDays(report.order_date, null)}日目
              </span>
            </div>
          )}

          {/* マイルストーン */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
            {MILESTONES.filter(s => report[s.key]).map(s => (
              <div key={s.key}>
                <p style={{ fontSize: 9, color: '#555', marginBottom: 2 }}>{s.icon} {s.label}</p>
                <p style={{ fontSize: 12, color: '#F0F0F0', fontVariantNumeric: 'tabular-nums' }}>
                  {new Date(report[s.key]).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>

          <XPBar
            orderDate={report.order_date}
            vinDate={report.vin_date}
            docsDate={report.docs_date}
            deliveryDate={report.delivery_date}
            model={report.model}
            color={report.color}
          />

          {report.note && (
            <p style={{ fontSize: 13, color: '#A0A0A0', lineHeight: 1.7, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'pre-wrap' }}>{report.note}</p>
          )}

          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={async () => {
              const nick = commentName || localStorage.getItem('delivery_nickname') || ''
              if (!nick) { alert('いいねするにはニックネームを入力してください'); return }
              if (liked) {
                await supabase.from('delivery_likes').delete().eq('report_id', id).eq('liker_name', nick)
                setLiked(false); setLikeCount(c => c - 1)
              } else {
                await supabase.from('delivery_likes').insert({ report_id: id, liker_name: nick })
                setLiked(true); setLikeCount(c => c + 1)
              }
            }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: liked ? '#EF4444' : '#555', fontFamily: 'inherit', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, transition: '150ms' }}>
              <span style={{ fontSize: 20 }}>{liked ? '❤️' : '🤍'}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{likeCount > 0 ? likeCount : ''}</span>
              <span style={{ fontSize: 12, color: '#666' }}>いいね</span>
            </button>
            <button onClick={() => router.push(`/delivery/edit?id=${report.id}`)}
              style={{ padding: '5px 14px', fontSize: 11, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#666', cursor: 'pointer', fontFamily: 'inherit' }}>
              ✏️ 修正する
            </button>
          </div>
        </div>

        {/* コメントセクション */}
        <div style={{ ...card }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: '#888' }}>
            コメント {comments.length > 0 && <span style={{ color: '#00FFFF' }}>{comments.length}</span>}
          </p>

          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <Avatar name={c.author_name || '匿名'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#F0F0F0' }}>{c.author_name || '匿名'}</span>
                  <span style={{ fontSize: 11, color: '#555' }}>{relativeTime(c.created_at)}</span>
                </div>
                <p style={{ fontSize: 14, color: '#C0C0C0', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{c.body}</p>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <p style={{ fontSize: 13, color: '#444', textAlign: 'center', padding: '16px 0' }}>まだコメントがありません</p>
          )}

          {/* コメント入力 */}
          <form onSubmit={handleComment} style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Avatar name={commentName || '?'} />
              <div style={{ flex: 1 }}>
                <input
                  value={commentName}
                  onChange={e => setCommentName(e.target.value)}
                  placeholder="ニックネーム（任意）"
                  style={{ width: '100%', padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, color: '#888', fontFamily: 'inherit', outline: 'none', marginBottom: 10 }}
                />
                <textarea
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  placeholder="コメントを書く..."
                  required
                  rows={3}
                  style={{ width: '100%', padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 15, color: '#F0F0F0', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.7 }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button type="submit" disabled={submitting || !commentBody.trim()}
                    style={{ padding: '8px 22px', background: !commentBody.trim() || submitting ? '#2A2A2A' : '#E8E8E8', color: !commentBody.trim() || submitting ? '#555' : '#111', border: 'none', borderRadius: 24, fontSize: 13, fontWeight: 700, cursor: !commentBody.trim() || submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    {submitting ? '送信中...' : 'コメント'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
