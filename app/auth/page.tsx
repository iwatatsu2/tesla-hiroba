'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      })
      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: '確認メールを送信しました。メールをご確認ください。' })
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage({ type: 'error', text: 'メールアドレスまたはパスワードが正しくありません。' })
      } else {
        router.push('/')
        router.refresh()
      }
    }
    setLoading(false)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/` },
    })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>テスラ広場</span>
          <p style={{ fontSize: 13, color: '#666', marginTop: 6 }}>Teslaオーナーのコミュニティ</p>
        </div>

        {/* Tab */}
        <div style={{ display: 'flex', border: '1px solid #e5e5e5', borderRadius: 8, marginBottom: 24, overflow: 'hidden' }}>
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setMessage(null) }}
              style={{
                flex: 1, padding: '10px 0', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer',
                background: mode === m ? '#111' : '#fff',
                color: mode === m ? '#fff' : '#666',
              }}
            >
              {m === 'login' ? 'ログイン' : '新規登録'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="表示名"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={{ padding: '12px 14px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 14, outline: 'none' }}
            />
          )}
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ padding: '12px 14px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 14, outline: 'none' }}
          />
          <input
            type="password"
            placeholder="パスワード（8文字以上）"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            style={{ padding: '12px 14px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 14, outline: 'none' }}
          />

          {message && (
            <p style={{ fontSize: 13, color: message.type === 'error' ? '#e00' : '#080', textAlign: 'center' }}>
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '13px 0', background: '#111', color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録する'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
          <span style={{ fontSize: 12, color: '#aaa' }}>または</span>
          <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
        </div>

        <button
          onClick={handleGoogle}
          style={{
            width: '100%', padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, border: '1px solid #e5e5e5', borderRadius: 8, background: '#fff',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Googleでログイン
        </button>
      </div>
    </div>
  )
}
