'use client'

export default function XTimeline() {
  return (
    <div style={{ position: 'sticky', top: 80 }}>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#A0A0A0">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        <span style={{ fontSize: 12, color: '#666', letterSpacing: '0.05em' }}>@tslapark</span>
      </div>
      <a
        className="twitter-timeline"
        data-theme="dark"
        data-height="600"
        data-chrome="noheader nofooter noborders transparent"
        href="https://twitter.com/tslapark"
      >
        Tweets by tslapark
      </a>
      <a
        href="https://x.com/tslapark"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', marginTop: 12, padding: '9px 0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#E0E0E0', textAlign: 'center', textDecoration: 'none' }}
      >
        フォローする
      </a>
    </div>
  )
}
