'use client'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase, ChargingSpot } from '@/lib/supabase'
import Link from 'next/link'

// Fix default icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const makeIcon = (color: string) => L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50% 50% 50% 0;
    background:${color};border:2px solid #fff;
    transform:rotate(-45deg);
    box-shadow:0 2px 6px rgba(0,0,0,0.35);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
})

const superchargerIcon = makeIcon('#e31937')
const destinationIcon = makeIcon('#2563eb')
const thirdPartyIcon = makeIcon('#16a34a')

function getIcon(type: string) {
  if (type === 'supercharger') return superchargerIcon
  if (type === 'destination') return destinationIcon
  return thirdPartyIcon
}

function LocationButton() {
  const map = useMap()
  const locate = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      map.flyTo([pos.coords.latitude, pos.coords.longitude], 14)
    })
  }
  return (
    <button
      onClick={locate}
      title="現在地"
      style={{
        position: 'absolute', bottom: 120, right: 12, zIndex: 1000,
        width: 40, height: 40, borderRadius: 8,
        background: '#fff', border: '1px solid #ccc',
        fontSize: 18, cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      }}
    >
      📍
    </button>
  )
}

const CONGESTION_COLOR = ['', '#22c55e', '#86efac', '#fbbf24', '#f97316', '#ef4444']

export default function MapClient() {
  const [spots, setSpots] = useState<ChargingSpot[]>([])

  useEffect(() => {
    async function load() {
      const { data: spotsData } = await supabase.from('charging_spots').select('*')
      if (!spotsData) return

      const { data: reviews } = await supabase
        .from('spot_reviews')
        .select('spot_id, congestion_level')
        .eq('reported', false)

      const reviewMap: Record<string, number[]> = {}
      reviews?.forEach(r => {
        if (!reviewMap[r.spot_id]) reviewMap[r.spot_id] = []
        reviewMap[r.spot_id].push(r.congestion_level)
      })

      const enriched = spotsData.map(s => ({
        ...s,
        review_count: reviewMap[s.id]?.length || 0,
        avg_congestion: reviewMap[s.id]?.length
          ? reviewMap[s.id].reduce((a, b) => a + b, 0) / reviewMap[s.id].length
          : null,
      }))
      setSpots(enriched)
    }
    load()
  }, [])

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 64px)', width: '100%' }}>
      {/* 凡例 */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 1000,
        background: 'rgba(255,255,255,0.95)', borderRadius: 8, padding: '10px 14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 5,
      }}>
        {[
          { color: '#e31937', label: 'スーパーチャージャー' },
          { color: '#2563eb', label: 'デスティネーション' },
          { color: '#16a34a', label: 'その他' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
            <span>{l.label}</span>
          </div>
        ))}
      </div>

      {/* スポット追加ボタン */}
      <Link href="/spots/new" style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, background: '#111', color: '#fff', padding: '11px 24px',
        borderRadius: 24, fontSize: 13, fontWeight: 500, textDecoration: 'none',
        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
      }}>
        ＋ スポットを追加
      </Link>

      <MapContainer
        center={[35.6762, 139.6503]}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <LocationButton />
        <MarkerClusterGroup chunkedLoading>
          {spots.map(spot => (
            <Marker
              key={spot.id}
              position={[spot.lat, spot.lng]}
              icon={getIcon(spot.spot_type)}
            >
              <Popup>
                <div style={{ fontFamily: 'sans-serif', minWidth: 200 }}>
                  <p style={{ fontSize: 11, color: '#888', margin: '0 0 2px' }}>
                    {spot.spot_type === 'supercharger' ? 'スーパーチャージャー'
                      : spot.spot_type === 'destination' ? 'デスティネーション' : 'その他'}
                  </p>
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>{spot.name}</h3>
                  {spot.address && <p style={{ fontSize: 12, color: '#666', margin: '0 0 4px' }}>{spot.address}</p>}
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#444', margin: '4px 0 10px' }}>
                    {spot.max_kw && <span>最大 {spot.max_kw}kW</span>}
                    {spot.total_stalls && <span>{spot.total_stalls}台</span>}
                    {spot.review_count ? (
                      <span style={{ color: CONGESTION_COLOR[Math.round(spot.avg_congestion || 3)] }}>
                        口コミ {spot.review_count}件
                      </span>
                    ) : <span style={{ color: '#bbb' }}>口コミなし</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={`/spots/${spot.id}`}
                      style={{ flex: 1, padding: '7px 0', background: '#111', color: '#fff',
                        borderRadius: 4, fontSize: 12, textAlign: 'center', textDecoration: 'none' }}>
                      詳細を見る
                    </a>
                    <a href={`/spots/${spot.id}/review`}
                      style={{ flex: 1, padding: '7px 0', border: '1px solid #ddd', color: '#333',
                        borderRadius: 4, fontSize: 12, textAlign: 'center', textDecoration: 'none' }}>
                      口コミを書く
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}
