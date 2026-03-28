'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Nav() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/?q=${encodeURIComponent(query.trim())}`)
    else router.push('/')
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 64, background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #f0f0f0',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 24,
    }}>
      <Link href="/" style={{
        fontWeight: 400, fontSize: 15, letterSpacing: '0.18em',
        color: '#111', textDecoration: 'none', whiteSpace: 'nowrap',
      }}>
        TSLA PARK
      </Link>

      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 400 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="キーワードで検索..."
          style={{
            width: '100%', padding: '8px 14px',
            border: '1px solid #e8e8e8', borderRadius: 4,
            fontSize: 13, fontWeight: 300, outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </form>

      <div style={{ marginLeft: 'auto' }}>
        <Link href="/new" style={{
          padding: '8px 18px', background: '#111', color: '#fff',
          borderRadius: 4, fontSize: 12, fontWeight: 400,
          letterSpacing: '0.1em', textDecoration: 'none',
        }}>
          投稿する
        </Link>
      </div>
    </nav>
  )
}
