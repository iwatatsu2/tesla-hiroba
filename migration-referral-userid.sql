-- ========================================
-- 1. 既存データに user_id を埋める
-- ========================================

-- delivery_reports: author_name → profiles.display_name で紐付け
UPDATE delivery_reports r
SET user_id = p.id
FROM profiles p
WHERE r.user_id IS NULL
  AND r.author_name = p.display_name;

-- delivery_comments: author_name → profiles.display_name で紐付け
UPDATE delivery_comments c
SET user_id = p.id
FROM profiles p
WHERE c.user_id IS NULL
  AND c.author_name = p.display_name;

-- delivery_likes: user_id が NULL のものを liker_name → profiles.display_name で紐付け
UPDATE delivery_likes l
SET user_id = p.id
FROM profiles p
WHERE l.user_id IS NULL
  AND l.liker_name = p.display_name;

-- ========================================
-- 2. referral_ranking ビューを user_id ベースに更新
-- ========================================

-- referral_ranking ビューを user_id ベースに更新
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
  SELECT user_id, COUNT(*) AS report_count
  FROM delivery_reports
  WHERE user_id IS NOT NULL
  GROUP BY user_id
) dr ON dr.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS comment_count
  FROM delivery_comments
  WHERE user_id IS NOT NULL
  GROUP BY user_id
) dc ON dc.user_id = p.id
LEFT JOIN (
  -- レポート投稿者が受け取ったいいね数
  SELECT r.user_id, COUNT(*) AS like_count
  FROM delivery_likes l
  JOIN delivery_reports r ON r.id = l.report_id
  WHERE r.user_id IS NOT NULL
  GROUP BY r.user_id
) dl ON dl.user_id = p.id
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
  SELECT user_id, COUNT(*) AS report_count
  FROM delivery_reports
  WHERE user_id IS NOT NULL
  GROUP BY user_id
) dr ON dr.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS comment_count
  FROM delivery_comments
  WHERE user_id IS NOT NULL
  GROUP BY user_id
) dc ON dc.user_id = p.id
LEFT JOIN (
  SELECT r.user_id, COUNT(*) AS like_count
  FROM delivery_likes l
  JOIN delivery_reports r ON r.id = l.report_id
  WHERE r.user_id IS NOT NULL
  GROUP BY r.user_id
) dl ON dl.user_id = p.id;
