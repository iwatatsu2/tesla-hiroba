'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, MODELS, Category, CATEGORY_JP, CATEGORY_COLOR } from '@/lib/supabase'

const QUICK_TAGS = ['納車待ち', '充電', 'トラブル', '雑談', 'OTA', 'カスタム', '維持費', '試乗', 'オプティマス', 'サイバートラック', 'Model X', 'SpaceX', 'ハリネズミ']

const CATEGORIES = Object.keys(CATEGORY_JP) as Category[]

export default function NewPost() {
  const router = useRouter()
  const [category, setCategory] = useState<Category>('general')
  const [model, setModel] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [authorName, setAuthorName] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('post_nickname') || '' : ''
  )
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const toggleTag = (t: string) => {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : prev.length < 5 ? [...prev, t] : prev)
  }

  const [errorMsg, setErrorMsg] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDone, setAiDone] = useState(false)

  const handleAiAssist = async () => {
    if (!title && !body) return
    setAiLoading(true)
    setAiDone(false)
    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, category }),
      })
      const data = await res.json()
      if (data.title) setTitle(data.title)
      if (data.body) setBody(data.body)
      setAiDone(true)
      setTimeout(() => setAiDone(false), 3000)
    } finally {
      setAiLoading(false)
    }
  }

  const doSubmit = async () => {
    if (!title.trim() || submitting) return
    setSubmitting(true)
    setErrorMsg('')
    const nickname = authorName.trim() || '匿名'
    if (typeof window !== 'undefined' && authorName.trim()) {
      localStorage.setItem('post_nickname', authorName.trim())
    }
    const { data: inserted, error } = await supabase.from('posts').insert({
      category,
      title: title.trim(),
      body: body.trim() || title.trim(),
      model: model || null,
      tags: tags.length > 0 ? tags : null,
      author_id: null,
      author_name: nickname,
      likes: 0,
    }).select().single()
    if (error) {
      setErrorMsg(`エラー: ${error.message}`)
      setSubmitting(false)
      return
    }
    if (inserted) {
      fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: inserted.id, title: inserted.title, body: inserted.body }),
      })
    }
    router.push('/')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await doSubmit()
  }

  const catColor = CATEGORY_COLOR[category] || '#888'
  const charCount = title.length + body.length

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 80px' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 60, background: 'rgba(13,13,13,0.97)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 20, lineHeight: 1, fontFamily: 'inherit', padding: '4px 8px' }}>←</button>
        <h1 style={{ fontSize: 16, fontWeight: 700, flex: 1 }}>新規投稿</h1>
        <button
          onClick={doSubmit}
          disabled={submitting || !title.trim()}
          style={{
            padding: '8px 22px', background: !title.trim() || submitting ? '#2A2A2A' : '#E8E8E8',
            color: !title.trim() || submitting ? '#555' : '#111',
            border: 'none', borderRadius: 24, fontSize: 13, fontWeight: 700,
            cursor: !title.trim() || submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}
        >
          {submitting ? '投稿中...' : '投稿'}
        </button>
      </div>

      {errorMsg && (
        <div style={{ margin: '12px 20px', padding: '12px 16px', background: '#2A1A1A', border: '1px solid rgba(255,100,100,0.3)', borderRadius: 8, fontSize: 13, color: '#FF9090' }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ padding: '20px 20px 0' }}>
        {/* ニックネーム */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text" value={authorName} onChange={e => setAuthorName(e.target.value)}
            placeholder="ニックネーム（省略で匿名）"
            style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 14, color: '#F0F0F0', fontFamily: 'inherit', outline: 'none' }}
          />
        </div>

        {/* タイトル（ツイート本文的位置づけ） */}
        <div style={{ marginBottom: 8, position: 'relative' }}>
          <textarea
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 200))}
            placeholder="いまどう？納車や充電の情報を共有しよう"
            required
            rows={3}
            style={{
              width: '100%', padding: '12px 0', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)',
              fontSize: 18, color: '#F0F0F0', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.6,
            }}
          />
        </div>

        {/* 詳細（任意） */}
        <div style={{ marginBottom: 20 }}>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="詳細を追加（任意）"
            rows={4}
            style={{
              width: '100%', padding: '10px 0', background: 'transparent', border: 'none',
              fontSize: 15, color: '#888', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.8,
            }}
          />
          <div style={{ textAlign: 'right', fontSize: 11, color: charCount > 380 ? '#E0E0E0' : '#444' }}>
            {charCount} / 400
          </div>
        </div>

        {/* AIアシスト */}
        <div style={{ marginBottom: 20 }}>
          <button
            type="button"
            onClick={handleAiAssist}
            disabled={aiLoading || (!title && !body)}
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              cursor: aiLoading || (!title && !body) ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              border: `1px solid ${aiDone ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.12)'}`,
              background: aiDone ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.04)',
              color: aiDone ? '#34D399' : aiLoading || (!title && !body) ? '#444' : '#A0A0A0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: '120ms',
            }}
          >
            {aiLoading ? (
              <>
                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                AIが整えています...
              </>
            ) : aiDone ? '✅ 整えました！' : '✨ AIで読みやすく整える'}
          </button>
        </div>

        {/* クイックタグ */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: '#555', letterSpacing: '0.08em', marginBottom: 8 }}>タグ</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_TAGS.map(t => {
              const on = tags.includes(t)
              return (
                <button key={t} type="button" onClick={() => toggleTag(t)}
                  style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: '120ms',
                    border: `1px solid ${on ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    background: on ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: on ? '#F0F0F0' : '#666',
                  }}>#{t}</button>
              )
            })}
          </div>
        </div>

        {/* カテゴリ */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: '#555', letterSpacing: '0.08em', marginBottom: 8 }}>カテゴリ</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => {
              const col = CATEGORY_COLOR[c] || '#888'
              const on = category === c
              return (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: '120ms',
                    border: `1px solid ${on ? col : 'rgba(255,255,255,0.08)'}`,
                    background: on ? col + '22' : 'transparent',
                    color: on ? col : '#555',
                  }}>{CATEGORY_JP[c]}</button>
              )
            })}
          </div>
        </div>

        {/* モデル（任意） */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: '#555', letterSpacing: '0.08em', marginBottom: 8 }}>車種（任意）</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['', ...MODELS].map(m => (
              <button key={m} type="button" onClick={() => setModel(m)}
                style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: '120ms',
                  border: `1px solid ${model === m ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  background: model === m ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: model === m ? '#F0F0F0' : '#555',
                }}>{m || '指定なし'}</button>
            ))}
          </div>
        </div>
      </form>
    </div>
  )
}
