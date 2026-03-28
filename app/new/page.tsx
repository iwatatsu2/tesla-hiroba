'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, MODELS, Category, CATEGORY_JP } from '@/lib/supabase'

export default function NewPost() {
  const router = useRouter()
  const [category, setCategory] = useState<Category>('charging')
  const [model, setModel] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '')
    if (t && tags.length < 5 && !tags.includes(t)) {
      setTags(prev => [...prev, t])
      setTagInput('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setSubmitting(true)
    await supabase.from('posts').insert({
      category, title: title.trim(), body: body.trim(),
      model: model || null, tags: tags.length > 0 ? tags : null,
      author_id: null,
      author_name: authorName.trim() || '匿名',
    })
    router.push('/')
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', border: '1px solid #e8e8e8',
    borderRadius: 4, fontSize: 14, fontWeight: 300, fontFamily: 'inherit',
    outline: 'none', lineHeight: 1.7,
  }

  const labelStyle = {
    fontSize: 10, letterSpacing: '0.15em', color: '#888',
    display: 'block', marginBottom: 8, fontWeight: 500,
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '56px 24px 80px' }}>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#aaa', marginBottom: 16 }}>NEW POST</p>
      <h1 style={{ fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em', marginBottom: 48 }}>
        体験をシェアする
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Category */}
        <div>
          <span style={labelStyle}>CATEGORY</span>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['charging', 'delivery', 'issue'] as Category[]).map(c => (
              <label key={c} style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                padding: '10px 16px', border: `1px solid ${category === c ? '#111' : '#e8e8e8'}`,
                borderRadius: 4, background: category === c ? '#111' : 'transparent',
                color: category === c ? '#fff' : '#666',
                fontSize: 12, letterSpacing: '0.05em', transition: 'all 0.15s',
              }}>
                <input type="radio" name="category" value={c} checked={category === c}
                  onChange={() => setCategory(c)} style={{ display: 'none' }} />
                {CATEGORY_JP[c]}
              </label>
            ))}
          </div>
        </div>

        {/* Author Name */}
        <div>
          <label style={labelStyle}>ニックネーム（任意）</label>
          <input value={authorName} onChange={e => setAuthorName(e.target.value)}
            placeholder="匿名" style={inputStyle} />
        </div>

        {/* Model */}
        <div>
          <label style={labelStyle}>MODEL（任意）</label>
          <select value={model} onChange={e => setModel(e.target.value)}
            style={{ ...inputStyle, background: '#fff' }}>
            <option value="">選択してください</option>
            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Title */}
        <div>
          <label style={labelStyle}>TITLE</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="タイトルを入力" required style={inputStyle} />
        </div>

        {/* Body */}
        <div>
          <label style={labelStyle}>BODY</label>
          <textarea value={body} onChange={e => setBody(e.target.value)}
            placeholder="体験を詳しく書いてください..." required rows={8}
            style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        {/* Tags */}
        <div>
          <label style={labelStyle}>TAGS（最大5個）</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              placeholder="#タグ名"
              style={{ ...inputStyle, width: 'auto', flex: 1 }} />
            <button type="button" onClick={addTag}
              style={{ padding: '12px 18px', border: '1px solid #e0e0e0', borderRadius: 4,
                fontSize: 12, cursor: 'pointer', background: 'transparent', fontFamily: 'inherit' }}>
              追加
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tags.map(t => (
              <span key={t} style={{ fontSize: 11, background: '#f4f4f4', padding: '4px 10px',
                borderRadius: 2, color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}>
                #{t}
                <button type="button" onClick={() => setTags(tags.filter(x => x !== t))}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#bbb', fontSize: 13 }}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <button type="submit" disabled={submitting || !title.trim() || !body.trim()}
          style={{
            padding: '14px 32px', background: '#111', color: '#fff', border: 'none',
            borderRadius: 4, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            letterSpacing: '0.1em', opacity: submitting ? 0.5 : 1, marginTop: 8,
          }}>
          {submitting ? '投稿中...' : '投稿する'}
        </button>
      </form>
    </div>
  )
}
