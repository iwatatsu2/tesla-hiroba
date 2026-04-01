'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Post, CATEGORY_JP, CATEGORY_COLOR } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'NOW'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d`
  return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

function Avatar({ name }: { name: string }) {
  const ch = name?.[0]?.toUpperCase() || '?'
  const hue = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{
      width: 38, height: 38, flexShrink: 0,
      background: `hsl(${hue},60%,15%)`,
      border: `2px solid hsl(${hue},60%,50%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Press Start 2P', monospace", fontSize: 13, color: `hsl(${hue},60%,70%)`,
    }}>{ch}</div>
  )
}

export default function PostCard({ post, commentCount = 0, index = 0, onDeleted }: { post: Post; commentCount?: number; index?: number; onDeleted?: (id: string) => void }) {
  const [likes, setLikes] = useState(post.likes)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isOwn, setIsOwn] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [likePop, setLikePop] = useState(false)

  useEffect(() => {
    const likedIds: string[] = JSON.parse(localStorage.getItem('liked_posts') || '[]')
    const savedIds: string[] = JSON.parse(localStorage.getItem('saved_posts') || '[]')
    const nickname = localStorage.getItem('post_nickname') || ''
    setLiked(likedIds.includes(post.id))
    setSaved(savedIds.includes(post.id))
    setIsOwn(!!nickname && nickname === post.author_name)
  }, [post.id, post.author_name])

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (liked) return
    const next = likes + 1
    setLikes(next)
    setLiked(true)
    setLikePop(true)
    setTimeout(() => setLikePop(false), 400)
    const ids: string[] = JSON.parse(localStorage.getItem('liked_posts') || '[]')
    localStorage.setItem('liked_posts', JSON.stringify([...ids, post.id]))
    await supabase.from('posts').update({ likes: next }).eq('id', post.id)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    const text = `${post.title}\n\n#テスラ #TSLAPARK`
    const url = `https://tsla-park.vercel.app/posts/${post.id}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'width=550,height=450')
  }

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    const ids: string[] = JSON.parse(localStorage.getItem('saved_posts') || '[]')
    if (saved) {
      localStorage.setItem('saved_posts', JSON.stringify(ids.filter(i => i !== post.id)))
      setSaved(false)
    } else {
      localStorage.setItem('saved_posts', JSON.stringify([...ids, post.id]))
      setSaved(true)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('この投稿を削除しますか？')) return
    await supabase.from('posts').delete().eq('id', post.id)
    setDeleted(true)
    onDeleted?.(post.id)
  }

  if (deleted) return null

  const author = post.author_name || '匿名'

  return (
    <article className="fade-in" style={{ animationDelay: `${index * 20}ms` }}>
      <Link href={`/posts/${post.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{
          borderBottom: '1px solid #2A2A2A',
          padding: '16px 20px',
          transition: 'background 120ms',
          background: 'transparent',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,255,255,0.02)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <Avatar name={author} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#C0C0C0' }}>{author.slice(0,12)}</span>
                <span style={{ fontSize: 10, color: '#404040' }}>·</span>
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#404040' }}>{relativeTime(post.created_at)}</span>
                {post.model && (
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#39FF14', border: '1px solid #39FF14', padding: '1px 4px' }}>{post.model}</span>
                )}
              </div>

              {/* Body */}
              <p style={{ fontSize: 14, color: '#E0E0E0', lineHeight: 1.7, marginBottom: 10 }}>
                {post.title}
              </p>
              {post.body && post.body !== post.title && (
                <p style={{ fontSize: 13, color: '#808080', lineHeight: 1.7, marginBottom: 10,
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                  {post.body}
                </p>
              )}

              {/* Tags */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#00FFFF', border: '1px solid #00FFFF', padding: '2px 6px' }}>
                  {CATEGORY_JP[post.category]}
                </span>
                {post.tags?.map(t => (
                  <span key={t} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#404040', border: '1px solid #404040', padding: '2px 6px' }}>
                    #{t}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                {/* Comment */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#404040', fontSize: 12 }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8 }}>{commentCount}</span>
                </div>

                {/* Like */}
                <style>{`@keyframes pico{0%{transform:scale(1)}40%{transform:scale(1.6)}70%{transform:scale(0.9)}100%{transform:scale(1)}}`}</style>
                <button onClick={handleLike} style={{
                  display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
                  cursor: liked ? 'default' : 'pointer',
                  color: liked ? '#FF00FF' : '#404040', fontSize: 12,
                  fontFamily: 'inherit', padding: 0, transition: '120ms',
                }}>
                  <svg width="14" height="14" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                    style={{ animation: likePop ? 'pico 0.4s ease' : 'none' }}>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8 }}>{likes}</span>
                </button>

                {/* Share */}
                <button onClick={handleShare} style={{
                  display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
                  cursor: 'pointer', color: '#404040', fontSize: 12,
                  fontFamily: 'inherit', padding: 0, transition: '120ms',
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#00FFFF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#404040')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>

                {/* Save */}
                <button onClick={handleSave} style={{
                  display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
                  cursor: 'pointer', color: saved ? '#39FF14' : '#404040', fontSize: 12,
                  fontFamily: 'inherit', padding: 0, marginLeft: 'auto', transition: '120ms',
                }}>
                  <svg width="14" height="14" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>

                {/* Delete (own posts only) */}
                {isOwn && (
                  <button onClick={handleDelete} style={{
                    display: 'flex', alignItems: 'center', background: 'none', border: 'none',
                    cursor: 'pointer', color: '#404040', fontSize: 12, fontFamily: 'inherit', padding: 0, transition: '120ms',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#FF4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#404040')}
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}

