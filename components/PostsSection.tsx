'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase, Post, CATEGORY_JP, Category } from '@/lib/supabase'
import PostCard from '@/components/PostCard'

const TABS: { key: 'all' | Category; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'charging', label: '充電体験' },
  { key: 'delivery', label: '納車待ち' },
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
    async function load() {
      setLoading(true)
      let query = supabase.from('posts').select('*').order('created_at', { ascending: false })
      if (tab !== 'all') query = query.eq('category', tab)
      if (q) query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`)
      const { data } = await query
      setPosts(data || [])

      const { count: total } = await supabase.from('posts').select('*', { count: 'exact', head: true })
      const { count: charging } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('category', 'charging')
      const { count: delivery } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('category', 'delivery')
      const { count: issue } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('category', 'issue')
      setStats({ total: total||0, charging: charging||0, delivery: delivery||0, issue: issue||0 })
      setLoading(false)
    }
    load()
  }, [tab, q])

  return (
    <div>
      {/* Hero */}
      <section style={{
        background: '#111', color: '#fff', padding: '80px 24px 64px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 10, letterSpacing: '0.22em', color: '#888', marginBottom: 20 }}>
          TESLA OWNERS COMMUNITY
        </p>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 300,
          letterSpacing: '0.12em', lineHeight: 1.2, marginBottom: 16,
        }}>
          TSLA PARK
        </h1>
        <p style={{ fontSize: 15, fontWeight: 300, color: '#aaa', marginBottom: 48 }}>
          充電・納車・サービス、すべての体験をシェアしよう
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48 }}>
          {[
            { label: 'POSTS', value: stats.total },
            { label: 'CHARGING', value: stats.charging },
            { label: 'DELIVERY', value: stats.delivery },
            { label: 'SERVICE', value: stats.issue },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 300, letterSpacing: '-0.02em' }}>
                {s.value}
              </div>
              <div style={{ fontSize: 9, letterSpacing: '0.18em', color: '#666', marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          display: 'flex', gap: 0, borderBottom: '1px solid #f0f0f0',
          marginTop: 40, marginBottom: 0,
        }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '12px 20px', fontSize: 12, fontWeight: 400,
                letterSpacing: '0.08em', border: 'none', background: 'transparent',
                cursor: 'pointer', fontFamily: 'inherit',
                borderBottom: tab === t.key ? '2px solid #111' : '2px solid transparent',
                color: tab === t.key ? '#111' : '#999',
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
          {q && (
            <span style={{ fontSize: 12, color: '#888', marginLeft: 'auto', alignSelf: 'center', padding: '0 16px' }}>
              「{q}」の検索結果: {posts.length}件
            </span>
          )}
        </div>

        {/* Posts */}
        <div style={{ minHeight: 400 }}>
          {loading ? (
            <div style={{ padding: '80px 0', textAlign: 'center', color: '#ccc', fontSize: 13 }}>
              Loading...
            </div>
          ) : posts.length === 0 ? (
            <div style={{ padding: '80px 0', textAlign: 'center', color: '#ccc', fontSize: 13 }}>
              投稿がまだありません
            </div>
          ) : (
            posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)
          )}
        </div>
      </div>
    </div>
  )
}
