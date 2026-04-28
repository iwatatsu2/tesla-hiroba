-- ========================================
-- AliExpress購入品ボード & モバイルコネクター掲示板
-- ========================================

-- 1. AliExpress購入品
CREATE TABLE aliexpress_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  author_name TEXT DEFAULT '匿名',
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  price TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5) DEFAULT 5,
  model TEXT,
  tags TEXT[] DEFAULT '{}',
  likes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE aliexpress_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read aliexpress" ON aliexpress_posts FOR SELECT USING (true);
CREATE POLICY "Auth users can insert aliexpress" ON aliexpress_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own aliexpress" ON aliexpress_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own aliexpress" ON aliexpress_posts FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE aliexpress_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES aliexpress_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  author_name TEXT DEFAULT '匿名',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE aliexpress_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ali comments" ON aliexpress_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can insert ali comments" ON aliexpress_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. モバイルコネクター掲示板
CREATE TABLE mc_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  author_name TEXT DEFAULT '匿名',
  title TEXT NOT NULL,
  body TEXT,
  solution_type TEXT DEFAULT 'other',
  model TEXT,
  region TEXT,
  likes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mc_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read mc" ON mc_posts FOR SELECT USING (true);
CREATE POLICY "Auth users can insert mc" ON mc_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mc" ON mc_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mc" ON mc_posts FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE mc_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES mc_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  author_name TEXT DEFAULT '匿名',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mc_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read mc comments" ON mc_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can insert mc comments" ON mc_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
