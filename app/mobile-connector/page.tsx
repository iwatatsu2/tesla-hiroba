'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, McPost } from '@/lib/supabase'

const SOLUTION_TYPES = [
  { value: 'official_wait', label: '純正待ち', color: '#3B82F6' },
  { value: 'third_party', label: '社外品', color: '#10B981' },
  { value: 'used', label: '中古購入', color: '#F59E0B' },
  { value: 'construction', label: '工事・設置', color: '#8B5CF6' },
  { value: 'other', label: 'その他', color: '#6B7280' },
]
const MODELS = ['Model Y', 'Model YL', 'Model 3']
const PREFECTURES = ['北海道','青森','岩手','宮城','秋田','山形','福島','茨城','栃木','群馬','埼玉','千葉','東京','神奈川','新潟','富山','石川','福井','山梨','長野','岐阜','静岡','愛知','三重','滋賀','京都','大阪','兵庫','奈良','和歌山','鳥取','島根','岡山','広島','山口','徳島','香川','愛媛','高知','福岡','佐賀','長崎','熊本','大分','宮崎','鹿児島','沖縄']
const card = { background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 22px' }

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'NOW'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d`
  return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

function getSolutionInfo(type: string) {
  return SOLUTION_TYPES.find(s => s.value === type) || SOLUTION_TYPES[4]
}

export default function MobileConnectorPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<McPost[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})

  // フォーム
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [solutionType, setSolutionType] = useState('other')
  const [model, setModel] = useState('')
  const [region, setRegion] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUser(user)
        const { data: profile } = await supabase.from('profiles').select('tsla_display_name, display_name').eq('id', user.id).single()
        setDisplayName(profile?.tsla_display_name || profile?.display_name || '')
      }
    })
    supabase.from('mc_posts').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setPosts(data || [])
      setLoading(false)
      if (data && data.length > 0) {
        supabase.from('mc_comments').select('post_id').then(({ data: comments }) => {
          const counts: Record<string, number> = {}
          comments?.forEach(c => { counts[c.post_id] = (counts[c.post_id] || 0) + 1 })
          setCommentCounts(counts)
        })
      }
    })
  }, [])

  const handleSubmit = async () => {
    if (!user) { router.push('/auth'); return }
    if (!title.trim()) return
    setSubmitting(true)
    const { data } = await supabase.from('mc_posts').insert({
      user_id: user.id,
      author_name: displayName || user.email || '匿名',
      title: title.trim(), body: body.trim() || null,
      solution_type: solutionType, model: model || null, region: region || null,
    }).select().single()
    if (data) setPosts(prev => [data, ...prev])
    setTitle(''); setBody(''); setSolutionType('other'); setModel(''); setRegion('')
    setShowForm(false); setSubmitting(false)
  }

  const filtered = selectedType ? posts.filter(p => p.solution_type === selectedType) : posts

  // 集計
  const typeCounts = SOLUTION_TYPES.map(t => ({
    ...t,
    count: posts.filter(p => p.solution_type === t.value).length,
  }))

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#F59E0B', marginBottom: 6, fontWeight: 600 }}>MOBILE CONNECTOR</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>モバイルコネクター情報</h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>供給不足の今、みんなどうしてる？ · {posts.length}件</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 22px', background: '#F59E0B', color: '#000', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          {showForm ? '✕ 閉じる' : '＋ 情報を共有'}
        </button>
      </div>

      {/* 解決方法の分布 */}
      {posts.length > 0 && (
        <div style={{ ...card, marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>みんなの対応方法</p>
          <div style={{ display: 'flex', gap: 4, height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            {typeCounts.filter(t => t.count > 0).map(t => (
              <div key={t.value} style={{ flex: t.count, background: t.color, transition: '300ms' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {typeCounts.filter(t => t.count > 0).map(t => (
              <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: t.color }} />
                <span style={{ fontSize: 11, color: '#888' }}>{t.label} {t.count}件</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 投稿フォーム */}
      {showForm && (
        <div style={{ ...card, marginBottom: 24, borderColor: '#F59E0B40' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B', marginBottom: 12 }}>あなたの対応方法を共有</p>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="タイトル *（例: Gen2壁コネクター工事しました）" maxLength={100}
            style={{ width: '100%', padding: '10px 12px', background: '#242424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 14, color: '#F0F0F0', fontFamily: 'inherit', outline: 'none', marginBottom: 8 }} />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="詳細（費用、期間、感想など）" rows={4}
            style={{ width: '100%', padding: '10px 12px', background: '#242424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 14, color: '#F0F0F0', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.7, marginBottom: 8 }} />

          <p style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>対応方法</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {SOLUTION_TYPES.map(t => (
              <button key={t.value} onClick={() => setSolutionType(t.value)}
                style={{
                  padding: '5px 12px', fontSize: 12, borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
                  background: solutionType === t.value ? `${t.color}20` : '#242424',
                  border: solutionType === t.value ? `1px solid ${t.color}60` : '1px solid rgba(255,255,255,0.08)',
                  color: solutionType === t.value ? t.color : '#888',
                }}>{t.label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <select value={model} onChange={e => setModel(e.target.value)}
              style={{ padding: '6px 10px', background: '#242424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 12, color: '#F0F0F0', fontFamily: 'inherit' }}>
              <option value="">車種（任意）</option>
              {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={region} onChange={e => setRegion(e.target.value)}
              style={{ padding: '6px 10px', background: '#242424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 12, color: '#F0F0F0', fontFamily: 'inherit' }}>
              <option value="">地域（任意）</option>
              {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSubmit} disabled={!title.trim() || submitting}
              style={{ padding: '10px 24px', background: !title.trim() || submitting ? '#333' : '#F59E0B', color: '#000', border: 'none', borderRadius: 24, fontSize: 13, fontWeight: 700, cursor: !title.trim() || submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {submitting ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </div>
      )}

      {/* タイプフィルター */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        <button onClick={() => setSelectedType(null)}
          style={{ padding: '4px 12px', fontSize: 11, borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
            background: !selectedType ? '#F59E0B20' : '#1A1A1A', border: !selectedType ? '1px solid #F59E0B40' : '1px solid rgba(255,255,255,0.08)',
            color: !selectedType ? '#F59E0B' : '#666' }}>ALL</button>
        {SOLUTION_TYPES.map(t => (
          <button key={t.value} onClick={() => setSelectedType(selectedType === t.value ? null : t.value)}
            style={{ padding: '4px 12px', fontSize: 11, borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
              background: selectedType === t.value ? `${t.color}20` : '#1A1A1A',
              border: selectedType === t.value ? `1px solid ${t.color}40` : '1px solid rgba(255,255,255,0.08)',
              color: selectedType === t.value ? t.color : '#666' }}>{t.label}</button>
        ))}
      </div>

      {/* 投稿一覧 */}
      {loading && <p style={{ color: '#444', fontSize: 13 }}>読み込み中...</p>}
      {!loading && filtered.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: '#444', fontSize: 14, marginBottom: 8 }}>まだ投稿がありません</p>
          <p style={{ color: '#333', fontSize: 12 }}>モバイルコネクターの入手方法・代替案を共有しよう</p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(p => {
          const sol = getSolutionInfo(p.solution_type)
          return (
            <div key={p.id} onClick={() => router.push(`/mobile-connector/${p.id}`)}
              style={{ ...card, cursor: 'pointer', transition: '120ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 10px', fontSize: 11, borderRadius: 12, background: `${sol.color}20`, color: sol.color, fontWeight: 600 }}>{sol.label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#F0F0F0' }}>{p.title}</span>
              </div>
              {p.body && <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{p.body}</p>}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 10, color: '#555' }}>
                {p.model && <span>{p.model}</span>}
                {p.region && <span>📍{p.region}</span>}
                <span>by {p.author_name || '匿名'}</span>
                <span style={{ color: '#333' }}>{relativeTime(p.created_at)}</span>
                {(commentCounts[p.id] || 0) > 0 && <span>💬{commentCounts[p.id]}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
