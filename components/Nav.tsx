'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

const MENU = [
  { href: '/', label: '掲示板', match: (p: string) => p === '/' || p.startsWith('/posts') || p.startsWith('/new') },
  { href: '/delivery', label: '納車', match: (p: string) => p.startsWith('/delivery') },
  { href: '/map', label: '充電', match: (p: string) => p.startsWith('/map') || p.startsWith('/spots') },
  { href: '/news', label: 'ニュース', match: (p: string) => p.startsWith('/news') },
  { href: '/videos', label: '動画', match: (p: string) => p.startsWith('/videos') },
]

export default function Nav() {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const isBoard = pathname === '/' || pathname.startsWith('/posts') || pathname.startsWith('/new')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(query.trim() ? `/?q=${encodeURIComponent(query.trim())}` : '/')
  }

  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, height: 60, background: 'rgba(13,13,13,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
      <Link href="/" style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.2em', color: '#F0F0F0', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
        TSLA<span style={{ color: '#CC0000' }}>PARK</span>
      </Link>

      <div style={{ display: 'flex', gap: 0, flexShrink: 0 }}>
        {MENU.map(m => {
          const active = m.match(pathname)
          return (
            <Link key={m.href} href={m.href} style={{ padding: '5px 10px', fontSize: 12, textDecoration: 'none', color: active ? '#F0F0F0' : '#666', fontWeight: active ? 600 : 400, borderBottom: `2px solid ${active ? '#CC0000' : 'transparent'}`, transition: '150ms ease', whiteSpace: 'nowrap' }}>
              {m.label}
            </Link>
          )
        })}
      </div>

      {isBoard && (
        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 280 }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="検索..." style={{ width: '100%', padding: '6px 12px', fontSize: 12, outline: 'none', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#F0F0F0', fontFamily: 'inherit' }} />
        </form>
      )}

      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
        <Link href="/new" style={{ padding: '7px 14px', background: '#CC0000', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
          投稿
        </Link>
      </div>
    </nav>
  )
}
