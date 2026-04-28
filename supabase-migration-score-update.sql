-- ========================================
-- スコアビュー更新: AliExpress・MC投稿もスコアに加算
-- ========================================

-- スコア配点:
-- posts投稿: +2pts, postsいいね(もらう): +3pts, commentsコメント: +1pt
-- 納車レポート投稿: +2pts, 納車レポートいいね: +1pt, 納車コメント: +1pt
-- AliExpress投稿: +3pts, AliExpress コメント(もらう): +1pt
-- MC投稿: +3pts, MC コメント(もらう): +1pt

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
  -- モバイルコネクター
    + COALESCE(mc_stats.post_count, 0) * 3
    + COALESCE(mc_comment_stats.comment_count, 0)
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
-- モバイルコネクター
LEFT JOIN (
  SELECT user_id, COUNT(*) AS post_count
  FROM mc_posts WHERE user_id IS NOT NULL GROUP BY user_id
) mc_stats ON mc_stats.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS comment_count
  FROM mc_comments WHERE user_id IS NOT NULL GROUP BY user_id
) mc_comment_stats ON mc_comment_stats.user_id = p.id
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
  COALESCE(mc_stats.post_count, 0) AS mc_post_count,
  COALESCE(post_stats.post_count, 0) * 2 AS pts_from_posts,
  COALESCE(post_stats.total_likes, 0) * 3 AS pts_from_likes,
  COALESCE(comment_stats.comment_count, 0) AS pts_from_comments,
  COALESCE(ali_stats.post_count, 0) * 3 AS pts_from_ali,
  COALESCE(mc_stats.post_count, 0) * 3 AS pts_from_mc,
  COALESCE(post_stats.total_likes, 0) * 3
    + COALESCE(post_stats.post_count, 0) * 2
    + COALESCE(comment_stats.comment_count, 0)
    + COALESCE(ali_stats.post_count, 0) * 3
    + COALESCE(mc_stats.post_count, 0) * 3
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
  SELECT user_id, COUNT(*) AS post_count
  FROM mc_posts WHERE user_id IS NOT NULL GROUP BY user_id
) mc_stats ON mc_stats.user_id = p.id;
