'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, DeliveryComment, DeliveryMilestone, DeliveryReview } from '@/lib/supabase'
import XPBar from '@/components/XPBar'
import Link from 'next/link'

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

// バッジ定義
const OWNER_BADGES = [
  { days: 30, label: '1ヶ月', icon: '🌱', color: '#10B981' },
  { days: 100, label: '100日', icon: '💯', color: '#F59E0B' },
  { days: 365, label: '1年', icon: '🏆', color: '#8B5CF6' },
  { days: 730, label: '2年', icon: '👑', color: '#EF4444' },
]

// マイルストーンプリセット
const MILESTONE_PRESETS = [
  { emoji: '🚗', title: '納車!' },
  { emoji: '🧼', title: '初洗車' },
  { emoji: '🛣️', title: '初ロングドライブ' },
  { emoji: '🔌', title: '初スーパーチャージャー' },
  { emoji: '🛞', title: 'タイヤ交換' },
  { emoji: '🎨', title: 'カスタム・アクセサリー' },
  { emoji: '📱', title: 'OTAアップデート' },
  { emoji: '🏔️', title: '1,000km達成' },
  { emoji: '🌍', title: '5,000km達成' },
  { emoji: '🚀', title: '10,000km達成' },
  { emoji: '⚡', title: '50,000km達成' },
]

