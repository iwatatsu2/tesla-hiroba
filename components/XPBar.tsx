'use client'
import { useEffect, useRef, useState } from 'react'

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

// Model Y: カラー別画像マッピング
const MODEL_Y_COLOR_ILLUST: Record<string, string> = {
  'パールホワイト':      '/illust-model-y-white.png',
  'ダイヤモンドブラック': '/illust-model-y-black.png',
  'ステルスグレー':      '/illust-model-y-grey.png',
  'クイックシルバー':    '/illust-model-y-grey.png',  // グレー共用
  'ウルトラレッド':      '/illust-model-y-red.png',
  'グレイシャーブルー':  '/illust-model-y-blue.png',
  'マリンブルー':        '/illust-model-y-blue.png',  // 青共用
}

// Model YL: カラー別画像マッピング
const MODEL_YL_COLOR_ILLUST: Record<string, string> = {
  'パールホワイト':      '/illust-model-yl-white.png',
  'ダイヤモンドブラック': '/illust-model-yl-black.png',
  'ステルスグレー':      '/illust-model-yl-grey.png',
  'クイックシルバー':    '/illust-model-yl-silver.png',
  'ウルトラレッド':      '/illust-model-yl-red.png',
  'グレイシャーブルー':  '/illust-model-yl-blue.png',
  'マリンブルー':        '/illust-model-yl-blue.png',  // 青共用
}

// カラー名 → [R, G, B] の色相（Model Y以外で使用）
const COLOR_TINT: Record<string, [number, number, number] | null> = {
  'ステルスグレー':      null,              // 変換なし
  'ダイヤモンドブラック': [20, 20, 25],      // 暗くする（全体）
  'グレイシャーブルー':  [130, 185, 215],   // 空色
  'パールホワイト':      [255, 255, 255],   // 純白
  'クイックシルバー':    [195, 200, 205],   // 明るいシルバー
  'ウルトラレッド':      [200, 40, 40],     // 赤
  'マリンブルー':        [30, 70, 140],     // 紺
}

// 輝度50未満 = ホイール・タイヤ・影 → 変換しない
// 輝度50〜220 = 車体グレー → 色変換
// 輝度220超 = ハイライト → 変換しない
function applyBodyTint(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  tint: [number, number, number] | null
) {
  const W = img.naturalWidth
  const H = img.naturalHeight
  ctx.clearRect(0, 0, W, H)
  ctx.drawImage(img, 0, 0)

  if (!tint) return  // ステルスグレーはそのまま

  const imageData = ctx.getImageData(0, 0, W, H)
  const data = imageData.data
  const [tr, tg, tb] = tint

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3]
    if (a < 10) continue  // 透明ピクセルはスキップ

    const brightness = (r + g + b) / 3

    // 暗いピクセル（ホイール・タイヤ・影）: 輝度60未満 → 手をつけない
    if (brightness < 60) continue

    // ハイライト（ヘッドライト等）: 輝度220超 → 手をつけない
    if (brightness > 220) continue

    // 車体部分: 元の輝度を保ちながらターゲット色に寄せる
    const isWhite = tr >= 250 && tg >= 250 && tb >= 250
    const t = isWhite ? 0.85 : 0.65
    const ratio = isWhite ? Math.max(brightness / 128, 1.2) : brightness / 128
    data[i]   = Math.round(r * (1-t) + tr * ratio * t)
    data[i+1] = Math.round(g * (1-t) + tg * ratio * t)
    data[i+2] = Math.round(b * (1-t) + tb * ratio * t)
  }

  ctx.putImageData(imageData, 0, 0)
}

interface CarCanvasProps {
  src: string
  color: string | null | undefined
  height: number
  left: string
  transition: string
}

function CarCanvas({ src, color, height, left, transition }: CarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [naturalSize, setNaturalSize] = useState({ w: 400, h: 200 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const tint = (color && COLOR_TINT[color] !== undefined) ? COLOR_TINT[color] : null
      applyBodyTint(ctx, img, tint)
    }
    img.src = src
  }, [src, color])

  const aspect = naturalSize.w / naturalSize.h
  const displayH = height
  const displayW = Math.round(displayH * aspect)

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        bottom: 30,
        left,
        height: displayH,
        width: displayW,
        imageRendering: 'pixelated',
        transition,
        zIndex: 2,
      }}
    />
  )
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

  // Model Y / Model YL はカラー別画像を使用、それ以外はcanvas色変換
  // Model YL は常にimg表示（色未指定時はデフォルト画像）
  const useColorImage =
    (model === 'Model YL') ||
    ((model === 'Model Y') && color && MODEL_Y_COLOR_ILLUST[color])
  const illust = model === 'Model YL'
    ? ((color && MODEL_YL_COLOR_ILLUST[color]) || '/illust-model-yl.png')
    : useColorImage
      ? MODEL_Y_COLOR_ILLUST[color!]
      : (MODEL_ILLUST[model] || '/illust-model-3.png')
  const level = xp === 100 ? 'MAX' : xp >= 70 ? '3' : xp >= 40 ? '2' : '1'
  const neonColor = xp === 100 ? '#39FF14' : xp >= 70 ? '#00FFFF' : xp >= 40 ? '#FF00FF' : '#C0C0C0'

  return (
    <div style={{ marginTop: 12, padding: '10px 0 0' }}>
      <style>{`
        @keyframes xpGrow { from { width: 0% } }
        @keyframes clearBlink { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }
        @keyframes clearPulse { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.05) } }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#404040' }}>LVL {level}</span>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: neonColor }}>{xp} XP</span>
      </div>

      {/* CLEAR!! 表示 */}
      {xp === 100 && (
        <div style={{
          textAlign: 'center', marginBottom: 8, padding: '10px 0',
          background: 'rgba(57,255,20,0.06)', border: '1px solid rgba(57,255,20,0.3)', borderRadius: 8,
          animation: 'clearPulse 2s ease infinite',
        }}>
          <span style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 18, color: '#39FF14',
            textShadow: '0 0 10px #39FF14, 0 0 20px #39FF1480',
            letterSpacing: '0.15em',
            animation: 'clearBlink 1.5s ease infinite',
          }}>
            CLEAR!!
          </span>
        </div>
      )}

      {/* XPバー + 車 */}
      <div style={{ position: 'relative', paddingTop: model === 'Model 3' ? 64 : 44 }}>
        {useColorImage ? (
          <img
            src={illust}
            alt={model}
            style={{
              position: 'absolute',
              bottom: 30,
              left: `clamp(0px, calc(${displayXp}% - 20px), calc(100% - 60px))`,
              height: 24,
              transition: 'left 0.5s ease',
              zIndex: 2,
            }}
          />
        ) : (
          <CarCanvas
            src={illust}
            color={color}
            height={model === 'Model 3' ? 72 : 36}
            left={model === 'Model 3' ? `clamp(0px, calc(${displayXp}% - 40px), calc(100% - 120px))` : `clamp(0px, calc(${displayXp}% - 20px), calc(100% - 60px))`}
            transition="left 0.5s ease"
          />
        )}
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
        {STAGES.map(s => (
          <span key={s.key} style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 6,
            color: xp >= s.xp ? neonColor : '#2A2A2A',
          }}>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
