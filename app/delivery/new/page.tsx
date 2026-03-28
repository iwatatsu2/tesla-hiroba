'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const MODELS = ['Model Y', 'Model 3', 'Model S', 'Model X', 'Cybertruck']
const GRADES: Record<string, string[]> = {
  'Model Y': ['Standard Range', 'Long Range', 'Performance'],
  'Model 3': ['Standard Range', 'Long Range', 'Performance'],
  'Model S': ['Long Range', 'Plaid'],
  'Model X': ['Long Range', 'Plaid'],
  'Cybertruck': ['Standard', 'Long Range', 'Cyberbeast'],
}
const COLORS = ['パールホワイト', 'ミッドナイトシルバー', 'ディープブルー', 'ソリッドブラック', 'ウルトラレッド', 'スターホワイト', 'スチールグレー']
const PREFECTURES = ['北海道','青森','岩手','宮城','秋田','山形','福島','茨城','栃木','群馬','埼玉','千葉','東京','神奈川','新潟','富山','石川','福井','山梨','長野','岐阜','静岡','愛知','三重','滋賀','京都','大阪','兵庫','奈良','和歌山','鳥取','島根','岡山','広島','山口','徳島','香川','愛媛','高知','福岡','佐賀','長崎','熊本','大分','宮崎','鹿児島','沖縄']

const inp = {
  width: '100%', padding: '11px 14px', borderRadius: 8, fontSize: 14, outline: 'none',
  background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0F0',
  fontFamily: 'inherit',
}
const lbl = { fontSize: 11, letterSpacing: '0.1em', color: '#666', display: 'block' as const, marginBottom: 6 }

export default function NewDelivery() {
  const router = useRouter()
  const [model, setModel] = useState(MODELS[0])
  const [grade, setGrade] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [waiting, setWaiting] = useState(false)
  const [region, setRegion] = useState('')
  const [color, setColor] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderDate) return
    setSubmitting(true)
    await supabase.from('delivery_reports').insert({
      model, grade: grade || null,
      order_date: orderDate,
      delivery_date: waiting ? null : (deliveryDate || null),
      region: region || null, color: color || null, note: note || null,
    })
    router.push('/delivery')
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#CC0000', marginBottom: 8 }}>DELIVERY TRACKER</p>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>納車情報を報告する</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 32 }}>みんなの納期データがトラッカーをより正確にします</p>

      {/* ルール */}
      <div style={{ background: '#242424', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 16px', marginBottom: 28 }}>
        <p style={{ fontSize: 11, color: '#666', marginBottom: 6, fontWeight: 600 }}>禁止事項</p>
        {['車両・部品の売買・譲渡', 'リファーラルコードの掲載', '虚偽・誇大な情報の投稿', '個人情報の公開'].map(r => (
          <p key={r} style={{ fontSize: 11, color: '#555', margin: '2px 0', paddingLeft: 8 }}>・{r}</p>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* モデル */}
        <div>
          <label style={lbl}>モデル *</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {MODELS.map(m => (
              <button key={m} type="button" onClick={() => { setModel(m); setGrade('') }}
                style={{
                  padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: 'none',
                  background: model === m ? '#CC0000' : '#242424', color: model === m ? '#fff' : '#888',
                  fontWeight: model === m ? 600 : 400, fontFamily: 'inherit', transition: '150ms ease',
                }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* グレード */}
        <div>
          <label style={lbl}>グレード</label>
          <select value={grade} onChange={e => setGrade(e.target.value)} style={{ ...inp, background: '#1A1A1A' }}>
            <option value="">選択してください</option>
            {(GRADES[model] || []).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* 注文日 */}
        <div>
          <label style={lbl}>注文日 *</label>
          <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} required style={inp} />
        </div>

        {/* 納車済み or 待ち中 */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: '#F0F0F0' }}>
            <input type="checkbox" checked={waiting} onChange={e => setWaiting(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#CC0000' }} />
            まだ納車待ち中
          </label>
        </div>

        {!waiting && (
          <div>
            <label style={lbl}>納車日</label>
            <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} style={inp} />
          </div>
        )}

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
              {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* メモ */}
        <div>
          <label style={lbl}>一言メモ（任意）</label>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="例：3ヶ月待って先日納車されました！大満足です" rows={3}
            style={{ ...inp, resize: 'vertical', lineHeight: 1.7 }} />
        </div>

        <div style={{ background: '#242424', borderRadius: 8, padding: '12px 14px' }}>
          <p style={{ fontSize: 11, color: '#555', lineHeight: 1.7 }}>
            投稿内容はユーザーの任意情報です。正確性を保証するものではありません。
          </p>
        </div>

        <button type="submit" disabled={submitting || !orderDate}
          style={{
            padding: '14px 0', background: submitting || !orderDate ? '#333' : '#CC0000',
            color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
            cursor: submitting || !orderDate ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}>
          {submitting ? '送信中...' : '報告する'}
        </button>
      </form>
    </div>
  )
}
