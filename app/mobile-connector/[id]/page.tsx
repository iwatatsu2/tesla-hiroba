'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, McPost, McComment } from '@/lib/supabase'
import Link from 'next/link'

const SOLUTION_TYPES = [
  { value: 'official_wait', label: '純正待ち', color: '#3B82F6' },
  { value: 'third_party', label: '社外品', color: '#10B981' },
  { value: 'used', label: '中古購入', color: '#F59E0B' },
  { value: 'construction', label: '工事・設置', color: '#8B5CF6' },
  { value: 'other', label: 'その他', color: '#6B7280' },
]

const card = { background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 22px' }

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

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const ch = name?.[0]?.toUpperCase() || '?'
  const hue = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: `hsl(${hue},25%,28%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: `hsl(${hue},40%,75%)` }}>{ch}</div>
  )
}

function getSolutionInfo(type: string) {
  return SOLUTION_TYPES.find(s => s.value === type) || SOLUTION_TYPES[4]
}

export default function McDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [post, setPost] = useState<McPost | null>(null)
  const [comments, setComments] = useState<McComment[]>([])
  const [commentBody, setCommentBody] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [likeCount, setLikeCount] = useState(0)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUser(user)
        const { data: profile } = await supabase.from('profiles').select('tsla_display_name, display_name').eq('id', user.id).single()
        setDisplayName(profile?.tsla_display_name || profile?.display_name || '')
      }
    })
    supabase.from('mc_posts').select('*').eq('id', id).single().then(({ data }) => setPost(data))
    supabase.from('mc_comments').select('*').eq('post_id', id).order('created_at').then(({ data }) => setComments(data || []))
    // いいね読み込み
    async function loadLikes() {
      const { data: likes } = await supabase.from('mc_likes').select('user_id').eq('post_id', id)
      setLikeCount(likes?.length || 0)
      const { data: { user } } = await supabase.auth.getUser()
      if (user && likes?.some(l => l.user_id === user.id)) setLiked(true)
    }
    loadLikes()
  }, [id])

  const handleLike = async () => {
    let currentUser = user
    if (!currentUser) {
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error || !data.user) { console.error('匿名サインアップ失敗:', error); return }
      currentUser = data.user
      setUser(currentUser)
    }
    if (liked) {
      const { error } = await supabase.from('mc_likes').delete().eq('post_id', id).eq('user_id', currentUser.id)
      if (error) { console.error('いいね削除失敗:', error); return }
      setLiked(false); setLikeCount(c => c - 1)
    } else {
      const name = displayName || currentUser.email || '匿名'
      const { error } = await supabase.from('mc_likes').upsert(
        { post_id: id, user_id: currentUser.id, liker_name: name },
        { onConflict: 'post_id,user_id' }
      )
      if (error) { console.error('いいね登録失敗:', error); return }
      setLiked(true); setLikeCount(c => c + 1)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { router.push('/auth'); return }
    if (!commentBody.trim()) return
    setSubmitting(true)
    const { data } = await supabase.from('mc_comments').insert({
      post_id: id, user_id: user.id, author_name: displayName || user.email || '匿名', body: commentBody.trim(),
      parent_id: replyTo?.id || null,
    }).select().single()
    if (data) setComments(prev => [...prev, data])
    setCommentBody(''); setReplyTo(null); setSubmitting(false)
  }

  if (!post) return <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px', color: '#444', textAlign: 'center', fontSize: 14 }}>読み込み中...</div>

  const sol = getSolutionInfo(post.solution_type)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 60, background: 'rgba(13,13,13,0.97)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 20, fontFamily: 'inherit', padding: '4px 8px' }}>←</button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>モバイルコネクター</span>
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 12px', fontSize: 12, borderRadius: 16, background: `${sol.color}20`, color: sol.color, fontWeight: 600 }}>{sol.label}</span>
            {post.model && <span style={{ fontSize: 12, color: '#888', background: '#242424', padding: '2px 8px', borderRadius: 4 }}>{post.model}</span>}
            {post.region && <span style={{ fontSize: 12, color: '#888' }}>📍{post.region}</span>}
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 12 }}>{post.title}</h1>

          {post.body && <p style={{ fontSize: 14, color: '#A0A0A0', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{post.body}</p>}

          {post.image_urls && post.image_urls.length > 0 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginTop: 12 }}>
              {post.image_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt="" style={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                </a>
              ))}
            </div>
          )}

          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={handleLike}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: liked ? '#EF4444' : '#555', fontFamily: 'inherit', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, transition: '150ms' }}>
              <span style={{ fontSize: 20 }}>{liked ? '❤️' : '🤍'}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{likeCount > 0 ? likeCount : ''}</span>
              <span style={{ fontSize: 12, color: '#666' }}>いいね</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: '#555' }}>
                {post.author_name || '匿名'} · {new Date(post.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
              {user && post.user_id === user.id && (
                <button onClick={() => router.push(`/mobile-connector/edit?id=${post.id}`)}
                  style={{ padding: '5px 14px', fontSize: 11, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, color: '#666', cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✏️ 修正する
                </button>
              )}
            </div>
          </div>
        </div>

        {/* コメント */}
        <div style={{ ...card }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: '#888' }}>
            コメント {comments.length > 0 && <span style={{ color: '#F59E0B' }}>{comments.length}</span>}
          </p>

          {comments.filter(c => !c.parent_id).map(c => {
            const replies = comments.filter(r => r.parent_id === c.id)
            return (
              <div key={c.id}>
                <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: replies.length > 0 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                  <Avatar name={c.author_name || '匿名'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#F0F0F0' }}>{c.author_name || '匿名'}</span>
                      <span style={{ fontSize: 11, color: '#555' }}>{relativeTime(c.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 14, color: '#C0C0C0', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{c.body}</p>
                    {user && (
                      <button onClick={() => setReplyTo({ id: c.id, name: c.author_name || '匿名' })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#555', fontFamily: 'inherit', padding: '4px 0', marginTop: 2 }}>
                        返信する
                      </button>
                    )}
                  </div>
                </div>
                {replies.map(r => (
                  <div key={r.id} style={{ display: 'flex', gap: 8, padding: '8px 0 8px 42px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <Avatar name={r.author_name || '匿名'} size={24} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F0' }}>{r.author_name || '匿名'}</span>
                        <span style={{ fontSize: 10, color: '#555' }}>{relativeTime(r.created_at)}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#C0C0C0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{r.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}

          {comments.length === 0 && <p style={{ fontSize: 13, color: '#444', textAlign: 'center', padding: '12px 0' }}>まだコメントがありません</p>}

          {user ? (
            <form onSubmit={handleComment} style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
              {replyTo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '6px 10px', background: '#1A1A1A', borderRadius: 6, fontSize: 12, color: '#888' }}>
                  <span>↩️ {replyTo.name} に返信</span>
                  <button type="button" onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: 14, fontFamily: 'inherit', marginLeft: 'auto' }}>✕</button>
                </div>
              )}
              <textarea value={commentBody} onChange={e => setCommentBody(e.target.value)} placeholder={replyTo ? `${replyTo.name} に返信...` : 'コメントを書く...'} required rows={3}
                style={{ width: '100%', padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 15, color: '#F0F0F0', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.7 }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="submit" disabled={submitting || !commentBody.trim()}
                  style={{ padding: '8px 22px', background: !commentBody.trim() || submitting ? '#2A2A2A' : '#F59E0B', color: '#000', border: 'none', borderRadius: 24, fontSize: 13, fontWeight: 700, cursor: !commentBody.trim() || submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {submitting ? '送信中...' : 'コメント'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8, textAlign: 'center' }}>
              <Link href="/auth" style={{ display: 'inline-block', padding: '10px 24px', background: '#F59E0B', color: '#000', borderRadius: 24, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                ログインしてコメント
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
