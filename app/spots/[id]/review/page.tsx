'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, ChargingSpot } from '@/lib/supabase'

const RULES = [
  '車両・部品・グッズの売買・譲渡に関する投稿',
  'リファーラルコード・クーポンの売買・交換',
  '特定個人・企業への誹謗中傷',
  '虚偽・誇大な情報の投稿',
]

const CONGESTION_LABELS = ['', 'ガラガラ', 'すいてる', 'ふつう', 'やや混雑', '満車']
const CONGESTION_COLORS = ['', '#22c55e', '#86efac', '#fbbf24', '#f97316', '#ef4444']

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [spot, setSpot] = useState<ChargingSpot | null>(null)
  const [authorName, setAuthorName] = useState('')
  const [congestion, setCongestion] = useState(3)
  const [waitMinutes, setWaitMinutes] = useState('')
  const [actualKw, setActualKw] = useState('')
  const [nearbyFacilities, setNearbyFacilities] = useState('')
  const [parkingInfo, setParkingInfo] = useState('')
  const [body, setBody] = useState('')
  const [visitedAt, setVisitedAt] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.from('charging_spots').select('*').eq('id', id).single().then(({ data }) => setSpot(data))
    const now = new Date()
    setVisitedAt(now.toISOString().slice(0, 16))
  }, [id])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5)
    setPhotos(files)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const { data: review } = await supabase.from('spot_reviews').insert({
      spot_id: id,
      author_name: authorName || '匿名',
      congestion_level: congestion,
      wait_minutes: waitMinutes ? parseInt(waitMinutes) : null,
      actual_kw: actualKw ? parseFloat(actualKw) : null,
      nearby_facilities: nearbyFacilities || null,
      parking_info: parkingInfo || null,
      body: body || null,
      visited_at: visitedAt || null,
    }).select().single()

    if (review && photos.length > 0) {
      for (const photo of photos) {
        const ext = photo.name.split('.').pop()
        const path = `${id}/${review.id}-${Date.now()}.${ext}`
        const { data: uploaded } = await supabase.storage.from('spot-photos').upload(path, photo)
        if (uploaded) {
          const { data: { publicUrl } } = supabase.storage.from('spot-photos').getPublicUrl(uploaded.path)
          await supabase.from('spot_photos').insert({ spot_id: id, review_id: review.id, url: publicUrl })
        }
      }
    }
    router.push(`/spots/${id}`)
  }

  const inputStyle = {
    width: '100%', padding: '11px 13px', border: '1px solid #e8e8e8',
    borderRadius: 6, fontSize: 14, fontFamily: 'inherit', outline: 'none',
  }
  const labelStyle = { fontSize: 11, letterSpacing: '0.1em', color: '#888', display: 'block', marginBottom: 6 }

  if (!spot) return <div style={{ padding: 80, textAlign: 'center', color: '#ccc' }}>読み込み中...</div>

  if (step === 'confirm') return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 20px 80px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>投稿内容の確認</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>{spot.name}</p>

      <div style={{ background: '#fff8ed', border: '1px solid #fcd34d', borderRadius: 8, padding: '14px 16px', marginBottom: 28 }}>
        <p style={{ fontSize: 12, color: '#92400e', lineHeight: 1.7, margin: 0 }}>
          投稿内容はユーザーの任意情報です。正確性を保証するものではありません。
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32, fontSize: 14, color: '#333' }}>
        <div><span style={{ color: '#888', fontSize: 12 }}>混雑度: </span>
          <span style={{ color: CONGESTION_COLORS[congestion], fontWeight: 600 }}>{CONGESTION_LABELS[congestion]}</span>
        </div>
        {waitMinutes && <div><span style={{ color: '#888', fontSize: 12 }}>待ち時間: </span>{waitMinutes}分</div>}
        {actualKw && <div><span style={{ color: '#888', fontSize: 12 }}>実測速度: </span>{actualKw}kW</div>}
        {nearbyFacilities && <div><span style={{ color: '#888', fontSize: 12 }}>周辺施設: </span>{nearbyFacilities}</div>}
        {parkingInfo && <div><span style={{ color: '#888', fontSize: 12 }}>駐車場: </span>{parkingInfo}</div>}
        {body && <div><span style={{ color: '#888', fontSize: 12 }}>コメント: </span>{body}</div>}
        {photos.length > 0 && <div><span style={{ color: '#888', fontSize: 12 }}>写真: </span>{photos.length}枚</div>}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => setStep('form')} style={{
          flex: 1, padding: '13px 0', border: '1px solid #ddd', borderRadius: 6,
          fontSize: 14, cursor: 'pointer', background: 'transparent', fontFamily: 'inherit',
        }}>
          修正する
        </button>
        <button onClick={handleSubmit} disabled={submitting} style={{
          flex: 2, padding: '13px 0', background: '#111', color: '#fff', border: 'none',
          borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer',
          opacity: submitting ? 0.5 : 1,
        }}>
          {submitting ? '投稿中...' : '投稿する'}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 20px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#aaa', marginBottom: 8 }}>WRITE REVIEW</p>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>口コミを書く</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 32 }}>{spot.name}</p>

      {/* 禁止事項 */}
      <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, padding: '14px 16px', marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 8 }}>投稿禁止事項</p>
        {RULES.map(r => (
          <p key={r} style={{ fontSize: 11, color: '#888', margin: '2px 0', paddingLeft: 10 }}>・{r}</p>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <label style={labelStyle}>ニックネーム（任意）</label>
          <input value={authorName} onChange={e => setAuthorName(e.target.value)}
            placeholder="匿名" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>混雑度 *</label>
          <input type="range" min={1} max={5} value={congestion}
            onChange={e => setCongestion(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: CONGESTION_COLORS[congestion] }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginTop: 2 }}>
            {['ガラガラ','すいてる','ふつう','やや混雑','満車'].map(l => <span key={l}>{l}</span>)}
          </div>
          <p style={{ textAlign: 'center', marginTop: 8, fontWeight: 600, color: CONGESTION_COLORS[congestion] }}>
            {CONGESTION_LABELS[congestion]}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>待ち時間（分）</label>
            <input type="number" value={waitMinutes} onChange={e => setWaitMinutes(e.target.value)}
              placeholder="0" min={0} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>実測速度（kW）</label>
            <input type="number" step="0.1" value={actualKw} onChange={e => setActualKw(e.target.value)}
              placeholder="例: 245.5" min={0} style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>周辺施設メモ</label>
          <input value={nearbyFacilities} onChange={e => setNearbyFacilities(e.target.value)}
            placeholder="例: イオン・スターバックス・トイレあり" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>駐車場情報</label>
          <input value={parkingInfo} onChange={e => setParkingInfo(e.target.value)}
            placeholder="例: 最初の1時間無料" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>コメント</label>
          <textarea value={body} onChange={e => setBody(e.target.value)}
            placeholder="充電体験のくわしい感想を書いてください..." rows={4}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
        </div>

        <div>
          <label style={labelStyle}>写真（最大5枚）</label>
          <input type="file" accept="image/*" multiple onChange={handlePhotoChange}
            style={{ fontSize: 13, color: '#555' }} />
          {photos.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {photos.map((f, i) => (
                <img key={i} src={URL.createObjectURL(f)} alt=""
                  style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 4 }} />
              ))}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>訪問日時</label>
          <input type="datetime-local" value={visitedAt} onChange={e => setVisitedAt(e.target.value)}
            style={inputStyle} />
        </div>

        <div style={{ background: '#fef9ec', border: '1px solid #fde68a', borderRadius: 6, padding: '10px 14px' }}>
          <p style={{ fontSize: 11, color: '#78350f', lineHeight: 1.7, margin: 0 }}>
            ※ 充電速度・混雑情報はユーザーの実測値です。条件により異なる場合があります。
          </p>
        </div>

        <button onClick={() => setStep('confirm')}
          style={{
            padding: '13px 0', background: '#111', color: '#fff', border: 'none',
            borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>
          確認画面へ
        </button>
      </div>
    </div>
  )
}
