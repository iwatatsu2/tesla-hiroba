'use client'

import Link from 'next/link'
import DeliveryPage from './delivery/page'

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: '#0A0A0A',
        borderBottom: '2px solid #C0C0C0',
        padding: '64px 20px 48px', textAlign: 'center',
      }}>
        <img src="/illust-optimus.png" alt="" style={{ position: 'absolute', top: 8, left: 8, height: 56, imageRendering: 'pixelated', objectFit: 'contain', mixBlendMode: 'screen' }} />
        <img src="/illust-cybertruck.png" alt="" style={{ position: 'absolute', top: 8, right: 8, height: 56, imageRendering: 'pixelated', objectFit: 'contain', mixBlendMode: 'screen' }} />
        <img src="/illust-model-3.png" alt="" style={{ position: 'absolute', bottom: 8, left: 8, height: 56, imageRendering: 'pixelated', objectFit: 'contain', mixBlendMode: 'screen' }} />
        <img src="/illust-model-x.png" alt="" style={{ position: 'absolute', bottom: 8, right: 8, height: 56, imageRendering: 'pixelated', objectFit: 'contain', mixBlendMode: 'screen' }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#404040', marginBottom: 20, letterSpacing: '0.2em' }}>// TESLA OWNERS COMMUNITY</p>
          <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 'clamp(24px,5vw,48px)', color: '#C0C0C0', marginBottom: 4, lineHeight: 1.2, letterSpacing: '0.1em' }}>
            TSLA
          </h1>
          <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 'clamp(14px,3vw,28px)', color: '#00FFFF', marginBottom: 24, letterSpacing: '0.15em' }}>
            PARK
          </h2>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#404040', marginBottom: 32, letterSpacing: '0.05em' }}>
            CHARGE · DELIVERY · SHARE
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/delivery/new" style={{
              fontFamily: "'Press Start 2P', monospace",
              padding: '12px 24px', background: '#C0C0C0', color: '#000',
              border: '2px solid #C0C0C0', fontSize: 9, textDecoration: 'none',
              transition: '120ms',
            }}>
              &gt; REPORT
            </Link>
            <Link href="/feed" style={{
              fontFamily: "'Press Start 2P', monospace",
              padding: '12px 20px', background: 'transparent', color: '#00FFFF',
              border: '2px solid #00FFFF', fontSize: 9, textDecoration: 'none',
              transition: '120ms',
            }}>
              &gt; FEED
            </Link>
          </div>
        </div>
      </section>

      <DeliveryPage />
    </>
  )
}
