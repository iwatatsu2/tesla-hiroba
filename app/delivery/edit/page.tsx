'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

const MODELS = ['Model Y', 'Model YL', 'Model 3']
const GRADES: Record<string, string[]> = {
  'Model Y': ['RWD', 'Long Range'],
  'Model YL': ['AWD'],
  'Model 3': ['RWD', 'Long Range', 'Performance'],
}
const COLORS: Record<string, string[]> = {
  'Model Y': ['ステルスグレー', 'ダイヤモンドブラック', 'グレイシャーブルー', 'パールホワイト', 'クイックシルバー', 'ウルトラレッド'],
  'Model YL': ['ステルスグレー', 'ダイヤモンドブラック', 'グレイシャーブルー', 'パールホワイト', 'クイックシルバー', 'ウルトラレッド'],
  'Model 3': ['ステルスグレー', 'ダイヤモンドブラック', 'マリンブルー', 'パールホワイト', 'クイックシルバー', 'ウルトラレッド'],
}
const PREFECTURES = ['北海道','青森','岩手','宮城','秋田','山形','福島','茨城','栃木','群馬','埼玉','千葉','東京','神奈川','新潟','富山','石川','福井','山梨','長野','岐阜','静岡','愛知','三重','滋賀','京都','大阪','兵庫','奈良','和歌山','鳥取','島根','岡山','広島','山口','徳島','香川','愛媛','高知','福岡','佐賀','長崎','熊本','大分','宮崎','鹿児島','沖縄']
const STAGES = [
  { key: 'order_date', label: '注文日', required: true, icon: '📋' },
  { key: 'vin_date', label: 'VINコード表示日', required: false, icon: '🔢' },
  { key: 'docs_date', label: '書類到着日', required: false, icon: '📄' },
  { key: 'confirmed_date', label: '納車日が確定した日', required: false, icon: '✅' },
  { key: 'delivery_date', label: '実際の納車日', required: false, icon: '🚗' },
]

const inp = { width: '100%', padding: '11px 14px', borderRadius: 8, fontSize: 14, outline: 'none', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0F0', fontFamily: 'inherit' }
const lbl = { fontSize: 11, letterSpacing: '0.1em', color: '#666', display: 'block' as const, marginBottom: 6 }

function EditForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [model, setModel] = useState(MODELS[0])
  const [grade, setGrade] = useState('')
  const [dates, setDates] = useState<Record<string, string>>({})
  const [region, setRegion] = useState('')
  const [color, setColor] = useState('')
  const [note, setNote] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return }
    supabase.from('delivery_reports').select('*').eq('id', id).single().then(({ data }) => {
      if (!data) { setNotFound(true); setLoading(false); return }
      setModel(data.model || MODELS[0])
      setGrade(data.grade || '')
      setRegion(data.region || '')
      setColor(data.color || '')
      setNote(data.note || '')
      setAuthorName(data.author_name || '')
      const d: Record<string, string> = {}
      STAGES.forEach(s => { if (data[s.key]) d[s.key] = data[s.key] })
      setDates(d)
      setLoading(false)
    })
  }, [id])

  const setDate = (key: string, val: string) => setDates(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dates.order_date || !id) return
    setSubmitting(true)
    setErrorMsg('')
    const { error } = await supabase.from('delivery_reports').update({
      model, grade: grade || null,
      order_date: dates.order_date,
      vin_date: dates.vin_date || null,
      docs_date: dates.docs_date || null,
      confirmed_date: dates.confirmed_date || null,
      delivery_date: dates.delivery_date || null,
      region: region || null, color: color || null, note: note || null,
      author_name: authorName.trim() || '匿名',
    }).eq('id', id)
    if (error) {
      setErrorMsg(`更新エラー: ${error.message}`)
      setSubmitting(false)
      return
    }
    router.push('/delivery')
  }

  if (loading) return <div style={{ padding: '80px 20px', textAlign: 'center', color: '#444' }}>読み込み中...</div>
  if (notFound) return <div style={{ padding: '80px 20px', textAlign: 'center', color: '#444' }}>報告が見つかりませんでした</div>

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#A0A0A0', marginBottom: 8, fontWeight: 600 }}>DELIVERY TRACKER</p>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>進捗を修正する</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>内容を更新してください</p>
      {errorMsg && (
        <div style={{ padding: '12px 16px', background: '#2A1A1A', border: '1px solid rgba(255,100,100,0.3)', borderRadius: 8, fontSize: 13, color: '#FF9090', marginBottom: 20 }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <label style={lbl}>ニックネーム（任意）</label>
          <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)}
            placeholder="例：東京のModel Yオーナー" style={{ ...inp }} />
        </div>

        <div>
          <label style={lbl}>モデル *</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {MODELS.map(m => (
              <button key={m} type="button" onClick={() => { setModel(m); setGrade('') }}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: 'none', background: model === m ? '#E8E8E8' : '#242424', color: model === m ? '#111' : '#888', fontWeight: 600, fontFamily: 'inherit', transition: '150ms ease' }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={lbl}>グレード</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(GRADES[model] || []).map(g => (
              <button key={g} type="button" onClick={() => setGrade(g === grade ? '' : g)}
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: `1px solid ${grade === g ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`, background: grade === g ? 'rgba(255,255,255,0.1)' : 'transparent', color: grade === g ? '#F0F0F0' : '#888', fontFamily: 'inherit', transition: '150ms ease' }}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={lbl}>進捗を入力（分かる項目だけでOK）</label>
          <div style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
            {STAGES.map((stage, i) => (
              <div key={stage.key} style={{ padding: '16px 18px', borderBottom: i < STAGES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{stage.icon}</span>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: dates[stage.key] ? '#F0F0F0' : '#666', fontWeight: dates[stage.key] ? 600 : 400, display: 'block', marginBottom: 4 }}>
                    {stage.label}{stage.required && <span style={{ color: '#A0A0A0' }}>*</span>}
                  </label>
                  <input type="date" value={dates[stage.key] || ''} onChange={e => setDate(stage.key, e.target.value)}
                    required={stage.required}
                    style={{ ...inp, padding: '7px 12px', fontSize: 13, width: 'auto' }}
                  />
                </div>
                {dates[stage.key] && <span style={{ fontSize: 18, color: '#10B981', flexShrink: 0 }}>✓</span>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>都道府県</label>
            <select value={region} onChange={e => setRegion(e.target.value)} style={{ ...inp, background: '#1A1A1A' }}>
              <option value="">選択</option>
              {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>外装色</label>
            <select value={color} onChange={e => setColor(e.target.value)} style={{ ...inp, background: '#1A1A1A' }}>
              <option value="">選択</option>
              {(COLORS[model] || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={lbl}>一言メモ（任意）</label>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="例：VINが出てから書類が届くまで2週間かかりました" rows={3}
            style={{ ...inp, resize: 'vertical', lineHeight: 1.7 }} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={() => router.push('/delivery')}
            style={{ flex: 1, padding: '13px 0', background: 'transparent', color: '#666', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            キャンセル
          </button>
          <button type="submit" disabled={submitting || !dates.order_date}
            style={{ flex: 2, padding: '13px 0', background: submitting || !dates.order_date ? '#333' : '#E8E8E8', color: submitting || !dates.order_date ? '#666' : '#111', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: submitting || !dates.order_date ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {submitting ? '更新中...' : '更新する'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function EditDeliveryPage() {
  return <Suspense><EditForm /></Suspense>
}
