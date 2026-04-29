-- コメント返信機能: parent_id カラム追加
ALTER TABLE aliexpress_comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES aliexpress_comments(id) ON DELETE CASCADE;
ALTER TABLE mc_comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES mc_comments(id) ON DELETE CASCADE;
ALTER TABLE delivery_comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES delivery_comments(id) ON DELETE CASCADE;
