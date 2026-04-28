import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Category = 'charging' | 'issue' | 'software' | 'cost' | 'trip' | 'accessory' | 'insurance' | 'question' | 'general'

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
  issue: 'SERVICE',
  software: 'SOFTWARE',
  cost: 'COST',
  trip: 'TRIP',
  accessory: 'ACCESSORY',
  insurance: 'INSURANCE',
  question: 'Q&A',
  general: 'GENERAL',
}

export const CATEGORY_JP: Record<Category, string> = {
  charging: '充電体験',
  issue: '不具合・修理',
  software: 'ソフトウェア・OTA',
  cost: '維持費・保険・税金',
  trip: 'ドライブ・旅行',
  accessory: 'アクセサリー・カスタム',
  insurance: '車両保険',
  question: '質問・相談',
  general: '雑談',
}

export const CATEGORY_COLOR: Record<Category, string> = {
  charging: '#3B82F6',
  issue: '#EF4444',
  software: '#8B5CF6',
  cost: '#F59E0B',
  trip: '#10B981',
  accessory: '#EC4899',
  insurance: '#06B6D4',
  question: '#F97316',
  general: '#6B7280',
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

export interface DeliveryComment {
  id: string
  report_id: string
  body: string
  author_name: string | null
  created_at: string
}

export interface DeliveryMilestone {
  id: string
  report_id: string
  user_id: string
  emoji: string
  title: string
  note: string | null
  milestone_date: string
  created_at: string
}

export interface DeliveryReview {
  id: string
  report_id: string
  user_id: string
  rating: number
  body: string | null
  created_at: string
}

export interface AliexpressPost {
  id: string
  user_id: string | null
  author_name: string | null
  title: string
  body: string | null
  url: string | null
  price: string | null
  rating: number
  model: string | null
  tags: string[]
  likes: number
  created_at: string
}

export interface AliexpressComment {
  id: string
  post_id: string
  user_id: string | null
  author_name: string | null
  body: string
  created_at: string
}

export interface McPost {
  id: string
  user_id: string | null
  author_name: string | null
  title: string
  body: string | null
  solution_type: string
  model: string | null
  region: string | null
  likes: number
  created_at: string
}

export interface McComment {
  id: string
  post_id: string
  user_id: string | null
  author_name: string | null
  body: string
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
