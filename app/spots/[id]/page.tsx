'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, ChargingSpot, SpotReview, SpotPhoto, SPOT_TYPE_LABEL, CONGESTION_LABEL } from '@/lib/supabase'
import Link from 'next/link'

const CONGESTION_COLOR: Record<number, string> = {
  1: '#22c55e', 2: '#86efac', 3: '#fbbf24', 4: '#f97316', 5: '#ef4444',
}

function KwChart({ reviews }: { reviews: SpotReview[] }) {
  const byHour: Record<number, number[]> = {}
  reviews.forEach(r => {
    if (r.actual_kw && r.visited_at) {
      const h = new Date(r.visited_at).getHours()
      if (!byHour[h]) byHour[h] = []
      byHour[h].push(r.actual_kw)
    }
  })
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const avgs = hours.map(h => byHour[h] ? byHour[h].reduce((a, b) => a + b, 0) / byHour[h].length : 0)
  const maxVal = Math.max(...avgs, 1)

  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>時間帯別 実測充電速度（kW）</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80 }}>
        {avgs.map((v, h) => (
          <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{
              width: '100%', height: `${(v / maxVal) * 64}px`,
              background: v > 0 ? '#2563eb' : '#f0f0f0', borderRadius: 2,
              minHeight: v > 0 ? 4 : 0, transition: 'height 0.3s',
            }} title={v > 0 ? `${h}時: ${v.toFixed(0)}kW` : ''} />
            {h % 6 === 0 && <span style={{ fontSize: 8, color: '#bbb' }}>{h}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SpotPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [spot, setSpot] = useState<ChargingSpot | null>(null)
  const [reviews, setReviews] = useState<SpotReview[]>([])
  const [photos, setPhotos] = useState<SpotPhoto[]>([])
  const [sort, setSort] = useState<'new' | 'congestion'>('new')
  const [reportingId, setReportingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.from('charging_spots').select('*').eq('id', id).single()
      setSpot(s)
      const { data: r } = await supabase.from('spot_reviews').select('*').eq('spot_id', id).eq('reported', false)
      setReviews(r || [])
      const { data: p } = await supabase.from('spot_photos').select('*').eq('spot_id', id).order('created_at')
      setPhotos(p || [])
    }
    load()
  }, [id])

  const handleReport = async (reviewId: string) => {
    setReportingId(reviewId)
    await supabase.from('spot_reviews').update({ reported: true }).eq('id', reviewId)
    setReviews(prev => prev.filter(r => r.id !== reviewId))
    setReportingId(null)
  }

  if (!spot) return <div style={{ padding: 80, textAlign: 'center', color: '#ccc' }}>読み込み中...</div>

  const avgCongestion = reviews.length
    ? reviews.reduce((a, b) => a + b.congestion_level, 0) / reviews.length : null

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sort === 'new') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    return a.congestion_level - b.congestion_level
  })

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px' }}>
      <button onClick={() => router.back()}
        style={{ fontSize: 12, color: '#999', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, fontFamily: 'inherit' }}>
        ← 戻る
      </button>

      {/* 基本情報 */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, letterSpacing: '0.15em', color: '#888', marginBottom: 4 }}>
          {SPOT_TYPE_LABEL[spot.spot_type]}
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 6 }}>{spot.name}</h1>
        {spot.address && <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>{spot.address}</p>}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#444', marginBottom: 16 }}>
          {spot.max_kw && <span>⚡ 最大 {spot.max_kw}kW</span>}
          {spot.total_stalls && <span>🔌 {spot.total_stalls}台</span>}
          {spot.connector_type && <span>🔗 {spot.connector_type}</span>}
          {avgCongestion && (
            <span style={{ color: CONGESTION_COLOR[Math.round(avgCongestion)], fontWeight: 600 }}>
              混雑: {CONGESTION_LABEL[Math.round(avgCongestion)]}（平均）
            </span>
          )}
        </div>

        <div style={{ fontSize: 10, color: '#bbb', marginBottom: 16, lineHeight: 1.6 }}>
          ※ 混雑・充電速度情報はユーザーの実測値です。正確性を保証するものではありません。
        </div>

        <Link href={`/spots/${id}/review`}
          style={{ display: 'inline-block', padding: '10px 22px', background: '#111', color: '#fff',
            borderRadius: 6, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
          口コミを書く
        </Link>
      </div>

      {/* 写真ギャラリー */}
      {photos.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 14, letterSpacing: '0.1em', fontWeight: 600, marginBottom: 12 }}>写真</h2>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {photos.map(p => (
              <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                <img src={p.url} alt={p.caption || ''} style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 充電速度グラフ */}
      {reviews.some(r => r.actual_kw) && (
        <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '16px 20px', marginBottom: 36 }}>
          <KwChart reviews={reviews} />
        </div>
      )}

      {/* 口コミ一覧 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, letterSpacing: '0.1em', fontWeight: 600 }}>
            口コミ ({reviews.length}件)
          </h2>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            {(['new', 'congestion'] as const).map(s => (
              <button key={s} onClick={() => setSort(s)}
                style={{
                  padding: '5px 12px', fontSize: 11, border: `1px solid ${sort === s ? '#111' : '#e0e0e0'}`,
                  borderRadius: 4, cursor: 'pointer', background: sort === s ? '#111' : 'transparent',
                  color: sort === s ? '#fff' : '#666', fontFamily: 'inherit',
                }}>
                {s === 'new' ? '新着順' : '混雑少ない順'}
              </button>
            ))}
          </div>
        </div>

        {sortedReviews.length === 0 && (
          <p style={{ color: '#bbb', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
            まだ口コミがありません
          </p>
        )}

        {sortedReviews.map(r => (
          <div key={r.id} style={{ borderBottom: '1px solid #f0f0f0', padding: '20px 0' }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{r.author_name || '匿名'}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: CONGESTION_COLOR[r.congestion_level] }}>
                {CONGESTION_LABEL[r.congestion_level]}
              </span>
              {r.wait_minutes != null && <span style={{ fontSize: 12, color: '#666' }}>待ち {r.wait_minutes}分</span>}
              {r.actual_kw && (
                <span style={{ fontSize: 12, color: '#2563eb' }}>{r.actual_kw}kW実測
                  <span style={{ fontSize: 9, color: '#bbb', marginLeft: 4 }}>※参考値</span>
                </span>
              )}
              <span style={{ fontSize: 11, color: '#bbb', marginLeft: 'auto' }}>
                {r.visited_at ? new Date(r.visited_at).toLocaleDateString('ja-JP') : new Date(r.created_at).toLocaleDateString('ja-JP')}
              </span>
            </div>
            {r.nearby_facilities && <p style={{ fontSize: 13, color: '#555', margin: '4px 0' }}>周辺: {r.nearby_facilities}</p>}
            {r.parking_info && <p style={{ fontSize: 13, color: '#555', margin: '4px 0' }}>駐車場: {r.parking_info}</p>}
            {r.body && <p style={{ fontSize: 14, color: '#333', lineHeight: 1.7, margin: '8px 0 0' }}>{r.body}</p>}
            <button onClick={() => handleReport(r.id)} disabled={reportingId === r.id}
              style={{ marginTop: 8, fontSize: 10, color: '#bbb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {reportingId === r.id ? '通報中...' : '通報する'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
