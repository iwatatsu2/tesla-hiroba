-- ============================================
-- TSLA PARK: 紹介コードランキングシステム
-- Supabase SQL Editor で実行してください
-- ============================================

-- プロフィールテーブル
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  referral_code text,
  referral_cooldown_until timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 新規ユーザー登録時にprofilesを自動作成するトリガー
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- スコア計算ビュー
-- posts.likes + 投稿数 * 2 + コメント数 でランキング
-- ============================================
CREATE OR REPLACE VIEW referral_ranking AS
SELECT
  p.id,
  p.display_name,
  p.referral_code,
  p.referral_cooldown_until,
  COALESCE(post_stats.total_likes, 0) * 3
    + COALESCE(post_stats.post_count, 0) * 2
    + COALESCE(comment_stats.comment_count, 0) AS score
FROM profiles p
LEFT JOIN (
  SELECT
    author_id,
    SUM(likes) AS total_likes,
    COUNT(*) AS post_count
  FROM posts
  WHERE author_id IS NOT NULL
  GROUP BY author_id
) post_stats ON post_stats.author_id::uuid = p.id
LEFT JOIN (
  SELECT
    author_id,
    COUNT(*) AS comment_count
  FROM comments
  WHERE author_id IS NOT NULL
  GROUP BY author_id
) comment_stats ON comment_stats.author_id::uuid = p.id
WHERE p.referral_code IS NOT NULL AND p.referral_code != ''
ORDER BY score DESC;

-- ============================================
-- スコア内訳ビュー（透明性）
-- ============================================
CREATE OR REPLACE VIEW score_breakdown AS
SELECT
  p.id,
  p.display_name,
  p.referral_code,
  COALESCE(post_stats.post_count, 0) AS post_count,
  COALESCE(post_stats.total_likes, 0) AS total_likes,
  COALESCE(comment_stats.comment_count, 0) AS comment_count,
  COALESCE(post_stats.post_count, 0) * 2 AS pts_from_posts,
  COALESCE(post_stats.total_likes, 0) * 3 AS pts_from_likes,
  COALESCE(comment_stats.comment_count, 0) * 1 AS pts_from_comments,
  COALESCE(post_stats.total_likes, 0) * 3
    + COALESCE(post_stats.post_count, 0) * 2
    + COALESCE(comment_stats.comment_count, 0) AS total_score
FROM profiles p
LEFT JOIN (
  SELECT author_id, SUM(likes) AS total_likes, COUNT(*) AS post_count
  FROM posts WHERE author_id IS NOT NULL GROUP BY author_id
) post_stats ON post_stats.author_id::uuid = p.id
LEFT JOIN (
  SELECT author_id, COUNT(*) AS comment_count
  FROM comments WHERE author_id IS NOT NULL GROUP BY author_id
) comment_stats ON comment_stats.author_id::uuid = p.id;

-- ============================================
-- 掲載履歴テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS referral_display_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  display_name text,
  referral_code text,
  featured_at timestamptz DEFAULT now(),
  used boolean DEFAULT false  -- クリックされたらtrue
);

ALTER TABLE referral_display_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "display_log_select" ON referral_display_log FOR SELECT USING (true);
CREATE POLICY "display_log_insert" ON referral_display_log FOR INSERT WITH CHECK (true);
