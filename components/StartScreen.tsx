'use client'
import { useEffect, useState } from 'react'

export default function StartScreen() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('tsla_start_seen')) {
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    setFading(true)
    setTimeout(() => {
      localStorage.setItem('tsla_start_seen', 'true')
      setVisible(false)
    }, 800)
  }

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes blink2 { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes fadeOut { from{opacity:1} to{opacity:0} }
        .press-blink { animation: blink2 1s step-end infinite; }
        .start-fade { animation: fadeOut 0.8s ease forwards; }
      `}</style>
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#000',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          animation: fading ? 'fadeOut 0.8s ease forwards' : 'none',
        }}
      >
        {/* ピクセルアート背景装飾 */}
        <img src="/illust-model-y.png" alt="" style={{ position: 'absolute', bottom: 40, left: 24, height: 64, imageRendering: 'pixelated', mixBlendMode: 'screen', opacity: 0.6 }} />
        <img src="/illust-cybertruck.png" alt="" style={{ position: 'absolute', bottom: 40, right: 24, height: 64, imageRendering: 'pixelated', mixBlendMode: 'screen', opacity: 0.6 }} />
        <img src="/illust-optimus.png" alt="" style={{ position: 'absolute', top: 40, left: 24, height: 72, imageRendering: 'pixelated', mixBlendMode: 'screen', opacity: 0.4 }} />
        <img src="/illust-mascot.png" alt="" style={{ position: 'absolute', top: 40, right: 24, height: 72, imageRendering: 'pixelated', mixBlendMode: 'screen', opacity: 0.4 }} />

        {/* メインテキスト */}
        <div style={{ textAlign: 'center', userSelect: 'none' }}>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 'clamp(28px,7vw,56px)', color: '#C0C0C0', letterSpacing: '0.1em', marginBottom: 8, lineHeight: 1.2 }}>
            TSLA
          </p>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 'clamp(18px,4vw,32px)', color: '#00FFFF', letterSpacing: '0.15em', marginBottom: 56, lineHeight: 1.2 }}>
            PARK
          </p>
          <p className="press-blink" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 'clamp(10px,2.5vw,16px)', color: '#39FF14', letterSpacing: '0.2em' }}>
            PRESS START
          </p>
        </div>

        {/* SKIP */}
        <button
          onClick={e => { e.stopPropagation(); dismiss() }}
          style={{
            position: 'absolute', bottom: 24, right: 24,
            fontFamily: "'Press Start 2P', monospace", fontSize: 9,
            color: '#404040', background: 'none', border: 'none', cursor: 'pointer',
            letterSpacing: '0.1em',
          }}
        >
          SKIP &gt;
        </button>
      </div>
    </>
  )
}
