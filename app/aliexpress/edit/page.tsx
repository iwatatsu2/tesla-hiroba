'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

const TAGS = ['内装', '外装', '充電', '収納', 'ホイール', 'ライト', 'フィルム', '便利グッズ']
const MODELS = ['Model Y', 'Model YL', 'Model 3']
const inp = { width: '100%', padding: '11px 14px', borderRadius: 8, fontSize: 14, outline: 'none', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0F0', fontFamily: 'inherit' }
const lbl = { fontSize: 11, letterSpacing: '0.1em', color: '#666', display: 'block' as const, marginBottom: 6 }

function EditForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [price, setPrice] = useState('')
  const [rating, setRating] = useState(5)
  const [model, setModel] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return }
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data } = await supabase.from('aliexpress_posts').select('*').eq('id', id).single()
      if (!data) { setNotFound(true); setLoading(false); return }
      if (data.user_id !== user.id) { setNotFound(true); setLoading(false); return }
      setTitle(data.title || '')
      setBody(data.body || '')
      setUrl(data.url || '')
      setPrice(data.price || '')
      setRating(data.rating || 5)
      setModel(data.model || '')
      setTags(data.tags || [])
      setLoading(false)
    }
    load()
  }, [id, router])

  const toggleTag = (t: string) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !id) return
    setSubmitting(true)
    setErrorMsg('')
    const { error } = await supabase.from('aliexpress_posts').update({
      title: title.trim(),
      body: body.trim() || null,
      url: url.trim() || null,
      price: price.trim() || null,
      rating,
      model: model || null,
      tags,
    }).eq('id', id)
    if (error) {
      setErrorMsg(`更新エラー: ${error.message}`)
      setSubmitting(false)
      return
    }
    router.push(`/aliexpress/${id}`)
  }

  if (loading) return <div style={{ padding: '80px 20px', textAlign: 'center', color: '#444' }}>読み込み中...</div>
  if (notFound) return <div style={{ padding: '80px 20px', textAlign: 'center', color: '#444' }}>投稿が見つからないか、編集権限がありません</div>

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#EC4899', marginBottom: 8, fontWeight: 600 }}>ALIEXPRESS FINDS</p>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>投稿を修正する</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>内容を更新してください</p>
      {errorMsg && (
        <div style={{ padding: '12px 16px', background: '#2A1A1A', border: '1px solid rgba(255,100,100,0.3)', borderRadius: 8, fontSize: 13, color: '#FF9090', marginBottom: 20 }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={lbl}>商品名 *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="商品名" maxLength={100} style={inp} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 2 }}>
            <label style={lbl}>商品URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." style={inp} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>価格</label>
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="¥1,000" style={inp} />
          </div>
        </div>

        <div>
          <label style={lbl}>感想</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="使ってみた感想" rows={4}
            style={{ ...inp, resize: 'vertical', lineHeight: 1.7 }} />
        </div>

        <div>
          <label style={lbl}>おすすめ度</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setRating(n)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, padding: 2, color: n <= rating ? '#F59E0B' : '#333' }}>★</button>
            ))}
          </div>
        </div>

        <div>
          <label style={lbl}>車種</label>
          <select value={model} onChange={e => setModel(e.target.value)} style={inp}>
            <option value="">選択なし</option>
            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label style={lbl}>タグ</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TAGS.map(t => (
              <button key={t} type="button" onClick={() => toggleTag(t)}
                style={{
                  padding: '5px 12px', fontSize: 12, borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
                  background: tags.includes(t) ? '#EC489920' : '#242424',
                  border: tags.includes(t) ? '1px solid #EC489940' : '1px solid rgba(255,255,255,0.08)',
                  color: tags.includes(t) ? '#EC4899' : '#888',
                }}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={() => router.back()}
            style={{ flex: 1, padding: '13px 0', background: 'transparent', color: '#666', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            キャンセル
          </button>
          <button type="submit" disabled={submitting || !title.trim()}
            style={{ flex: 2, padding: '13px 0', background: submitting || !title.trim() ? '#333' : '#EC4899', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: submitting || !title.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {submitting ? '更新中...' : '更新する'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function EditAliexpressPage() {
  return <Suspense><EditForm /></Suspense>
}
