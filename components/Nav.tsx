'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

const MENU = [
  { href: '/', label: '掲示板', match: (p: string) => p === '/' || p.startsWith('/posts') || p.startsWith('/new') },
  { href: '/delivery', label: '納車トラッカー', match: (p: string) => p.startsWith('/delivery') },
  { href: '/map', label: '充電マップ', match: (p: string) => p.startsWith('/map') || p.startsWith('/spots') },
  { href: '/news', label: 'ニュース', match: (p: string) => p.startsWith('/news') },
]

export default function Nav() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(query.trim() ? `/?q=${encodeURIComponent(query.trim())}` : '/')
  }

  const isBoard = pathname === '/' || pathname.startsWith('/posts') || pathname.startsWith('/new')

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      height: 60, background: 'rgba(13,13,13,0.95)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
    }}>
      {/* Logo */}
      <Link href="/" style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.2em', color: '#F0F0F0', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
        TSLA<span style={{ color: '#CC0000' }}>PARK</span>
      </Link>

      {/* Desktop menu */}
      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        {MENU.map(m => {
          const active = m.match(pathname)
          return (
            <Link key={m.href} href={m.href} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, textDecoration: 'none',
              color: active ? '#F0F0F0' : '#888', fontWeight: active ? 600 : 400,
              background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
              borderBottom: active ? '2px solid #CC0000' : '2px solid transparent',
              transition: '150ms ease',
            }}>
              {m.label}
            </Link>
          )
        })}
      </div>

      {/* Search (board only) */}
      {isBoard && (
        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 300 }}>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="キーワード検索..."
            style={{ width: '100%', padding: '7px 12px', fontSize: 13, outline: 'none', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#F0F0F0' }}
          />
        </form>
      )}

      {/* Right */}
      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
        <Link href="/new" style={{
          padding: '7px 16px', background: '#CC0000', color: '#fff',
          borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none',
          letterSpacing: '0.04em', transition: '150ms ease',
        }}>
          投稿する
        </Link>
      </div>
    </nav>
  )
}
