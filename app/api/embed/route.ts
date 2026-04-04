import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text }] },
      }),
    }
  )
  const data = await res.json()
  return data.embedding?.values || []
}

export async function POST(req: NextRequest) {
  const { postId, title, body } = await req.json()
  if (!postId || !title) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

  const embedding = await getEmbedding(`${title}\n${body || ''}`)
  if (!embedding.length) return NextResponse.json({ error: 'embedding failed' }, { status: 500 })

  await supabaseAdmin
    .from('posts')
    .update({ embedding: `[${embedding.join(',')}]` })
    .eq('id', postId)

  return NextResponse.json({ ok: true })
}
