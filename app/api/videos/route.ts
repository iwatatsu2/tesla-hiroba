import { XMLParser } from 'fast-xml-parser'
import { NextResponse } from 'next/server'

export const revalidate = 3600

interface Video {
  title: string
  link: string
  published: string
  channelName: string
  videoId: string
}

async function resolveYouTubeId(googleLink: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(googleLink, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      },
      redirect: 'follow',
    })
    clearTimeout(timer)
    const finalUrl = res.url
    const m = finalUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (m) return m[1]
    // HTMLからもYouTube URLを探す
    const html = await res.text()
    const m2 = html.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return m2?.[1] || null
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const queries = [
      'https://news.google.com/rss/search?q=テスラ+youtube&hl=ja&gl=JP&ceid=JP:ja',
      'https://news.google.com/rss/search?q=テスラ+モデルY+youtube&hl=ja&gl=JP&ceid=JP:ja',
      'https://news.google.com/rss/search?q=テスラ+試乗+youtube&hl=ja&gl=JP&ceid=JP:ja',
    ]

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
    const allItems: { title: string; link: string; pubDate: string; source: string }[] = []

    await Promise.all(queries.map(async url => {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
        const xml = await res.text()
        const obj = parser.parse(xml)
        const items = obj?.rss?.channel?.item || []
        const arr = Array.isArray(items) ? items : [items]
        arr.slice(0, 12).forEach((item: any) => {
          const full: string = item.title || ''
          const lastDash = full.lastIndexOf(' - ')
          allItems.push({
            title: lastDash > 0 ? full.slice(0, lastDash) : full,
            link: item.link || '',
            pubDate: item.pubDate || '',
            source: lastDash > 0 ? full.slice(lastDash + 3) : 'YouTube',
          })
        })
      } catch { /* skip */ }
    }))

    // 重複除去
    const unique = allItems.filter((item, i, arr) => arr.findIndex(x => x.link === item.link) === i)

    // YouTube ID解決（並列）
    const resolved = await Promise.all(
      unique.slice(0, 24).map(async item => {
        const videoId = await resolveYouTubeId(item.link)
        if (!videoId) return null
        return {
          title: item.title,
          link: `https://www.youtube.com/watch?v=${videoId}`,
          published: item.pubDate,
          channelName: item.source,
          videoId,
        } as Video
      })
    )

    const videos = resolved.filter((v): v is Video => v !== null)
    return NextResponse.json(videos, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' }
    })
  } catch {
    return NextResponse.json([])
  }
}
