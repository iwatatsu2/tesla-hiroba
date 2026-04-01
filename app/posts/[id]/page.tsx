'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Post, Comment, CATEGORY_JP, CATEGORY_COLOR } from '@/lib/supabase'

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

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
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

export default function PostPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentBody, setCommentBody] = useState('')
  const [commentName, setCommentName] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('post_nickname') || '' : ''
  )
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from('posts').select('*').eq('id', id).single()
      setPost(p)
      const { data: c } = await supabase.from('comments').select('*').eq('post_id', id).order('created_at')
      setComments(c || [])
    }
    load()
    const likedIds: string[] = JSON.parse(localStorage.getItem('liked_posts') || '[]')
    const savedIds: string[] = JSON.parse(localStorage.getItem('saved_posts') || '[]')
    setLiked(likedIds.includes(id))
    setSaved(savedIds.includes(id))
  }, [id])

  const handleLike = async () => {
    if (!post || liked) return
    const next = post.likes + 1
    await supabase.from('posts').update({ likes: next }).eq('id', id)
    setPost({ ...post, likes: next })
    setLiked(true)
    const ids: string[] = JSON.parse(localStorage.getItem('liked_posts') || '[]')
    localStorage.setItem('liked_posts', JSON.stringify([...ids, id]))
  }

  const handleShare = () => {
    if (!post) return
    const text = `${post.title}\n\n#テスラ #TSLAPARK`
    const url = `https://tsla-park.vercel.app/posts/${id}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'width=550,height=450')
  }

  const handleSave = () => {
    const ids: string[] = JSON.parse(localStorage.getItem('saved_posts') || '[]')
    if (saved) {
      localStorage.setItem('saved_posts', JSON.stringify(ids.filter(i => i !== id)))
      setSaved(false)
    } else {
      localStorage.setItem('saved_posts', JSON.stringify([...ids, id]))
      setSaved(true)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentBody.trim()) return
    setSubmitting(true)
    const name = commentName.trim() || '匿名'
    if (commentName.trim()) localStorage.setItem('post_nickname', commentName.trim())
    const { data } = await supabase.from('comments').insert({
      post_id: id, body: commentBody.trim(), author_id: null, author_name: name,
    }).select().single()
    if (data) setComments(prev => [...prev, data])
    setCommentBody('')
    setSubmitting(false)
  }

  if (!post) return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px', color: '#444', textAlign: 'center', fontSize: 14 }}>
      読み込み中...
    </div>
  )

  const catColor = CATEGORY_COLOR[post.category] || '#888'
  const author = post.author_name || '匿名'

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* ナビ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 60, background: 'rgba(13,13,13,0.97)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 20, fontFamily: 'inherit', padding: '4px 8px' }}>←</button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>投稿</span>
      </div>

      {/* 投稿本体 */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Avatar name={author} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#F0F0F0', marginBottom: 2 }}>{author}</p>
            {post.model && <p style={{ fontSize: 12, color: '#555' }}>{post.model}</p>}
          </div>
        </div>

        <p style={{ fontSize: 18, color: '#F0F0F0', lineHeight: 1.7, marginBottom: 12, fontWeight: 400 }}>{post.title}</p>
        {post.body && post.body !== post.title && (
          <p style={{ fontSize: 15, color: '#A0A0A0', lineHeight: 1.8, marginBottom: 12, whiteSpace: 'pre-wrap' }}>{post.body}</p>
        )}

        {/* タグ */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: catColor, background: catColor + '18', padding: '3px 12px', borderRadius: 20, fontWeight: 600 }}>
            {CATEGORY_JP[post.category]}
          </span>
          {post.tags?.map(t => (
            <span key={t} style={{ fontSize: 12, color: '#555', background: 'rgba(255,255,255,0.05)', padding: '3px 12px', borderRadius: 20 }}>#{t}</span>
          ))}
        </div>

        {/* 日時 */}
        <p style={{ fontSize: 13, color: '#444', paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {new Date(post.created_at).toLocaleString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>

        {/* いいね数 */}
        {post.likes > 0 && (
          <div style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 14, color: '#888' }}>
            <span style={{ fontWeight: 700, color: '#F0F0F0' }}>{post.likes}</span> いいね
          </div>
        )}

        {/* アクションバー */}
        <div style={{ display: 'flex', gap: 32, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLike} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
            cursor: liked ? 'default' : 'pointer', color: liked ? '#E0E0E0' : '#555',
            fontSize: 14, fontFamily: 'inherit', padding: 0, transition: '120ms',
          }}>
            <svg width="20" height="20" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {liked ? 'いいね済み' : 'いいね'}
          </button>
          <button onClick={handleShare} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
            cursor: 'pointer', color: '#555', fontSize: 14, fontFamily: 'inherit', padding: 0, transition: '120ms',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Xでシェア
          </button>
          <button onClick={handleSave} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
            cursor: 'pointer', color: saved ? '#E0E0E0' : '#555',
            fontSize: 14, fontFamily: 'inherit', padding: 0, transition: '120ms',
          }}>
            <svg width="20" height="20" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {saved ? '保存済み' : '保存'}
          </button>
        </div>
      </div>

      {/* コメント */}
      <div>
        {comments.map(c => (
          <div key={c.id} style={{ display: 'flex', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <Avatar name={c.author_name || '匿名'} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0' }}>{c.author_name || '匿名'}</span>
                <span style={{ fontSize: 12, color: '#555' }}>{relativeTime(c.created_at)}</span>
              </div>
              <p style={{ fontSize: 14, color: '#C0C0C0', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{c.body}</p>
            </div>
          </div>
        ))}

        {/* コメント入力 */}
        <form onSubmit={handleComment} style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Avatar name={commentName || '?'} size={36} />
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
                placeholder="返信する..."
                required
                rows={3}
                style={{ width: '100%', padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 15, color: '#F0F0F0', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.7 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="submit" disabled={submitting || !commentBody.trim()}
                  style={{ padding: '8px 22px', background: !commentBody.trim() || submitting ? '#2A2A2A' : '#E8E8E8', color: !commentBody.trim() || submitting ? '#555' : '#111', border: 'none', borderRadius: 24, fontSize: 13, fontWeight: 700, cursor: !commentBody.trim() || submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {submitting ? '送信中...' : '返信'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
