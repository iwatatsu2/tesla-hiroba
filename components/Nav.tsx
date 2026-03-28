'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

export default function Nav() {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/?q=${encodeURIComponent(query.trim())}`)
    else router.push('/')
  }

  const isMap = pathname.startsWith('/map') || pathname.startsWith('/spots')

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 64, background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #f0f0f0',
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 20,
    }}>
      <Link href="/" style={{
        fontWeight: 500, fontSize: 14, letterSpacing: '0.18em',
        color: '#111', textDecoration: 'none', whiteSpace: 'nowrap',
      }}>
        TSLA PARK
      </Link>

      <div style={{ display: 'flex', gap: 4 }}>
        <Link href="/" style={{
          padding: '5px 12px', borderRadius: 4, fontSize: 12, textDecoration: 'none',
          color: !isMap ? '#111' : '#888',
          background: !isMap ? '#f0f0f0' : 'transparent',
        }}>
          掲示板
        </Link>
        <Link href="/map" style={{
          padding: '5px 12px', borderRadius: 4, fontSize: 12, textDecoration: 'none',
          color: isMap ? '#111' : '#888',
          background: isMap ? '#f0f0f0' : 'transparent',
        }}>
          充電マップ
        </Link>
      </div>

      {!isMap && (
        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 360 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="キーワードで検索..."
            style={{
              width: '100%', padding: '8px 14px',
              border: '1px solid #e8e8e8', borderRadius: 4,
              fontSize: 13, outline: 'none', fontFamily: 'inherit',
            }}
          />
        </form>
      )}

      <div style={{ marginLeft: 'auto' }}>
        <Link href="/new" style={{
          padding: '8px 16px', background: '#111', color: '#fff',
          borderRadius: 4, fontSize: 12, fontWeight: 500,
          letterSpacing: '0.08em', textDecoration: 'none',
        }}>
          投稿する
        </Link>
      </div>
    </nav>
  )
}
