-- ========================================
-- アリエク・モバコネ いいねテーブル + スコアビュー更新
-- Supabase SQL Editorで実行してください
-- ========================================

-- 1. aliexpress_likes テーブル
CREATE TABLE aliexpress_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES aliexpress_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  liker_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE aliexpress_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "誰でも閲覧可" ON aliexpress_likes FOR SELECT USING (true);
CREATE POLICY "認証ユーザーがいいね可" ON aliexpress_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "自分のいいねを削除可" ON aliexpress_likes FOR DELETE USING (auth.uid() = user_id);

-- 2. mc_likes テーブル
CREATE TABLE mc_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES mc_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  liker_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE mc_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "誰でも閲覧可" ON mc_likes FOR SELECT USING (true);
CREATE POLICY "認証ユーザーがいいね可" ON mc_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "自分のいいねを削除可" ON mc_likes FOR DELETE USING (auth.uid() = user_id);

-- 3. スコアビュー更新（アリエク・モバコネのいいねを加算）
-- 配点: アリエクいいね(もらう) +1pt, モバコネいいね(もらう) +1pt
CREATE OR REPLACE VIEW referral_ranking AS
SELECT
  p.id,
  COALESCE(p.tsla_display_name, p.display_name) AS display_name,
  p.referral_code,
  p.referral_cooldown_until,
  -- 既存posts
  COALESCE(post_stats.total_likes, 0) * 3
    + COALESCE(post_stats.post_count, 0) * 2
    + COALESCE(comment_stats.comment_count, 0)
  -- 納車レポート
    + COALESCE(delivery_stats.report_count, 0) * 2
    + COALESCE(delivery_stats.total_likes, 0)
    + COALESCE(dc_stats.comment_count, 0)
  -- AliExpress
    + COALESCE(ali_stats.post_count, 0) * 3
    + COALESCE(ali_comment_stats.comment_count, 0)
    + COALESCE(ali_like_stats.total_likes, 0)
  -- モバイルコネクター
    + COALESCE(mc_stats.post_count, 0) * 3
    + COALESCE(mc_comment_stats.comment_count, 0)
    + COALESCE(mc_like_stats.total_likes, 0)
  AS score
FROM profiles p
-- 既存posts
LEFT JOIN (
  SELECT author_id, SUM(likes) AS total_likes, COUNT(*) AS post_count
  FROM posts WHERE author_id IS NOT NULL GROUP BY author_id
) post_stats ON post_stats.author_id::uuid = p.id
LEFT JOIN (
  SELECT author_id, COUNT(*) AS comment_count
  FROM comments WHERE author_id IS NOT NULL GROUP BY author_id
) comment_stats ON comment_stats.author_id::uuid = p.id
-- 納車レポート
LEFT JOIN (
  SELECT user_id, COUNT(*) AS report_count,
    (SELECT COUNT(*) FROM delivery_likes dl WHERE dl.report_id IN (SELECT id FROM delivery_reports dr2 WHERE dr2.user_id = delivery_reports.user_id)) AS total_likes
  FROM delivery_reports WHERE user_id IS NOT NULL GROUP BY user_id
) delivery_stats ON delivery_stats.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS comment_count
  FROM delivery_comments WHERE user_id IS NOT NULL GROUP BY user_id
) dc_stats ON dc_stats.user_id = p.id
-- AliExpress
LEFT JOIN (
  SELECT user_id, COUNT(*) AS post_count
  FROM aliexpress_posts WHERE user_id IS NOT NULL GROUP BY user_id
) ali_stats ON ali_stats.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS comment_count
  FROM aliexpress_comments WHERE user_id IS NOT NULL GROUP BY user_id
) ali_comment_stats ON ali_comment_stats.user_id = p.id
LEFT JOIN (
  SELECT ap.user_id, COUNT(*) AS total_likes
  FROM aliexpress_likes al
  JOIN aliexpress_posts ap ON ap.id = al.post_id
  WHERE ap.user_id IS NOT NULL
  GROUP BY ap.user_id
) ali_like_stats ON ali_like_stats.user_id = p.id
-- モバイルコネクター
LEFT JOIN (
  SELECT user_id, COUNT(*) AS post_count
  FROM mc_posts WHERE user_id IS NOT NULL GROUP BY user_id
) mc_stats ON mc_stats.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS comment_count
  FROM mc_comments WHERE user_id IS NOT NULL GROUP BY user_id
) mc_comment_stats ON mc_comment_stats.user_id = p.id
LEFT JOIN (
  SELECT mp.user_id, COUNT(*) AS total_likes
  FROM mc_likes ml
  JOIN mc_posts mp ON mp.id = ml.post_id
  WHERE mp.user_id IS NOT NULL
  GROUP BY mp.user_id
) mc_like_stats ON mc_like_stats.user_id = p.id
WHERE p.referral_code IS NOT NULL AND p.referral_code != ''
ORDER BY score DESC;

