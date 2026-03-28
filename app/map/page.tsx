'use client'
import dynamic from 'next/dynamic'

const MapClient = dynamic(() => import('@/components/MapClient'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 14 }}>
      地図を読み込み中...
    </div>
  ),
})

export default function MapPage() {
  return <MapClient />
}
