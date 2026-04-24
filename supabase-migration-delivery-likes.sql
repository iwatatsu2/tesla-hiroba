-- delivery_likes テーブル作成（1ニックネームにつき1レポート1いいね）
CREATE TABLE IF NOT EXISTS delivery_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES delivery_reports(id) ON DELETE CASCADE,
  liker_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, liker_name)
);

-- RLS有効化
ALTER TABLE delivery_likes ENABLE ROW LEVEL SECURITY;

-- 誰でも閲覧可能
CREATE POLICY "delivery_likes_select" ON delivery_likes FOR SELECT USING (true);

-- 誰でも投稿可能
CREATE POLICY "delivery_likes_insert" ON delivery_likes FOR INSERT WITH CHECK (true);

-- 自分のいいねは削除可能
CREATE POLICY "delivery_likes_delete" ON delivery_likes FOR DELETE USING (true);

-- referral_ranking ビューを更新（いいねを含む）
-- いいね = レポート投稿者が受け取ったいいね数
CREATE OR REPLACE VIEW referral_ranking AS
SELECT
  p.id,
  p.display_name,
  p.referral_code,
  p.referral_cooldown_until,
  COALESCE(dr.report_count, 0) * 2
    + COALESCE(dc.comment_count, 0) * 1
    + COALESCE(dl.like_count, 0) * 1 AS score
FROM profiles p
LEFT JOIN (
  SELECT author_name, COUNT(*) AS report_count
  FROM delivery_reports
  GROUP BY author_name
) dr ON dr.author_name = p.display_name
LEFT JOIN (
  SELECT author_name, COUNT(*) AS comment_count
  FROM delivery_comments
  GROUP BY author_name
) dc ON dc.author_name = p.display_name
LEFT JOIN (
  -- レポート投稿者が受け取ったいいね数
  SELECT r.author_name, COUNT(*) AS like_count
  FROM delivery_likes l
  JOIN delivery_reports r ON r.id = l.report_id
  GROUP BY r.author_name
) dl ON dl.author_name = p.display_name
WHERE p.referral_code IS NOT NULL AND p.referral_code != ''
ORDER BY score DESC, p.created_at ASC;

-- score_breakdown ビューも更新
CREATE OR REPLACE VIEW score_breakdown AS
SELECT
  p.id,
  p.display_name,
  COALESCE(dr.report_count, 0) AS report_count,
  COALESCE(dc.comment_count, 0) AS comment_count,
  COALESCE(dl.like_count, 0) AS like_count,
  COALESCE(dr.report_count, 0) * 2 AS pts_from_reports,
  COALESCE(dc.comment_count, 0) * 1 AS pts_from_comments,
  COALESCE(dl.like_count, 0) * 1 AS pts_from_likes,
  COALESCE(dr.report_count, 0) * 2
    + COALESCE(dc.comment_count, 0) * 1
    + COALESCE(dl.like_count, 0) * 1 AS total_score
FROM profiles p
LEFT JOIN (
  SELECT author_name, COUNT(*) AS report_count
  FROM delivery_reports
  GROUP BY author_name
) dr ON dr.author_name = p.display_name
LEFT JOIN (
  SELECT author_name, COUNT(*) AS comment_count
  FROM delivery_comments
  GROUP BY author_name
) dc ON dc.author_name = p.display_name
LEFT JOIN (
  SELECT r.author_name, COUNT(*) AS like_count
  FROM delivery_likes l
  JOIN delivery_reports r ON r.id = l.report_id
  GROUP BY r.author_name
) dl ON dl.author_name = p.display_name;
