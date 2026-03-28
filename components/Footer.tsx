export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid #f0f0f0', padding: '32px 24px',
      background: '#fafafa', marginTop: 48,
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, letterSpacing: '0.15em', color: '#aaa', marginBottom: 8 }}>DISCLAIMER</p>
          <p style={{ fontSize: 11, color: '#999', lineHeight: 1.8, maxWidth: 720 }}>
            本サービスに掲載されている充電スポット情報・口コミ・実測値は、ユーザーが任意で投稿した情報であり、
            正確性・最新性を保証するものではありません。情報の利用により生じたいかなる損害についても、
            当サービスは責任を負いません。充電設備の利用にあたっては、各施設の公式情報をご確認ください。
          </p>
        </div>
        <p style={{ fontSize: 10, color: '#bbb' }}>© 2026 TSLA PARK</p>
      </div>
    </footer>
  )
}
