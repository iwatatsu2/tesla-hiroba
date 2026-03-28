import Link from 'next/link'
import { Post, CATEGORY_LABEL } from '@/lib/supabase'

const CATEGORY_COLOR: Record<string, string> = {
  charging: '#2563eb',
  delivery: '#16a34a',
  issue: '#dc2626',
}

export default function PostCard({ post, index }: { post: Post; index: number }) {
  const date = new Date(post.created_at).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <Link href={`/posts/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article
        className="fade-in"
        style={{
          padding: '28px 24px',
          borderBottom: '1px solid #f0f0f0',
          cursor: 'pointer',
          transition: 'background 0.15s',
          animationDelay: `${index * 0.05}s`,
          animationFillMode: 'both',
          opacity: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f7f7f7')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{
            fontSize: 9, fontWeight: 500, letterSpacing: '0.18em',
            color: CATEGORY_COLOR[post.category], textTransform: 'uppercase',
          }}>
            {CATEGORY_LABEL[post.category]}
          </span>
          {post.model && (
            <span style={{ fontSize: 11, color: '#999', letterSpacing: '0.05em' }}>
              {post.model}
            </span>
          )}
        </div>

        <h2 style={{
          fontSize: 16, fontWeight: 400, letterSpacing: '-0.01em',
          marginBottom: 8, lineHeight: 1.5,
        }}>
          {post.title}
        </h2>

        <p style={{
          fontSize: 13, color: '#666', fontWeight: 300,
          lineHeight: 1.7, marginBottom: 14,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {post.body}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 11, color: '#999' }}>
            {post.author_name || '匿名'}
          </span>
          <span style={{ fontSize: 11, color: '#bbb' }}>{date}</span>
          <span style={{ fontSize: 11, color: '#999', marginLeft: 'auto' }}>
            ♡ {post.likes}
          </span>
          {post.tags?.map(tag => (
            <span key={tag} style={{
              fontSize: 10, color: '#888', letterSpacing: '0.05em',
              background: '#f4f4f4', padding: '2px 8px', borderRadius: 2,
            }}>
              #{tag}
            </span>
          ))}
        </div>
      </article>
    </Link>
  )
}
