'use client'
import { useEffect, useState } from 'react'

interface XPBarProps {
  orderDate: string | null
  vinDate: string | null
  docsDate: string | null
  deliveryDate: string | null
  model: string
  color?: string | null
}

const STAGES = [
  { key: 'order', label: '注文', xp: 10 },
  { key: 'vin', label: 'VIN', xp: 40 },
  { key: 'docs', label: '書類', xp: 70 },
  { key: 'delivery', label: '納車', xp: 100 },
]

const MODEL_ILLUST: Record<string, string> = {
  'Model Y':  '/illust-model-y.png',
  'Model YL': '/illust-model-yl.png',
  'Model 3':  '/illust-model-3.png',
  'Model X':  '/illust-model-x.png',
}

// カラー名 → CSS filter（グレーのピクセルアートに色を重ねる）
const COLOR_FILTER: Record<string, string> = {
  'ステルスグレー':     'none',
  'ダイヤモンドブラック': 'brightness(0.35) contrast(1.2)',
  'グレイシャーブルー':  'hue-rotate(175deg) saturate(1.8) brightness(1.6)',
  'パールホワイト':     'brightness(2.8) saturate(0.15)',
  'クイックシルバー':   'brightness(1.7) saturate(0.2)',
  'ウルトラレッド':    'hue-rotate(310deg) saturate(4) brightness(1.1)',
  'マリンブルー':      'hue-rotate(210deg) saturate(3) brightness(0.9)',
}

export default function XPBar({ orderDate, vinDate, docsDate, deliveryDate, model, color }: XPBarProps) {
  const xp =
    deliveryDate ? 100 :
    docsDate ? 70 :
    vinDate ? 40 :
    orderDate ? 10 : 0

  const [displayXp, setDisplayXp] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setDisplayXp(xp), 100)
    return () => clearTimeout(timer)
  }, [xp])

  const illust = MODEL_ILLUST[model] || '/illust-model-3.png'
  const colorFilter = (color && COLOR_FILTER[color]) ? COLOR_FILTER[color] : 'none'
  const level = xp === 100 ? 'MAX' : xp >= 70 ? '3' : xp >= 40 ? '2' : '1'
  const neonColor = xp === 100 ? '#39FF14' : xp >= 70 ? '#00FFFF' : xp >= 40 ? '#FF00FF' : '#C0C0C0'

  return (
    <div style={{ marginTop: 12, padding: '10px 0 0' }}>
      <style>{`
        @keyframes xpGrow { from { width: 0% } }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#404040' }}>
          LVL {level}
        </span>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: neonColor }}>
          {xp} XP
        </span>
      </div>

      {/* XPバー + 車（ラッパー） */}
      <div style={{ position: 'relative', paddingTop: 44 }}>
        {/* 車イラスト（バーの上に隙間を空けて配置） */}
        <img
          src={illust}
          alt={model}
          style={{
            position: 'absolute',
            bottom: 18,
            left: `clamp(0px, calc(${displayXp}% - 20px), calc(100% - 40px))`,
            height: 36,
            imageRendering: 'pixelated',
            mixBlendMode: 'screen',
            filter: colorFilter,
            zIndex: 2,
            transition: 'left 0.5s ease, filter 0.3s ease',
          }}
        />
        {/* XPバー */}
        <div style={{ position: 'relative', height: 14, background: '#1A1A1A', border: `1px solid ${neonColor}40` }}>
          <div style={{
            height: '100%',
            width: `${displayXp}%`,
            background: neonColor,
            transition: 'width 0.5s ease',
            boxShadow: `0 0 8px ${neonColor}60`,
          }} />
        </div>
      </div>

      {/* ステージラベル */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {STAGES.map(s => {
          const done = xp >= s.xp
          return (
            <span key={s.key} style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: 6,
              color: done ? neonColor : '#2A2A2A',
            }}>
              {s.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
