-- ========================================
-- AliExpress・MC投稿に写真機能を追加
-- ========================================

-- 1. カラム追加
ALTER TABLE aliexpress_posts ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';
ALTER TABLE mc_posts ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- 2. Storageバケット作成（SQL Editorでは作成不可、Supabase Dashboard > Storage で作成）
-- バケット名: board-photos
-- Public: ON
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
