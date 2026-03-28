'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, SpotType, SPOT_TYPE_LABEL } from '@/lib/supabase'

const CONNECTOR_TYPES = ['CCS2', 'CHAdeMO', 'J1772', 'Tesla独自', 'その他']

export default function NewSpot() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [spotType, setSpotType] = useState<SpotType>('supercharger')
  const [connectorType, setConnectorType] = useState('CCS2')
  const [maxKw, setMaxKw] = useState('')
  const [totalStalls, setTotalStalls] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [locating, setLocating] = useState(false)

  const getCurrentLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(pos => {
      setLat(pos.coords.latitude.toFixed(6))
      setLng(pos.coords.longitude.toFixed(6))
      setLocating(false)
    }, () => setLocating(false))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !lat || !lng) return
    setSubmitting(true)
    const { data, error } = await supabase.from('charging_spots').insert({
      name, address: address || null,
      lat: parseFloat(lat), lng: parseFloat(lng),
      spot_type: spotType, connector_type: connectorType,
      max_kw: maxKw ? parseInt(maxKw) : null,
      total_stalls: totalStalls ? parseInt(totalStalls) : null,
    }).select().single()
    if (data) router.push(`/spots/${data.id}`)
    else setSubmitting(false)
  }

  const inputStyle = {
    width: '100%', padding: '11px 13px', border: '1px solid #e8e8e8',
    borderRadius: 6, fontSize: 14, fontFamily: 'inherit', outline: 'none',
  }
  const labelStyle = { fontSize: 11, letterSpacing: '0.1em', color: '#888', display: 'block', marginBottom: 6 }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 20px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#aaa', marginBottom: 12 }}>ADD SPOT</p>
      <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 36 }}>充電スポットを追加</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <label style={labelStyle}>スポット名 *</label>
          <input value={name} onChange={e => setName(e.target.value)} required
            placeholder="例: Tesla スーパーチャージャー 渋谷" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>住所</label>
          <input value={address} onChange={e => setAddress(e.target.value)}
            placeholder="例: 東京都渋谷区..." style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>スポットタイプ *</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(['supercharger', 'destination', 'third_party'] as SpotType[]).map(t => (
              <label key={t} style={{
                padding: '9px 14px', border: `1px solid ${spotType === t ? '#111' : '#e8e8e8'}`,
                borderRadius: 6, cursor: 'pointer', fontSize: 13,
                background: spotType === t ? '#111' : 'transparent',
                color: spotType === t ? '#fff' : '#555',
              }}>
                <input type="radio" name="type" value={t} checked={spotType === t}
                  onChange={() => setSpotType(t)} style={{ display: 'none' }} />
                {SPOT_TYPE_LABEL[t]}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>コネクタタイプ</label>
          <select value={connectorType} onChange={e => setConnectorType(e.target.value)}
            style={{ ...inputStyle, background: '#fff' }}>
            {CONNECTOR_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>最大出力 (kW)</label>
            <input type="number" value={maxKw} onChange={e => setMaxKw(e.target.value)}
              placeholder="例: 250" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>充電台数</label>
            <input type="number" value={totalStalls} onChange={e => setTotalStalls(e.target.value)}
              placeholder="例: 8" style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>緯度 / 経度 *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" step="any" value={lat} onChange={e => setLat(e.target.value)}
              required placeholder="緯度 例: 35.6762" style={{ ...inputStyle, flex: 1 }} />
            <input type="number" step="any" value={lng} onChange={e => setLng(e.target.value)}
              required placeholder="経度 例: 139.6503" style={{ ...inputStyle, flex: 1 }} />
          </div>
          <button type="button" onClick={getCurrentLocation} disabled={locating}
            style={{ marginTop: 8, fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {locating ? '取得中...' : '📍 現在地から取得'}
          </button>
        </div>

        <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6, padding: '12px 14px' }}>
          <p style={{ fontSize: 11, color: '#888', lineHeight: 1.7 }}>
            ※ 緯度・経度はGoogleマップでスポットを右クリック→「この場所について」で確認できます。
          </p>
        </div>

        <button type="submit" disabled={submitting || !name || !lat || !lng}
          style={{
            padding: '13px 0', background: '#111', color: '#fff', border: 'none',
            borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer',
            opacity: submitting ? 0.5 : 1,
          }}>
          {submitting ? '追加中...' : 'スポットを追加する'}
        </button>
      </form>
    </div>
  )
}