export default function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [report, setReport] = useState<any>(null)
  const [comments, setComments] = useState<DeliveryComment[]>([])
  const [commentBody, setCommentBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')

  // 新機能: マイルストーン
  const [milestones, setMilestones] = useState<DeliveryMilestone[]>([])
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [msEmoji, setMsEmoji] = useState('🎉')
  const [msTitle, setMsTitle] = useState('')
  const [msNote, setMsNote] = useState('')
  const [msDate, setMsDate] = useState(new Date().toISOString().slice(0, 10))
  const [msSubmitting, setMsSubmitting] = useState(false)

  // 新機能: レビュー
  const [review, setReview] = useState<DeliveryReview | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewBody, setReviewBody] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUser(user)
        const { data: profile } = await supabase.from('profiles').select('tsla_display_name, display_name').eq('id', user.id).single()
        setDisplayName(profile?.tsla_display_name || profile?.display_name || '')
      }
    })

    async function load() {
      const { data: r } = await supabase.from('delivery_reports').select('*').eq('id', id).single()
      setReport(r)
      const { data: c } = await supabase.from('delivery_comments').select('*').eq('report_id', id).order('created_at')
      setComments(c || [])
      const { data: likes } = await supabase.from('delivery_likes').select('user_id').eq('report_id', id)
      setLikeCount(likes?.length || 0)
      const { data: { user } } = await supabase.auth.getUser()
      if (user && likes?.some(l => l.user_id === user.id)) setLiked(true)

      // マイルストーン読み込み
      const { data: ms } = await supabase.from('delivery_milestones').select('*').eq('report_id', id).order('milestone_date')
      setMilestones(ms || [])

      // レビュー読み込み
      const { data: rv } = await supabase.from('delivery_reviews').select('*').eq('report_id', id).single()
      if (rv) setReview(rv)
    }
    load()
  }, [id])

  const handleLike = async () => {
    if (!user) { router.push('/auth'); return }
    if (liked) {
      await supabase.from('delivery_likes').delete().eq('report_id', id).eq('user_id', user.id)
      setLiked(false); setLikeCount(c => c - 1)
    } else {
      const name = displayName || user.email || ''
      await supabase.from('delivery_likes').insert({ report_id: id, user_id: user.id, liker_name: name })
      setLiked(true); setLikeCount(c => c + 1)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { router.push('/auth'); return }
    if (!commentBody.trim()) return
    setSubmitting(true)
    const name = displayName || user.email || '匿名'
    const { data } = await supabase.from('delivery_comments').insert({
      report_id: id, body: commentBody.trim(), author_name: name, user_id: user.id,
    }).select().single()
    if (data) setComments(prev => [...prev, data])
    setCommentBody('')
    setSubmitting(false)
  }

  const handleAddMilestone = async () => {
    if (!user || !msTitle.trim()) return
    setMsSubmitting(true)
    const { data } = await supabase.from('delivery_milestones').insert({
      report_id: id, user_id: user.id, emoji: msEmoji, title: msTitle.trim(),
      note: msNote.trim() || null, milestone_date: msDate,
    }).select().single()
    if (data) setMilestones(prev => [...prev, data].sort((a, b) => a.milestone_date.localeCompare(b.milestone_date)))
    setMsTitle(''); setMsNote(''); setMsEmoji('🎉'); setShowMilestoneForm(false)
    setMsSubmitting(false)
  }

  const handleDeleteMilestone = async (msId: string) => {
    await supabase.from('delivery_milestones').delete().eq('id', msId)
    setMilestones(prev => prev.filter(m => m.id !== msId))
  }

  const handleSubmitReview = async () => {
    if (!user) return
    setReviewSubmitting(true)
    if (review) {
      const { data } = await supabase.from('delivery_reviews').update({ rating: reviewRating, body: reviewBody.trim() || null }).eq('id', review.id).select().single()
      if (data) setReview(data)
    } else {
      const { data } = await supabase.from('delivery_reviews').insert({
        report_id: id, user_id: user.id, rating: reviewRating, body: reviewBody.trim() || null,
      }).select().single()
      if (data) setReview(data)
    }
    setShowReviewForm(false)
    setReviewSubmitting(false)
  }

  if (!report) return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px', color: '#444', textAlign: 'center', fontSize: 14 }}>
      読み込み中...
    </div>
  )

  const color = MODEL_COLOR[report.model] || '#888'
  const waitDays = calcDays(report.order_date, report.delivery_date)
  const isComplete = !!report.delivery_date
  const isMyPost = user && report.user_id === user.id
  const ownerDays = isComplete ? calcDays(report.delivery_date, null) : null
  const earnedBadges = OWNER_BADGES.filter(b => ownerDays !== null && ownerDays >= b.days)
  const nextBadge = OWNER_BADGES.find(b => ownerDays !== null && ownerDays < b.days)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* ナビ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 60, background: 'rgba(13,13,13,0.97)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 20, fontFamily: 'inherit', padding: '4px 8px' }}>←</button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>納車レポート</span>
      </div>

      <div style={{ padding: '20px' }}>
        {/* レポート詳細 */}
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{ background: color + '25', color, borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>{report.model}</span>
            {report.grade && <span style={{ fontSize: 12, color: '#888' }}>{report.grade}</span>}
            {report.color && <span style={{ fontSize: 12, color: '#666' }}>· {report.color}</span>}
            {report.region && <span style={{ fontSize: 12, color: '#666' }}>· {report.region}</span>}
            {report.author_name && report.author_name !== '匿名' && (
              <span style={{ fontSize: 11, color: '#555' }}>by {report.author_name}</span>
            )}
          </div>

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
            <button onClick={handleLike}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: liked ? '#EF4444' : '#555', fontFamily: 'inherit', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, transition: '150ms' }}>
              <span style={{ fontSize: 20 }}>{liked ? '❤️' : '🤍'}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{likeCount > 0 ? likeCount : ''}</span>
              <span style={{ fontSize: 12, color: '#666' }}>いいね</span>
            </button>
            {isMyPost && (
              <button onClick={() => router.push(`/delivery/edit?id=${report.id}`)}
                style={{ padding: '5px 14px', fontSize: 11, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#666', cursor: 'pointer', fontFamily: 'inherit' }}>
                ✏️ 修正する
              </button>
            )}
          </div>
        </div>

        {/* ===== 納車後セクション ===== */}
        {isComplete && (
          <>
            {/* オーナーバッジ */}
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#888' }}>オーナーバッジ</p>
                {ownerDays !== null && (
                  <span style={{ fontSize: 11, color: '#555' }}>納車から{ownerDays}日目</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {OWNER_BADGES.map(b => {
                  const earned = ownerDays !== null && ownerDays >= b.days
                  return (
                    <div key={b.days} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      opacity: earned ? 1 : 0.25, transition: '300ms',
                      minWidth: 64,
                    }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: earned ? `${b.color}20` : '#1A1A1A',
                        border: `2px solid ${earned ? b.color : '#333'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22,
                        boxShadow: earned ? `0 0 12px ${b.color}40` : 'none',
                      }}>
                        {b.icon}
                      </div>
                      <span style={{ fontSize: 10, color: earned ? b.color : '#444', fontWeight: 600 }}>{b.label}</span>
                    </div>
                  )
                })}
              </div>

              {nextBadge && ownerDays !== null && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#666' }}>次のバッジ: {nextBadge.icon} {nextBadge.label}</span>
                    <span style={{ fontSize: 11, color: '#555' }}>あと{nextBadge.days - ownerDays}日</span>
                  </div>
                  <div style={{ height: 4, background: '#2A2A2A', borderRadius: 2 }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      background: nextBadge.color,
                      width: `${Math.min(100, (ownerDays / nextBadge.days) * 100)}%`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* 満足度レビュー */}
            <div style={{ ...card, marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 12 }}>オーナーレビュー</p>

              {review && !showReviewForm ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 24, letterSpacing: 2 }}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B' }}>{review.rating}.0</span>
                  </div>
                  {review.body && (
                    <p style={{ fontSize: 13, color: '#A0A0A0', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{review.body}</p>
                  )}
                  {isMyPost && (
                    <button onClick={() => { setReviewRating(review.rating); setReviewBody(review.body || ''); setShowReviewForm(true) }}
                      style={{ marginTop: 8, fontSize: 11, color: '#555', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
                      レビューを編集
                    </button>
                  )}
                </div>
              ) : isMyPost ? (
                showReviewForm || !review ? (
                  <div>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setReviewRating(n)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 32, padding: 2, color: n <= reviewRating ? '#F59E0B' : '#333' }}>
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewBody}
                      onChange={e => setReviewBody(e.target.value)}
                      placeholder="納車してみてどうですか？（任意）"
                      rows={3}
                      style={{ width: '100%', padding: 10, background: '#242424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 14, color: '#F0F0F0', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.7 }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                      {showReviewForm && (
                        <button onClick={() => setShowReviewForm(false)}
                          style={{ padding: '8px 16px', fontSize: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, color: '#666', cursor: 'pointer', fontFamily: 'inherit' }}>
                          キャンセル
                        </button>
                      )}
                      <button onClick={handleSubmitReview} disabled={reviewSubmitting}
                        style={{ padding: '8px 20px', fontSize: 12, background: '#F59E0B', color: '#000', border: 'none', borderRadius: 20, fontWeight: 700, cursor: reviewSubmitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                        {reviewSubmitting ? '送信中...' : review ? '更新する' : 'レビューを投稿'}
                      </button>
                    </div>
                  </div>
                ) : null
              ) : (
                <p style={{ fontSize: 13, color: '#444', textAlign: 'center', padding: '8px 0' }}>オーナーのレビューはまだありません</p>
              )}
            </div>

            {/* オーナー記録タイムライン */}
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#888' }}>
                  オーナー記録 {milestones.length > 0 && <span style={{ color: '#00FFFF' }}>{milestones.length}</span>}
                </p>
                {isMyPost && !showMilestoneForm && (
                  <button onClick={() => setShowMilestoneForm(true)}
                    style={{ padding: '5px 14px', fontSize: 11, background: '#00FFFF15', border: '1px solid #00FFFF40', borderRadius: 20, color: '#00FFFF', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                    ＋ 記録を追加
                  </button>
                )}
              </div>

              {/* タイムライン */}
              {milestones.length > 0 ? (
                <div style={{ position: 'relative', paddingLeft: 24 }}>
                  {/* 縦線 */}
                  <div style={{ position: 'absolute', left: 8, top: 4, bottom: 4, width: 2, background: 'rgba(0,255,255,0.15)' }} />
                  {milestones.map((m) => (
                    <div key={m.id} style={{ position: 'relative', paddingBottom: 16 }}>
                      {/* ドット */}
                      <div style={{ position: 'absolute', left: -20, top: 4, width: 14, height: 14, borderRadius: '50%', background: '#1A1A1A', border: '2px solid #00FFFF60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>
                        {m.emoji}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#E0E0E0' }}>
                            {m.emoji} {m.title}
                          </p>
                          <p style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
                            {new Date(m.milestone_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                            {report.delivery_date && ` (納車${calcDays(report.delivery_date, m.milestone_date)}日目)`}
                          </p>
                          {m.note && (
                            <p style={{ fontSize: 12, color: '#888', lineHeight: 1.6, marginTop: 4 }}>{m.note}</p>
                          )}
                        </div>
                        {user && m.user_id === user.id && (
                          <button onClick={() => handleDeleteMilestone(m.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', fontSize: 14, padding: '2px 6px', fontFamily: 'inherit' }}>
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#444', textAlign: 'center', padding: '8px 0' }}>
                  {isMyPost ? '納車後の思い出を記録しよう' : 'まだ記録がありません'}
                </p>
              )}

              {/* マイルストーン追加フォーム */}
              {showMilestoneForm && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {/* プリセット */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {MILESTONE_PRESETS.map(p => (
                      <button key={p.title} onClick={() => { setMsEmoji(p.emoji); setMsTitle(p.title) }}
                        style={{
                          padding: '4px 10px', fontSize: 11, borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
                          background: msTitle === p.title ? '#00FFFF20' : '#242424',
                          border: msTitle === p.title ? '1px solid #00FFFF40' : '1px solid rgba(255,255,255,0.08)',
                          color: msTitle === p.title ? '#00FFFF' : '#888',
                        }}>
                        {p.emoji} {p.title}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input value={msTitle} onChange={e => setMsTitle(e.target.value)} placeholder="タイトル"
                      style={{ flex: 1, padding: '8px 10px', background: '#242424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13, color: '#F0F0F0', fontFamily: 'inherit', outline: 'none' }} />
                    <input type="date" value={msDate} onChange={e => setMsDate(e.target.value)}
                      style={{ padding: '8px 10px', background: '#242424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13, color: '#F0F0F0', fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                  <textarea value={msNote} onChange={e => setMsNote(e.target.value)} placeholder="メモ（任意）" rows={2}
                    style={{ width: '100%', padding: '8px 10px', background: '#242424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13, color: '#F0F0F0', fontFamily: 'inherit', outline: 'none', resize: 'none' }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowMilestoneForm(false)}
                      style={{ padding: '8px 16px', fontSize: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, color: '#666', cursor: 'pointer', fontFamily: 'inherit' }}>
                      キャンセル
                    </button>
                    <button onClick={handleAddMilestone} disabled={!msTitle.trim() || msSubmitting}
                      style={{ padding: '8px 20px', fontSize: 12, background: !msTitle.trim() || msSubmitting ? '#2A2A2A' : '#00FFFF', color: !msTitle.trim() || msSubmitting ? '#555' : '#000', border: 'none', borderRadius: 20, fontWeight: 700, cursor: !msTitle.trim() || msSubmitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                      {msSubmitting ? '追加中...' : '追加する'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

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

          {user ? (
            <form onSubmit={handleComment} style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Avatar name={displayName || user.email || '?'} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{displayName || user.email} として投稿</p>
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
          ) : (
            <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8, textAlign: 'center' }}>
              <Link href="/auth" style={{
                display: 'inline-block', padding: '10px 24px',
                background: '#00FFFF', color: '#000', borderRadius: 24,
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}>
                ログインしてコメント
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
