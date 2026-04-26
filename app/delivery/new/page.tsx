'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

export default function NewDelivery() {
  const router = useRouter()
  const [model, setModel] = useState(MODELS[0])
  const [grade, setGrade] = useState('')
  const [dates, setDates] = useState<Record<string, string>>({})
  const [region, setRegion] = useState('')
  const [color, setColor] = useState('')
  const [note, setNote] = useState('')
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth'); return }
      setUser(user)
      const { data: profile } = await supabase.from('profiles').select('tsla_display_name, display_name').eq('id', user.id).single()
      setDisplayName(profile?.tsla_display_name || profile?.display_name || '')
      setLoading(false)
    })
  }, [router])

  const setDate = (key: string, val: string) => setDates(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dates.order_date || !user) return
    setSubmitting(true)
    setErrorMsg('')
    const authorName = displayName || user.email || '匿名'
    const { error } = await supabase.from('delivery_reports').insert({
      model, grade: grade || null,
      order_date: dates.order_date,
      vin_date: dates.vin_date || null,
      docs_date: dates.docs_date || null,
      confirmed_date: dates.confirmed_date || null,
      delivery_date: dates.delivery_date || null,
      region: region || null, color: color || null, note: note || null,
      author_name: authorName,
      user_id: user.id,
    })
    if (error) {
      setErrorMsg(`送信エラー: ${error.message}`)
      setSubmitting(false)
      return
    }
    router.push('/delivery')
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#A0A0A0', marginBottom: 8, fontWeight: 600 }}>DELIVERY TRACKER</p>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>納車進捗を報告する</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>途中の段階でもOK！分かる日付だけ入力してください</p>
      <p style={{ fontSize: 12, color: '#555', marginBottom: 28 }}>みんなの進捗データが全員の役に立ちます</p>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#404040' }}>LOADING...</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} style={{ display: loading ? 'none' : 'flex', flexDirection: 'column', gap: 24 }}>
        {/* 投稿者名 */}
        <div style={{ padding: '12px 16px', background: 'rgba(0,255,255,0.04)', border: '1px solid rgba(0,255,255,0.12)', borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: '#888' }}>投稿者: <span style={{ color: '#00FFFF', fontWeight: 700 }}>{displayName || user?.email}</span></p>
        </div>

        {/* モデル */}
        <div>
          <label style={lbl}>モデル *</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {MODELS.map(m => (
              <button key={m} type="button" onClick={() => { setModel(m); setGrade('') }}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: 'none', background: model === m ? '#A0A0A0' : '#242424', color: model === m ? '#fff' : '#888', fontWeight: 600, fontFamily: 'inherit', transition: '150ms ease' }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* グレード */}
        <div>
          <label style={lbl}>グレード</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(GRADES[model] || []).map(g => (
              <button key={g} type="button" onClick={() => setGrade(g === grade ? '' : g)}
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: `1px solid ${grade === g ? '#A0A0A0' : 'rgba(255,255,255,0.1)'}`, background: grade === g ? '#A0A0A020' : 'transparent', color: grade === g ? '#A0A0A0' : '#888', fontFamily: 'inherit', transition: '150ms ease' }}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* 進捗ステージ */}
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

        {/* 地域・色 */}
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

        <div style={{ background: '#242424', borderRadius: 8, padding: '12px 14px' }}>
          <p style={{ fontSize: 11, color: '#555', lineHeight: 1.7, margin: 0 }}>
            投稿内容はユーザーの任意情報です。正確性を保証するものではありません。売買・リファーラルコード・外部リンクの掲載は禁止です。
          </p>
        </div>

        <button type="submit" disabled={submitting || !dates.order_date}
          style={{ padding: '14px 0', background: submitting || !dates.order_date ? '#333' : '#A0A0A0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: submitting || !dates.order_date ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {submitting ? '送信中...' : '報告する'}
        </button>
      </form>
    </div>
  )
}
