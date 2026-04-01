'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, Post, Category, CATEGORY_COLOR, CATEGORY_JP } from '@/lib/supabase'
import PostCard from '@/components/PostCard'
import Link from 'next/link'

const TABS: { key: 'all' | Category; label: string; jp: string }[] = [
  { key: 'all', label: 'ALL', jp: 'すべて' },
  { key: 'charging', label: 'CHG', jp: '充電' },
  { key: 'issue', label: 'ERR', jp: '不具合' },
  { key: 'software', label: 'OTA', jp: 'ソフト' },
  { key: 'cost', label: 'COST', jp: '維持費' },
  { key: 'trip', label: 'TRIP', jp: '旅行' },
  { key: 'accessory', label: 'MOD', jp: 'カスタム' },
  { key: 'insurance', label: 'INS', jp: '保険' },
  { key: 'question', label: 'Q&A', jp: 'Q&A' },
  { key: 'general', label: 'MISC', jp: '雑談' },
]

export default function PostsSection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [tab, setTab] = useState<'all' | Category>('all')
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const tabRef = useRef<HTMLDivElement>(null)
  const [pullY, setPullY] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const fetchPosts = async () => {
    let query = supabase.from('posts').select('*').order('created_at', { ascending: false })
    if (tab !== 'all') query = query.eq('category', tab)
    const { data } = await query
    const ps = data || []
    setAllPosts(ps)
    if (ps.length > 0) {
      const { data: counts } = await supabase
        .from('comments').select('post_id').in('post_id', ps.map(p => p.id))
      const map: Record<string, number> = {}
      counts?.forEach(c => { map[c.post_id] = (map[c.post_id] || 0) + 1 })
      setCommentCounts(map)
    }
    const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true })
    setTotal(count || 0)
  }

  useEffect(() => {
    setLoading(true)
    fetchPosts().then(() => setLoading(false))
  }, [tab, refreshKey])

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => { if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY }
    const onTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 0 || refreshing) return
      const dy = e.touches[0].clientY - touchStartY.current
      if (dy > 0) { setIsPulling(true); setPullY(Math.min(dy * 0.4, 72)) }
    }
    const onTouchEnd = async () => {
      if (pullY > 50 && !refreshing) {
        setRefreshing(true); setPullY(48)
        await fetchPosts()
        setRefreshing(false)
      }
      setPullY(0); setIsPulling(false)
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [pullY, refreshing, tab])

  const q = searchQuery.trim().toLowerCase()
  const posts = q
    ? allPosts.filter(p => p.title.toLowerCase().includes(q) || (p.body || '').toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q)))
    : allPosts

  return (
    <div>
      {/* Pull indicator */}
      <div style={{ height: pullY, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: isPulling ? 'none' : 'height 300ms', background: '#0A0A0A' }}>
        {(isPulling || refreshing) && (
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#00FFFF' }}>
            {refreshing ? '// LOADING...' : pullY > 50 ? '// RELEASE' : '// PULL'}
          </span>
        )}
      </div>

      {/* Hero */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: '#0A0A0A',
        borderBottom: '2px solid #C0C0C0',
        padding: '64px 20px 48px', textAlign: 'center',
      }}>
        {/* 四隅イラスト */}
        <img src="/illust-optimus.png" alt="" style={{ position: 'absolute', top: 8, left: 8, height: 56, imageRendering: 'pixelated', objectFit: 'contain', mixBlendMode: 'screen' }} />
        <img src="/illust-cybertruck.png" alt="" style={{ position: 'absolute', top: 8, right: 8, height: 56, imageRendering: 'pixelated', objectFit: 'contain', mixBlendMode: 'screen' }} />
        <img src="/illust-model-3.png" alt="" style={{ position: 'absolute', bottom: 8, left: 8, height: 56, imageRendering: 'pixelated', objectFit: 'contain', mixBlendMode: 'screen' }} />
        <img src="/illust-model-x.png" alt="" style={{ position: 'absolute', bottom: 8, right: 8, height: 56, imageRendering: 'pixelated', objectFit: 'contain', mixBlendMode: 'screen' }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#404040', marginBottom: 20, letterSpacing: '0.2em' }}>// TESLA OWNERS COMMUNITY</p>
          <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 'clamp(24px,5vw,48px)', color: '#C0C0C0', marginBottom: 4, lineHeight: 1.2, letterSpacing: '0.1em' }}>
            TSLA
          </h1>
          <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 'clamp(14px,3vw,28px)', color: '#00FFFF', marginBottom: 24, letterSpacing: '0.15em' }}>
            PARK
          </h2>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#404040', marginBottom: 32, letterSpacing: '0.05em' }}>
            CHARGE · DELIVERY · SHARE
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/new" style={{
              fontFamily: "'Press Start 2P', monospace",
              padding: '12px 24px', background: '#C0C0C0', color: '#000',
              border: '2px solid #C0C0C0', fontSize: 9, textDecoration: 'none',
              transition: '120ms',
            }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = '#00FFFF'; e.currentTarget.style.borderColor = '#00FFFF' }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = '#C0C0C0'; e.currentTarget.style.borderColor = '#C0C0C0' }}
            >
              &gt; POST
            </Link>
            {user ? (
              <Link href="/profile" style={{
                fontFamily: "'Press Start 2P', monospace",
                padding: '12px 20px', background: 'transparent', color: '#00FFFF',
                border: '2px solid #00FFFF', fontSize: 9, textDecoration: 'none',
                transition: '120ms',
              }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = '#00FFFF'; e.currentTarget.style.color = '#000' }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#00FFFF' }}
              >
                &gt; PROFILE
              </Link>
            ) : (
              <Link href="/auth" style={{
                fontFamily: "'Press Start 2P', monospace",
                padding: '12px 20px', background: 'transparent', color: '#00FFFF',
                border: '2px solid #00FFFF', fontSize: 9, textDecoration: 'none',
                transition: '120ms',
              }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = '#00FFFF'; e.currentTarget.style.color = '#000' }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#00FFFF' }}
              >
                &gt; LOGIN
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div ref={tabRef} style={{ borderBottom: '2px solid #C0C0C0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any, scrollbarWidth: 'none' as any, background: '#0A0A0A', position: 'sticky', top: 60, zIndex: 100, height: 56, display: 'flex', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', minWidth: 'max-content', maxWidth: 680, margin: '0 auto', height: '100%' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '0 14px',
              border: 'none', borderBottom: `2px solid ${tab === t.key ? '#00FFFF' : 'transparent'}`,
              background: 'transparent', cursor: 'pointer', height: '100%',
              color: tab === t.key ? '#00FFFF' : '#404040',
              marginBottom: -2, transition: '120ms', whiteSpace: 'nowrap',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
            } as React.CSSProperties}>
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7 }}>{t.key === tab ? '>' : ''}{t.label}</span>
              <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 9 }}>{t.jp}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '12px 20px 0' }}>
        <div style={{ position: 'relative', border: '2px solid #2A2A2A', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#404040', padding: '0 10px', flexShrink: 0 }}>SEARCH&gt;</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="キーワードを入力..."
            style={{ flex: 1, padding: '10px 8px', fontSize: 13, outline: 'none', background: 'transparent', border: 'none', color: '#E0E0E0', fontFamily: 'inherit' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#404040', fontSize: 16, padding: '0 10px' }}>×</button>
          )}
        </div>
        {q && <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#404040', marginTop: 8 }}>// {posts.length} RESULTS FOR "{q}"</p>}
      </div>

      {/* Feed */}
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {!loading && !q && (
          <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#404040' }}>//</span>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#404040' }}>{total} POSTS</span>
          </div>
        )}
        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#404040' }}>LOADING<span className="blink">_</span></span>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#404040', marginBottom: 16 }}>
              {q ? `// NO RESULTS` : '// NO POSTS YET'}
            </p>
            {!q && <Link href="/new" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#00FFFF', textDecoration: 'none' }}>&gt; POST FIRST</Link>}
          </div>
        ) : (
          posts.map((post, i) => (
            <PostCard key={post.id} post={post} commentCount={commentCounts[post.id] || 0} index={i} />
          ))
        )}
      </div>
    </div>
  )
}
