'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, AliexpressPost, AliexpressComment } from '@/lib/supabase'
import Link from 'next/link'

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

export default function AliexpressDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [post, setPost] = useState<AliexpressPost | null>(null)
  const [comments, setComments] = useState<AliexpressComment[]>([])
  const [commentBody, setCommentBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUser(user)
        const { data: profile } = await supabase.from('profiles').select('tsla_display_name, display_name').eq('id', user.id).single()
        setDisplayName(profile?.tsla_display_name || profile?.display_name || '')
      }
    })
    supabase.from('aliexpress_posts').select('*').eq('id', id).single().then(({ data }) => setPost(data))
    supabase.from('aliexpress_comments').select('*').eq('post_id', id).order('created_at').then(({ data }) => setComments(data || []))
  }, [id])

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { router.push('/auth'); return }
    if (!commentBody.trim()) return
    setSubmitting(true)
    const { data } = await supabase.from('aliexpress_comments').insert({
      post_id: id, user_id: user.id, author_name: displayName || user.email || '匿名', body: commentBody.trim(),
    }).select().single()
    if (data) setComments(prev => [...prev, data])
    setCommentBody(''); setSubmitting(false)
  }

  if (!post) return <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px', color: '#444', textAlign: 'center', fontSize: 14 }}>読み込み中...</div>

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 60, background: 'rgba(13,13,13,0.97)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 20, fontFamily: 'inherit', padding: '4px 8px' }}>←</button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>アリエク購入品</span>
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{ ...card, marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 8 }}>{post.title}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 18, color: '#F59E0B' }}>{'★'.repeat(post.rating)}{'☆'.repeat(5 - post.rating)}</span>
            {post.price && <span style={{ fontSize: 16, fontWeight: 700, color: '#EC4899' }}>{post.price}</span>}
            {post.model && <span style={{ fontSize: 12, color: '#888', background: '#242424', padding: '2px 8px', borderRadius: 4 }}>{post.model}</span>}
          </div>

          {post.url && (
            <a href={post.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', marginBottom: 12, padding: '6px 14px', background: '#EC489915', border: '1px solid #EC489930', borderRadius: 8, fontSize: 12, color: '#EC4899', textDecoration: 'none', fontFamily: 'inherit' }}>
              🔗 AliExpressで見る →
            </a>
          )}

          {post.body && <p style={{ fontSize: 14, color: '#A0A0A0', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 12 }}>{post.body}</p>}

          {post.image_urls && post.image_urls.length > 0 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
              {post.image_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt="" style={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                </a>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {post.tags?.map(t => (
              <span key={t} style={{ padding: '2px 8px', fontSize: 10, borderRadius: 10, background: '#EC489915', color: '#EC4899', border: '1px solid #EC489930' }}>{t}</span>
            ))}
          </div>

          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 11, color: '#555' }}>
            {post.author_name || '匿名'} · {new Date(post.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* コメント */}
        <div style={{ ...card }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: '#888' }}>
            コメント {comments.length > 0 && <span style={{ color: '#EC4899' }}>{comments.length}</span>}
          </p>

          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <Avatar name={c.author_name || '匿名'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#F0F0F0' }}>{c.author_name || '匿名'}</span>
                  <span style={{ fontSize: 11, color: '#555' }}>{relativeTime(c.created_at)}</span>
                </div>
                <p style={{ fontSize: 14, color: '#C0C0C0', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{c.body}</p>
              </div>
            </div>
          ))}

          {comments.length === 0 && <p style={{ fontSize: 13, color: '#444', textAlign: 'center', padding: '12px 0' }}>まだコメントがありません</p>}

          {user ? (
            <form onSubmit={handleComment} style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
              <textarea value={commentBody} onChange={e => setCommentBody(e.target.value)} placeholder="コメントを書く..." required rows={3}
                style={{ width: '100%', padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 15, color: '#F0F0F0', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.7 }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="submit" disabled={submitting || !commentBody.trim()}
                  style={{ padding: '8px 22px', background: !commentBody.trim() || submitting ? '#2A2A2A' : '#EC4899', color: '#fff', border: 'none', borderRadius: 24, fontSize: 13, fontWeight: 700, cursor: !commentBody.trim() || submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {submitting ? '送信中...' : 'コメント'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8, textAlign: 'center' }}>
              <Link href="/auth" style={{ display: 'inline-block', padding: '10px 24px', background: '#EC4899', color: '#fff', borderRadius: 24, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                ログインしてコメント
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
