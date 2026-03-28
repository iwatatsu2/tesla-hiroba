'use client'
import Link from 'next/link'
import { Post, CATEGORY_LABEL } from '@/lib/supabase'

const CAT_COLOR: Record<string, string> = {
  charging: '#3B82F6', delivery: '#10B981', issue: '#EF4444',
}

export default function PostCard({ post, index }: { post: Post; index: number }) {
  const excerpt = post.body.slice(0, 120) + (post.body.length > 120 ? '…' : '')
  const date = new Date(post.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })

  return (
    <Link href={`/posts/${post.id}`} style={{ textDecoration: 'none' }}
      className="fade-in"
    >
      <div style={{
        background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12,
        padding: '18px 20px', marginBottom: 10, transition: '150ms ease', cursor: 'pointer',
        animationDelay: `${index * 30}ms`,
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
            color: CAT_COLOR[post.category], background: CAT_COLOR[post.category] + '20',
            padding: '3px 10px', borderRadius: 20,
          }}>
            {CATEGORY_LABEL[post.category]}
          </span>
          {post.model && <span style={{ fontSize: 11, color: '#555' }}>{post.model}</span>}
          <span style={{ fontSize: 11, color: '#444', marginLeft: 'auto' }}>{date}</span>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F0F0F0', marginBottom: 6, lineHeight: 1.5 }}>
          {post.title}
        </h3>
        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, marginBottom: 10 }}>{excerpt}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: '#555' }}>{post.author_name || '匿名'}</span>
          {post.tags?.map(t => (
            <span key={t} style={{ fontSize: 10, color: '#555', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 10 }}>
              #{t}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#555' }}>♡ {post.likes}</span>
        </div>
      </div>
    </Link>
  )
}
