import { NextResponse } from 'next/server'

export const revalidate = 1800

export async function GET() {
  try {
    const res = await fetch(
      'https://news.google.com/rss/search?q=Tesla+テスラ&hl=ja&gl=JP&ceid=JP:ja',
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 1800 } }
    )
    const xml = await res.text()

    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
      const raw = m[1]
      const title = (raw.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || ''
      const link = (raw.match(/<link>([\s\S]*?)<\/link>/) || [])[1]?.trim() || ''
      const pubDate = (raw.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1]?.trim() || ''
      const lastDash = title.lastIndexOf(' - ')
      return {
        title: lastDash > 0 ? title.slice(0, lastDash) : title,
        link,
        pubDate,
        source: lastDash > 0 ? title.slice(lastDash + 3) : '',
      }
    })

    return NextResponse.json(items.slice(0, 20), {
      headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' },
    })
  } catch (e) {
    return NextResponse.json([])
  }
}
