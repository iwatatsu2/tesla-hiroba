'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Post, Comment, CATEGORY_LABEL } from '@/lib/supabase'

const CATEGORY_COLOR: Record<string, string> = {
  charging: '#2563eb', delivery: '#16a34a', issue: '#dc2626',
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentBody, setCommentBody] = useState('')
  const [commentName, setCommentName] = useState('')
  const [liked, setLiked] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from('posts').select('*').eq('id', id).single()
      setPost(p)
      const { data: c } = await supabase.from('comments').select('*').eq('post_id', id).order('created_at')
      setComments(c || [])
    }
    load()
  }, [id])

  const handleLike = async () => {
    if (!post || liked) return
    await supabase.from('posts').update({ likes: post.likes + 1 }).eq('id', id)
    setPost({ ...post, likes: post.likes + 1 })
    setLiked(true)
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentBody.trim()) return
    setSubmitting(true)
    const { data } = await supabase.from('comments').insert({
      post_id: id,
      body: commentBody.trim(),
      author_id: null,
      author_name: commentName.trim() || '匿名',
    }).select().single()
    if (data) setComments(prev => [...prev, data])
    setCommentBody('')
    setSubmitting(false)
  }

  if (!post) return (
    <div style={{ maxWidth: 720, margin: '80px auto', padding: '0 24px', color: '#ccc', textAlign: 'center' }}>
      Loading...
    </div>
  )

  const date = new Date(post.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
      <button
        onClick={() => router.back()}
        style={{ fontSize: 12, color: '#999', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 32, fontFamily: 'inherit' }}
      >
        ← 戻る
      </button>

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.18em', color: CATEGORY_COLOR[post.category] }}>
          {CATEGORY_LABEL[post.category]}
        </span>
        {post.model && <span style={{ fontSize: 12, color: '#999' }}>{post.model}</span>}
      </div>

      <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 300, letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.4 }}>
        {post.title}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40, paddingBottom: 24, borderBottom: '1px solid #f0f0f0' }}>
        <span style={{ fontSize: 12, color: '#888' }}>{post.author_name || '匿名'}</span>
        <span style={{ fontSize: 12, color: '#bbb' }}>{date}</span>
        {post.tags?.map(tag => (
          <span key={tag} style={{ fontSize: 10, background: '#f4f4f4', padding: '2px 8px', borderRadius: 2, color: '#888' }}>
            #{tag}
          </span>
        ))}
      </div>

      <div style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.9, color: '#333', marginBottom: 48, whiteSpace: 'pre-wrap' }}>
        {post.body}
      </div>

      {/* Like */}
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <button
          onClick={handleLike}
          style={{
            padding: '12px 32px', border: `1px solid ${liked ? '#111' : '#e0e0e0'}`,
            borderRadius: 4, background: liked ? '#111' : 'transparent',
            color: liked ? '#fff' : '#666', fontSize: 13, cursor: liked ? 'default' : 'pointer',
            fontFamily: 'inherit', transition: 'all 0.2s',
          }}
        >
          ♡ {post.likes} いいね
        </button>
      </div>

      {/* Comments */}
      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 40 }}>
        <h2 style={{ fontSize: 13, letterSpacing: '0.1em', fontWeight: 400, marginBottom: 24, color: '#111' }}>
          COMMENTS ({comments.length})
        </h2>

        {comments.length === 0 && (
          <p style={{ fontSize: 13, color: '#bbb', marginBottom: 32 }}>まだコメントがありません</p>
        )}

        <div style={{ marginBottom: 40 }}>
          {comments.map(c => (
            <div key={c.id} style={{ padding: '20px 0', borderBottom: '1px solid #f8f8f8' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 400, color: '#444' }}>{c.author_name || '匿名'}</span>
                <span style={{ fontSize: 11, color: '#bbb' }}>
                  {new Date(c.created_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 300, color: '#555', lineHeight: 1.8 }}>{c.body}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleComment} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={commentName}
            onChange={e => setCommentName(e.target.value)}
            placeholder="ニックネーム（任意・匿名可）"
            style={{
              padding: '10px 14px', border: '1px solid #e8e8e8', borderRadius: 4,
              fontSize: 13, fontWeight: 300, fontFamily: 'inherit', outline: 'none',
            }}
          />
          <textarea
            value={commentBody}
            onChange={e => setCommentBody(e.target.value)}
            placeholder="コメントを入力..."
            required
            rows={4}
            style={{
              width: '100%', padding: '14px', border: '1px solid #e8e8e8',
              borderRadius: 4, fontSize: 14, fontWeight: 300, fontFamily: 'inherit',
              outline: 'none', resize: 'vertical', lineHeight: 1.7,
            }}
          />
          <button
            type="submit"
            disabled={submitting || !commentBody.trim()}
            style={{
              padding: '10px 24px', background: '#111', color: '#fff',
              border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.08em', opacity: submitting ? 0.5 : 1,
              alignSelf: 'flex-start',
            }}
          >
            {submitting ? '送信中...' : 'コメントする'}
          </button>
        </form>
      </div>
    </div>
  )
}
