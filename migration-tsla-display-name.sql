-- profilesテーブルにtsla_display_nameカラムを追加
-- TSLA PARK専用の表示名（close-friendsと分離するため）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tsla_display_name TEXT;

-- 既存のdisplay_nameをtsla_display_nameにコピー（初期値として）
UPDATE profiles SET tsla_display_name = display_name WHERE tsla_display_name IS NULL AND display_name IS NOT NULL;

-- referral_rankingビューも更新（tsla_display_nameを優先）
-- 注: referral_rankingビューの定義を確認してから実行すること
