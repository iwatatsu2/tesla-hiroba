import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { title, body, category } = await req.json()
  if (!title && !body) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const prompt = `あなたはテスラオーナーコミュニティ「TSLA PARK」の投稿アシスタントです。
以下の投稿を、読みやすく・伝わりやすく整えてください。

ルール：
- 内容・意図・情報は変えない
- テスラオーナーらしい自然な口語トーンを保つ
- 充電・OTA・走行距離・FSD・オートパイロットなどの専門用語はそのまま使う
- 誇張・宣伝にならないよう整える
- タイトルと本文を改善して返す
- 返答はJSON形式のみ: {"title": "...", "body": "..."}

カテゴリ: ${category}
タイトル: ${title}
本文:
${body}`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  )

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] || '{}')
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'parse error' }, { status: 500 })
  }
}
