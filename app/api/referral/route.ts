import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 現在掲載中の紹介コード＋ランキング＋掲載履歴を返す
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id') // スコア内訳取得用（任意）

  const now = new Date().toISOString()

  // ランキング
  const { data: ranking } = await supabase
    .from('referral_ranking')
    .select('id, display_name, referral_code, referral_cooldown_until, score')

  const featured = ranking?.find(
    r => !r.referral_cooldown_until || r.referral_cooldown_until < now
  ) || null

  // 掲載中のコードが変わっていたら履歴に記録
  if (featured) {
    const { data: lastLog } = await supabase
      .from('referral_display_log')
      .select('referral_code')
      .order('featured_at', { ascending: false })
      .limit(1)
      .single()

    if (!lastLog || lastLog.referral_code !== featured.referral_code) {
      await supabase.from('referral_display_log').insert({
        user_id: featured.id,
        display_name: featured.display_name,
        referral_code: featured.referral_code,
      })
    }
  }

  // 掲載履歴（最新30件）
  const { data: displayLog } = await supabase
    .from('referral_display_log')
    .select('display_name, referral_code, featured_at, used')
    .order('featured_at', { ascending: false })
    .limit(30)

  // 掲載回数集計
  const countMap: Record<string, number> = {}
  displayLog?.forEach(r => {
    countMap[r.display_name || r.referral_code] = (countMap[r.display_name || r.referral_code] || 0) + 1
  })

  // スコア内訳（user_id指定時）
  let breakdown = null
  if (userId) {
    const { data } = await supabase
      .from('score_breakdown')
      .select('*')
      .eq('id', userId)
      .single()
    breakdown = data
  }

  return NextResponse.json({
    featured,
    ranking: (ranking || []).slice(0, 20).map((r, i) => ({
      rank: i + 1,
      display_name: r.display_name,
      score: r.score,
      referral_code: r.referral_code,
      in_cooldown: !!(r.referral_cooldown_until && r.referral_cooldown_until > now),
      is_featured: featured?.id === r.id,
      featured_count: countMap[r.display_name || r.referral_code] || 0,
    })),
    display_log: displayLog || [],
    breakdown,
  })
}

// 紹介リンクがクリックされたらクールダウン設定＋履歴をused=trueに更新
export async function POST(req: Request) {
  const { referral_code } = await req.json()
  if (!referral_code) return NextResponse.json({ ok: false }, { status: 400 })

  // 24時間クールダウン
  const cooldown = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const [{ error }] = await Promise.all([
    supabase
      .from('profiles')
      .update({ referral_cooldown_until: cooldown })
      .eq('referral_code', referral_code),
    // 最新の掲載ログをused=trueに
    supabase
      .from('referral_display_log')
      .update({ used: true })
      .eq('referral_code', referral_code)
      .eq('used', false)
      .order('featured_at', { ascending: false })
      .limit(1),
  ])

  if (error) return NextResponse.json({ ok: false }, { status: 500 })
  return NextResponse.json({ ok: true })
}
