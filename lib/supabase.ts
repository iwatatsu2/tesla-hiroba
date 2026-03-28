import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Category = 'charging' | 'delivery' | 'issue'

export interface Post {
  id: string
  category: Category
  title: string
  body: string
  model: string | null
  tags: string[] | null
  author_id: string | null
  author_name: string | null
  likes: number
  created_at: string
}

export interface Comment {
  id: string
  post_id: string
  body: string
  author_id: string | null
  author_name: string | null
  created_at: string
}

export const CATEGORY_LABEL: Record<Category, string> = {
  charging: 'CHARGING',
  delivery: 'DELIVERY',
  issue: 'SERVICE',
}

export const CATEGORY_JP: Record<Category, string> = {
  charging: '充電体験',
  delivery: '納車待ち',
  issue: '不具合・修理',
}

export const MODELS = ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck']

export type SpotType = 'supercharger' | 'destination' | 'third_party'

export interface ChargingSpot {
  id: string
  name: string
  lat: number
  lng: number
  spot_type: SpotType
  connector_type: string | null
  max_kw: number | null
  total_stalls: number | null
  address: string | null
  created_at: string
  avg_congestion?: number
  review_count?: number
}

export interface SpotReview {
  id: string
  spot_id: string
  author_name: string | null
  congestion_level: number
  wait_minutes: number | null
  actual_kw: number | null
  nearby_facilities: string | null
  parking_info: string | null
  body: string | null
  reported: boolean
  visited_at: string | null
  created_at: string
}

export interface SpotPhoto {
  id: string
  spot_id: string
  review_id: string | null
  url: string
  caption: string | null
  created_at: string
}

export const SPOT_TYPE_LABEL: Record<SpotType, string> = {
  supercharger: 'スーパーチャージャー',
  destination: 'デスティネーション',
  third_party: 'サードパーティ',
}

export const CONGESTION_LABEL: Record<number, string> = {
  1: 'ガラガラ', 2: 'すいてる', 3: 'ふつう', 4: 'やや混雑', 5: '満車',
}
