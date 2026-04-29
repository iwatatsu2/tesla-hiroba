'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, AliexpressPost } from '@/lib/supabase'

const TAGS = ['内装', '外装', '充電', '収納', 'ホイール', 'ライト', 'フィルム', '便利グッズ']
const MODELS = ['Model Y', 'Model YL', 'Model 3']
const card = { background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 22px' }

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'NOW'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d`
  return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

export default function AliexpressPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<AliexpressPost[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})

  // フォーム
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [price, setPrice] = useState('')
  const [rating, setRating] = useState(5)
  const [model, setModel] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [photos, setPhotos] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUser(user)
        const { data: profile } = await supabase.from('profiles').select('tsla_display_name, display_name').eq('id', user.id).single()
        setDisplayName(profile?.tsla_display_name || profile?.display_name || '')
      }
    })
    supabase.from('aliexpress_posts').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setPosts(data || [])
      setLoading(false)
      if (data && data.length > 0) {
        supabase.from('aliexpress_comments').select('post_id').then(({ data: comments }) => {
          const counts: Record<string, number> = {}
          comments?.forEach(c => { counts[c.post_id] = (counts[c.post_id] || 0) + 1 })
          setCommentCounts(counts)
        })
        supabase.from('aliexpress_likes').select('post_id').then(({ data: likes }) => {
          const counts: Record<string, number> = {}
          likes?.forEach(l => { counts[l.post_id] = (counts[l.post_id] || 0) + 1 })
          setLikeCounts(counts)
        })
      }
    })
  }, [])

  const handleSubmit = async () => {
    if (!user) { router.push('/auth'); return }
    if (!title.trim()) return
    setSubmitting(true)

    // 写真アップロード
    const imageUrls: string[] = []
    for (const photo of photos) {
      const ext = photo.name.split('.').pop()
      const path = `aliexpress/${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`
      const { data: uploaded } = await supabase.storage.from('post-images').upload(path, photo)
      if (uploaded) {
        const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(uploaded.path)
        imageUrls.push(publicUrl)
      }
    }

    const { data } = await supabase.from('aliexpress_posts').insert({
      user_id: user.id,
      author_name: displayName || user.email || '匿名',
      title: title.trim(), body: body.trim() || null,
      url: url.trim() || null, price: price.trim() || null,
      rating, model: model || null, tags,
      image_urls: imageUrls.length > 0 ? imageUrls : [],
    }).select().single()
    if (data) setPosts(prev => [data, ...prev])
    setTitle(''); setBody(''); setUrl(''); setPrice(''); setRating(5); setModel(''); setTags([]); setPhotos([])
    setShowForm(false); setSubmitting(false)
  }

  const toggleTag = (t: string) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const filtered = selectedTag ? posts.filter(p => p.tags?.includes(selectedTag)) : posts

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#EC4899', marginBottom: 6, fontWeight: 600 }}>ALIEXPRESS FINDS</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>アリエク購入品</h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>テスラ用アクセサリーのレビュー共有 · {posts.length}件</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 22px', background: '#EC4899', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          {showForm ? '✕ 閉じる' : '＋ 投稿する'}
        </button>
      </div>

      {/* 投稿フォーム */}
      {showForm && (
        <div style={{ ...card, marginBottom: 24, borderColor: '#EC489940' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#EC4899', marginBottom: 12 }}>アリエク購入品を共有</p>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="商品名 *" maxLength={100}
            style={{ width: '100%', padding: '10px 12px', background: '#242424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 14, color: '#F0F0F0', fontFamily: 'inherit', outline: 'none', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="商品URL（任意）"
              style={{ flex: 2, padding: '10px 12px', background: '#242424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13, color: '#F0F0F0', fontFamily: 'inherit', outline: 'none' }} />
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="価格（任意）"
              style={{ flex: 1, padding: '10px 12px', background: '#242424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13, color: '#F0F0F0', fontFamily: 'inherit', outline: 'none' }} />
          </div>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="使ってみた感想（任意）" rows={3}
            style={{ width: '100%', padding: '10px 12px', background: '#242424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 14, color: '#F0F0F0', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.7, marginBottom: 8 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#888' }}>おすすめ度:</span>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, padding: 0, color: n <= rating ? '#F59E0B' : '#333' }}>★</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <select value={model} onChange={e => setModel(e.target.value)}
              style={{ padding: '6px 10px', background: '#242424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 12, color: '#F0F0F0', fontFamily: 'inherit' }}>
              <option value="">車種（任意）</option>
              {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {TAGS.map(t => (
              <button key={t} onClick={() => toggleTag(t)}
                style={{
                  padding: '4px 10px', fontSize: 11, borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
                  background: tags.includes(t) ? '#EC489920' : '#242424',
                  border: tags.includes(t) ? '1px solid #EC489940' : '1px solid rgba(255,255,255,0.08)',
                  color: tags.includes(t) ? '#EC4899' : '#888',
                }}>{t}</button>
            ))}
          </div>

          {/* 写真 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'inline-block', padding: '8px 16px', background: '#242424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, color: '#888', cursor: 'pointer', fontFamily: 'inherit' }}>
              📷 写真を追加（最大5枚）
              <input type="file" accept="image/*" multiple hidden onChange={e => {
                const files = Array.from(e.target.files || []).slice(0, 5)
                setPhotos(files)
              }} />
            </label>
            {photos.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {photos.map((f, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={URL.createObjectURL(f)} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
                    <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#EC4899', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSubmit} disabled={!title.trim() || submitting}
              style={{ padding: '10px 24px', background: !title.trim() || submitting ? '#333' : '#EC4899', color: '#fff', border: 'none', borderRadius: 24, fontSize: 13, fontWeight: 700, cursor: !title.trim() || submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {submitting ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </div>
      )}

      {/* タグフィルター */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        <button onClick={() => setSelectedTag(null)}
          style={{ padding: '4px 12px', fontSize: 11, borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
            background: !selectedTag ? '#EC489920' : '#1A1A1A', border: !selectedTag ? '1px solid #EC489940' : '1px solid rgba(255,255,255,0.08)',
            color: !selectedTag ? '#EC4899' : '#666' }}>ALL</button>
        {TAGS.map(t => (
          <button key={t} onClick={() => setSelectedTag(selectedTag === t ? null : t)}
            style={{ padding: '4px 12px', fontSize: 11, borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
              background: selectedTag === t ? '#EC489920' : '#1A1A1A', border: selectedTag === t ? '1px solid #EC489940' : '1px solid rgba(255,255,255,0.08)',
              color: selectedTag === t ? '#EC4899' : '#666' }}>{t}</button>
        ))}
      </div>

      {/* 投稿一覧 */}
      {loading && <p style={{ color: '#444', fontSize: 13 }}>読み込み中...</p>}
      {!loading && filtered.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: '#444', fontSize: 14, marginBottom: 8 }}>まだ投稿がありません</p>
          <p style={{ color: '#333', fontSize: 12 }}>アリエクで買ったテスラグッズを共有しよう</p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(p => (
          <div key={p.id} onClick={() => router.push(`/aliexpress/${p.id}`)}
            style={{ ...card, cursor: 'pointer', transition: '120ms' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#F0F0F0' }}>{p.title}</span>
                  {p.price && <span style={{ fontSize: 12, color: '#EC4899', fontWeight: 600 }}>{p.price}</span>}
                </div>
                {p.body && <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{p.body}</p>}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {p.tags?.map(t => (
                    <span key={t} style={{ padding: '2px 8px', fontSize: 10, borderRadius: 10, background: '#EC489915', color: '#EC4899', border: '1px solid #EC489930' }}>{t}</span>
                  ))}
                  {p.model && <span style={{ fontSize: 10, color: '#555' }}>{p.model}</span>}
                  <span style={{ fontSize: 10, color: '#444' }}>by {p.author_name || '匿名'}</span>
                  <span style={{ fontSize: 10, color: '#333' }}>{relativeTime(p.created_at)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                {p.image_urls && p.image_urls.length > 0 ? (
                  <img src={p.image_urls[0]} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <span style={{ fontSize: 14, color: '#F59E0B' }}>{'★'.repeat(p.rating)}</span>
                )}
                <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#555' }}>
                  {p.image_urls && p.image_urls.length > 1 && <span>📷{p.image_urls.length}</span>}
                  <span>❤️{likeCounts[p.id] || 0}</span>
                  <span>💬{commentCounts[p.id] || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