-- スコア内訳ビューも更新
CREATE OR REPLACE VIEW score_breakdown AS
SELECT
  p.id,
  COALESCE(p.tsla_display_name, p.display_name) AS display_name,
  p.referral_code,
  COALESCE(post_stats.post_count, 0) AS post_count,
  COALESCE(post_stats.total_likes, 0) AS total_likes,
  COALESCE(comment_stats.comment_count, 0) AS comment_count,
  COALESCE(ali_stats.post_count, 0) AS ali_post_count,
  COALESCE(ali_like_stats.total_likes, 0) AS ali_like_count,
  COALESCE(mc_stats.post_count, 0) AS mc_post_count,
  COALESCE(mc_like_stats.total_likes, 0) AS mc_like_count,
  COALESCE(post_stats.post_count, 0) * 2 AS pts_from_posts,
  COALESCE(post_stats.total_likes, 0) * 3 AS pts_from_likes,
  COALESCE(comment_stats.comment_count, 0) AS pts_from_comments,
  COALESCE(ali_stats.post_count, 0) * 3 AS pts_from_ali,
  COALESCE(ali_like_stats.total_likes, 0) AS pts_from_ali_likes,
  COALESCE(mc_stats.post_count, 0) * 3 AS pts_from_mc,
  COALESCE(mc_like_stats.total_likes, 0) AS pts_from_mc_likes,
  COALESCE(post_stats.total_likes, 0) * 3
    + COALESCE(post_stats.post_count, 0) * 2
    + COALESCE(comment_stats.comment_count, 0)
    + COALESCE(ali_stats.post_count, 0) * 3
    + COALESCE(ali_like_stats.total_likes, 0)
    + COALESCE(mc_stats.post_count, 0) * 3
    + COALESCE(mc_like_stats.total_likes, 0)
  AS total_score
FROM profiles p
LEFT JOIN (
  SELECT author_id, SUM(likes) AS total_likes, COUNT(*) AS post_count
  FROM posts WHERE author_id IS NOT NULL GROUP BY author_id
) post_stats ON post_stats.author_id::uuid = p.id
LEFT JOIN (
  SELECT author_id, COUNT(*) AS comment_count
  FROM comments WHERE author_id IS NOT NULL GROUP BY author_id
) comment_stats ON comment_stats.author_id::uuid = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS post_count
  FROM aliexpress_posts WHERE user_id IS NOT NULL GROUP BY user_id
) ali_stats ON ali_stats.user_id = p.id
LEFT JOIN (
  SELECT ap.user_id, COUNT(*) AS total_likes
  FROM aliexpress_likes al
  JOIN aliexpress_posts ap ON ap.id = al.post_id
  WHERE ap.user_id IS NOT NULL
  GROUP BY ap.user_id
) ali_like_stats ON ali_like_stats.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS post_count
  FROM mc_posts WHERE user_id IS NOT NULL GROUP BY user_id
) mc_stats ON mc_stats.user_id = p.id
LEFT JOIN (
  SELECT mp.user_id, COUNT(*) AS total_likes
  FROM mc_likes ml
  JOIN mc_posts mp ON mp.id = ml.post_id
  WHERE mp.user_id IS NOT NULL
  GROUP BY mp.user_id
) mc_like_stats ON mc_like_stats.user_id = p.id;
