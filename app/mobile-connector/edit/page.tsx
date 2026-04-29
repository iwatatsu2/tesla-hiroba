'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

const SOLUTION_TYPES = [
  { value: 'official_wait', label: '純正待ち', color: '#3B82F6' },
  { value: 'third_party', label: '社外品', color: '#10B981' },
  { value: 'used', label: '中古購入', color: '#F59E0B' },
  { value: 'construction', label: '工事・設置', color: '#8B5CF6' },
  { value: 'other', label: 'その他', color: '#6B7280' },
]
const MODELS = ['Model Y', 'Model YL', 'Model 3']
const PREFECTURES = ['北海道','青森','岩手','宮城','秋田','山形','福島','茨城','栃木','群馬','埼玉','千葉','東京','神奈川','新潟','富山','石川','福井','山梨','長野','岐阜','静岡','愛知','三重','滋賀','京都','大阪','兵庫','奈良','和歌山','鳥取','島根','岡山','広島','山口','徳島','香川','愛媛','高知','福岡','佐賀','長崎','熊本','大分','宮崎','鹿児島','沖縄']
const inp = { width: '100%', padding: '11px 14px', borderRadius: 8, fontSize: 14, outline: 'none', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0F0', fontFamily: 'inherit' }
const lbl = { fontSize: 11, letterSpacing: '0.1em', color: '#666', display: 'block' as const, marginBottom: 6 }

function EditForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [solutionType, setSolutionType] = useState('other')
  const [model, setModel] = useState('')
  const [region, setRegion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return }
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data } = await supabase.from('mc_posts').select('*').eq('id', id).single()
      if (!data) { setNotFound(true); setLoading(false); return }
      if (data.user_id !== user.id) { setNotFound(true); setLoading(false); return }
      setTitle(data.title || '')
      setBody(data.body || '')
      setSolutionType(data.solution_type || 'other')
      setModel(data.model || '')
      setRegion(data.region || '')
      setLoading(false)
    }
    load()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !id) return
    setSubmitting(true)
    setErrorMsg('')
    const { error } = await supabase.from('mc_posts').update({
      title: title.trim(),
      body: body.trim() || null,
      solution_type: solutionType,
      model: model || null,
      region: region || null,
    }).eq('id', id)
    if (error) {
      setErrorMsg(`更新エラー: ${error.message}`)
      setSubmitting(false)
      return
    }
    router.push(`/mobile-connector/${id}`)
  }

  if (loading) return <div style={{ padding: '80px 20px', textAlign: 'center', color: '#444' }}>読み込み中...</div>
  if (notFound) return <div style={{ padding: '80px 20px', textAlign: 'center', color: '#444' }}>投稿が見つからないか、編集権限がありません</div>

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#F59E0B', marginBottom: 8, fontWeight: 600 }}>MOBILE CONNECTOR</p>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>投稿を修正する</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>内容を更新してください</p>
      {errorMsg && (
        <div style={{ padding: '12px 16px', background: '#2A1A1A', border: '1px solid rgba(255,100,100,0.3)', borderRadius: 8, fontSize: 13, color: '#FF9090', marginBottom: 20 }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={lbl}>タイトル *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="タイトル" maxLength={100} style={inp} />
        </div>

        <div>
          <label style={lbl}>詳細</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="費用、期間、感想など" rows={4}
            style={{ ...inp, resize: 'vertical', lineHeight: 1.7 }} />
        </div>

        <div>
          <label style={lbl}>対応方法</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SOLUTION_TYPES.map(t => (
              <button key={t.value} type="button" onClick={() => setSolutionType(t.value)}
                style={{
                  padding: '5px 12px', fontSize: 12, borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
                  background: solutionType === t.value ? `${t.color}20` : '#242424',
                  border: solutionType === t.value ? `1px solid ${t.color}60` : '1px solid rgba(255,255,255,0.08)',
                  color: solutionType === t.value ? t.color : '#888',
                }}>{t.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>車種</label>
            <select value={model} onChange={e => setModel(e.target.value)} style={inp}>
              <option value="">選択なし</option>
              {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>地域</label>
            <select value={region} onChange={e => setRegion(e.target.value)} style={inp}>
              <option value="">選択なし</option>
              {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={() => router.back()}
            style={{ flex: 1, padding: '13px 0', background: 'transparent', color: '#666', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            キャンセル
          </button>
          <button type="submit" disabled={submitting || !title.trim()}
            style={{ flex: 2, padding: '13px 0', background: submitting || !title.trim() ? '#333' : '#F59E0B', color: '#000', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: submitting || !title.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {submitting ? '更新中...' : '更新する'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function EditMcPage() {
  return <Suspense><EditForm /></Suspense>
}
