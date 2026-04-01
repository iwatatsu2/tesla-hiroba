'use client'
export default function Footer() {
  return (
    <footer style={{ borderTop: '2px solid #C0C0C0', padding: '32px 20px', background: '#0A0A0A', marginTop: 64 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* X follow banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28, padding: '16px 20px', border: '2px solid #2A2A2A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#C0C0C0">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <div>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#C0C0C0', marginBottom: 4 }}>@tslapark</p>
              <p style={{ fontSize: 11, color: '#404040' }}>最新情報・納車速報をXでも発信中</p>
            </div>
          </div>
          <a href="https://x.com/tslapark" target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: "'Press Start 2P', monospace", padding: '8px 16px', background: '#C0C0C0', color: '#000', border: '2px solid #C0C0C0', fontSize: 8, textDecoration: 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#00FFFF'; (e.currentTarget as HTMLElement).style.borderColor = '#00FFFF' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#C0C0C0'; (e.currentTarget as HTMLElement).style.borderColor = '#C0C0C0' }}
          >
            &gt; FOLLOW
          </a>
        </div>

        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#2A2A2A', marginBottom: 10 }}>// DISCLAIMER</p>
        <p style={{ fontSize: 11, color: '#404040', lineHeight: 1.9, maxWidth: 720, marginBottom: 16 }}>
          本サービスに掲載されている情報はユーザーの任意投稿または外部APIによる参考情報であり、正確性・最新性を保証しません。情報の利用により生じた損害について当サービスは責任を負いません。
        </p>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#2A2A2A', marginBottom: 8 }}>// PROHIBITED</p>
          {['売買・譲渡', 'リファーラルコード', '誹謗中傷', '虚偽情報', '個人情報', '政治・宗教', '外部リンク'].map(r => (
            <span key={r} style={{ display: 'inline-block', fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#2A2A2A', marginRight: 16, marginBottom: 6 }}>■{r}</span>
          ))}
        </div>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#2A2A2A' }}>© 2026 TSLA PARK — NOT AFFILIATED WITH TESLA INC.</p>
      </div>
    </footer>
  )
}
