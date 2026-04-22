-- delivery_comments テーブル作成
CREATE TABLE IF NOT EXISTS delivery_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES delivery_reports(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author_name TEXT DEFAULT '匿名',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE delivery_comments ENABLE ROW LEVEL SECURITY;

-- 誰でも閲覧可能
CREATE POLICY "delivery_comments_select" ON delivery_comments FOR SELECT USING (true);

-- 誰でも投稿可能
CREATE POLICY "delivery_comments_insert" ON delivery_comments FOR INSERT WITH CHECK (true);

-- referral_ranking ビューを更新（delivery_reports + delivery_comments ベース）
CREATE OR REPLACE VIEW referral_ranking AS
SELECT
  p.id,
  p.display_name,
  p.referral_code,
  p.referral_cooldown_until,
  COALESCE(dr.report_count, 0) * 2 + COALESCE(dc.comment_count, 0) * 1 AS score
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
WHERE p.referral_code IS NOT NULL AND p.referral_code != ''
ORDER BY score DESC, p.created_at ASC;
