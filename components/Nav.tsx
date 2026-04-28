'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MENU = [
  { href: '/delivery', label: 'DELIVERY', match: (p: string) => p === '/' || p.startsWith('/delivery') },
{ href: '/aliexpress', label: 'ALIEX', match: (p: string) => p.startsWith('/aliexpress') },
  { href: '/mobile-connector', label: 'MC', match: (p: string) => p.startsWith('/mobile-connector') },
  { href: '/news', label: 'NEWS', match: (p: string) => p.startsWith('/news') },
{ href: '/referral', label: 'REFER', match: (p: string) => p.startsWith('/referral') },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      height: 60, background: 'rgba(10,10,10,0.97)',
      borderBottom: '2px solid #C0C0C0',
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16,
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: '#C0C0C0', letterSpacing: '0.1em' }}>TSLA</span>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#00FFFF', letterSpacing: '0.15em' }}>PARK</span>
      </Link>

      {/* Divider */}
      <div style={{ width: 2, height: 32, background: '#404040', flexShrink: 0 }} />

      {/* Menu */}
      <div style={{ display: 'flex', gap: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any, scrollbarWidth: 'none' as any, flex: 1, minWidth: 0 }}>
        {MENU.map(m => {
          const active = m.match(pathname)
          return (
            <Link key={m.href} href={m.href} style={{
              fontFamily: "'Press Start 2P', monospace",
              padding: '4px 10px', fontSize: 8,
              textDecoration: 'none',
              color: active ? '#00FFFF' : '#808080',
              borderBottom: `2px solid ${active ? '#00FFFF' : 'transparent'}`,
              whiteSpace: 'nowrap', flexShrink: 0,
              transition: '120ms',
            }}>
              {active ? '> ' : ''}{m.label}
            </Link>
          )
        })}
      </div>

      {/* X link + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexShrink: 0 }}>
        <a href="https://x.com/tslapark" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', color: '#808080', transition: '150ms' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00FFFF')}
          onMouseLeave={e => (e.currentTarget.style.color = '#808080')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
        <Link href="/profile" style={{
          display: 'flex', alignItems: 'center', color: '#808080', transition: '150ms',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00FFFF')}
          onMouseLeave={e => (e.currentTarget.style.color = '#808080')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </Link>
      </div>
    </nav>
  )
}
