-- ========================================
-- 納車後オーナー機能：マイルストーン + レビュー
-- ========================================

-- 1. オーナー記録タイムライン
CREATE TABLE delivery_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES delivery_reports(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎉',
  title TEXT NOT NULL,
  note TEXT,
  milestone_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_delivery_milestones_report ON delivery_milestones(report_id);

ALTER TABLE delivery_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read milestones" ON delivery_milestones FOR SELECT USING (true);
CREATE POLICY "Users can insert own milestones" ON delivery_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own milestones" ON delivery_milestones FOR DELETE USING (auth.uid() = user_id);

-- 2. 満足度レビュー（1レポートにつき1レビュー）
CREATE TABLE delivery_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES delivery_reports(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE delivery_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reviews" ON delivery_reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON delivery_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON delivery_reviews FOR UPDATE USING (auth.uid() = user_id);
