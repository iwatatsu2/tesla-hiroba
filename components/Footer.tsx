export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 20px', background: '#0D0D0D', marginTop: 64 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <p style={{ fontSize: 10, letterSpacing: '0.15em', color: '#444', marginBottom: 10 }}>DISCLAIMER</p>
        <p style={{ fontSize: 11, color: '#555', lineHeight: 1.9, maxWidth: 720, marginBottom: 16 }}>
          本サービスに掲載されている情報（充電スポット・口コミ・実測値・納期情報・株価等）はユーザーの任意投稿または外部APIによる参考情報であり、正確性・最新性を保証しません。情報の利用により生じた損害について当サービスは責任を負いません。各種情報は公式ソースでご確認ください。
        </p>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, letterSpacing: '0.12em', color: '#444', marginBottom: 8 }}>禁止事項</p>
          {['車両・部品・グッズの売買・譲渡', 'リファーラルコード・クーポンの売買・交換', '特定個人・企業への誹謗中傷', '虚偽・誇大な情報の投稿', '個人情報の公開', '政治・宗教に関する勧誘・主張'].map(r => (
            <span key={r} style={{ display: 'inline-block', fontSize: 10, color: '#444', marginRight: 16 }}>・{r}</span>
          ))}
        </div>
        <p style={{ fontSize: 10, color: '#333' }}>© 2026 TSLA PARK — Not affiliated with Tesla, Inc.</p>
      </div>
    </footer>
  )
}
