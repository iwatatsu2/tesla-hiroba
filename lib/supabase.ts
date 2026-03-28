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
