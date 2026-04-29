'use client'
import { useState, useEffect } from 'react'

export default function InstallBanner() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // 既にスタンドアロンで起動中なら表示しない
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if ((navigator as any).standalone) return

    // 既に「閉じた」ことがある場合は7日間非表示
    const dismissed = localStorage.getItem('install-banner-dismissed')
    if (dismissed && Date.now() - Number(dismissed) < 7 * 86400000) return

    const ua = navigator.userAgent
    const ios = /iPhone|iPad|iPod/.test(ua)
    setIsIOS(ios)

    if (ios) {
      // iOSはbeforeinstallpromptがないので直接表示
      setShow(true)
    } else {
      // Android/Chrome: beforeinstallprompt イベントを待つ
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setShow(true)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    }
    setShow(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('install-banner-dismissed', String(Date.now()))
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', bottom: 72, left: 12, right: 12, zIndex: 9999,
      background: 'linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 100%)',
      border: '1px solid rgba(0,255,255,0.2)',
      borderRadius: 16, padding: '16px 18px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 12px rgba(0,255,255,0.08)',
      maxWidth: 420, margin: '0 auto',
    }}>
      <button onClick={handleDismiss} style={{
        position: 'absolute', top: 8, right: 12,
        background: 'none', border: 'none', color: '#555', fontSize: 18,
        cursor: 'pointer', fontFamily: 'inherit', padding: '4px',
      }}>✕</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: '#0A0A0A', border: '1px solid rgba(0,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: '#00FFFF', fontFamily: "'Press Start 2P', monospace",
          letterSpacing: '-0.05em', flexShrink: 0,
        }}>T</div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0', marginBottom: 2 }}>TSLA PARKをホーム画面に追加</p>
          <p style={{ fontSize: 11, color: '#888' }}>アプリのようにすぐアクセスできます</p>
        </div>
      </div>

      {isIOS ? (
        <div style={{
          background: 'rgba(0,255,255,0.06)', borderRadius: 10, padding: '12px 14px',
          fontSize: 12, color: '#A0A0A0', lineHeight: 1.8,
        }}>
          <span style={{ color: '#00FFFF', fontWeight: 600 }}>追加方法：</span><br />
          ① 画面下の <span style={{ display: 'inline-block', padding: '1px 6px', background: '#242424', borderRadius: 4, fontSize: 13 }}>📤</span> 共有ボタンをタップ<br />
          ② 「<span style={{ color: '#F0F0F0', fontWeight: 600 }}>ホーム画面に追加</span>」を選択
        </div>
      ) : (
        <button onClick={handleInstall} style={{
          width: '100%', padding: '12px 0',
          background: '#00FFFF', color: '#000', border: 'none',
          borderRadius: 10, fontSize: 14, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          ホーム画面に追加する
        </button>
      )}
    </div>
  )
}
