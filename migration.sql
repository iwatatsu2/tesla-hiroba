-- user_id カラムを追加（既存データとの後方互換性を保つためNULL許可）
ALTER TABLE delivery_reports ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE delivery_likes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE delivery_comments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- ログインユーザーのいいねはuser_idベースでユニーク制約
-- （既存のliker_name制約はそのまま残す）
ALTER TABLE delivery_likes ADD CONSTRAINT delivery_likes_user_report_unique UNIQUE (report_id, user_id);
