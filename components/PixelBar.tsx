export default function PixelBar() {
  const SIZE = 44
  const img = (src: string) => ({
    height: SIZE, imageRendering: 'pixelated' as const,
    objectFit: 'contain' as const, mixBlendMode: 'screen' as const,
  })
  return (
    <div style={{
      borderTop: '2px solid #C0C0C0',
      background: '#0A0A0A',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 16,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <img src="/illust-optimus.png" alt="" style={img('/illust-optimus.png')} />
        <img src="/illust-model-3.png" alt="" style={img('/illust-model-3.png')} />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <img src="/illust-model-x.png" alt="" style={img('/illust-model-x.png')} />
        <img src="/illust-cybertruck.png" alt="" style={img('/illust-cybertruck.png')} />
        <img src="/illust-mascot.png" alt="" style={img('/illust-mascot.png')} />
      </div>
    </div>
  )
}
