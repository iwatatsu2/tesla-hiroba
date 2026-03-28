'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase, Post, Category } from '@/lib/supabase'
import PostCard from '@/components/PostCard'
import Link from 'next/link'

const TABS: { key: 'all' | Category; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'charging', label: '充電体験' },
  { key: 'delivery', label: '納車報告' },
  { key: 'issue', label: '不具合・修理' },
]

export default function PostsSection() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const [posts, setPosts] = useState<Post[]>([])
  const [tab, setTab] = useState<'all' | Category>('all')
  const [stats, setStats] = useState({ total: 0, charging: 0, delivery: 0, issue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    let query = supabase.from('posts').select('*').order('created_at', { ascending: false })
    if (tab !== 'all') query = query.eq('category', tab)
    if (q) query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`)
    query.then(({ data }) => { setPosts(data || []); setLoading(false) })

    Promise.all([
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('category', 'charging'),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('category', 'delivery'),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('category', 'issue'),
    ]).then(([a, b, c, d]) => setStats({ total: a.count||0, charging: b.count||0, delivery: c.count||0, issue: d.count||0 }))
  }, [tab, q])

  return (
    <div>
      {/* Hero */}
      <section style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '64px 20px 48px', textAlign: 'center' }}>
        <p style={{ fontSize: 10, letterSpacing: '0.25em', color: '#CC0000', marginBottom: 14, fontWeight: 600 }}>TESLA OWNERS COMMUNITY</p>
        <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, letterSpacing: '0.12em', marginBottom: 12 }}>
          TSLA<span style={{ color: '#CC0000' }}>PARK</span>
        </h1>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 40 }}>充電・納車・サービス、すべての体験をシェアしよう</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {[{ label: 'POSTS', v: stats.total }, { label: 'CHARGING', v: stats.charging }, { label: 'DELIVERY', v: stats.delivery }, { label: 'SERVICE', v: stats.issue }].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{s.v}</div>
              <div style={{ fontSize: 9, letterSpacing: '0.18em', color: '#444', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', marginTop: 32 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '10px 18px', fontSize: 12, fontWeight: tab === t.key ? 600 : 400,
              border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
              borderBottom: `2px solid ${tab === t.key ? '#CC0000' : 'transparent'}`,
              color: tab === t.key ? '#F0F0F0' : '#666', marginBottom: -1, transition: '150ms ease',
            }}>{t.label}</button>
          ))}
          {q && <span style={{ fontSize: 12, color: '#666', marginLeft: 'auto', alignSelf: 'center', padding: '0 12px' }}>「{q}」{posts.length}件</span>}
        </div>

        {/* Posts */}
        <div style={{ paddingTop: 16, minHeight: 400 }}>
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#333', fontSize: 13 }}>Loading...</div>
          ) : posts.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <p style={{ color: '#444', fontSize: 14, marginBottom: 16 }}>投稿がまだありません</p>
              <Link href="/new" style={{ color: '#CC0000', fontSize: 13, textDecoration: 'none' }}>最初に投稿する →</Link>
            </div>
          ) : posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
        </div>
      </div>
    </div>
  )
}
