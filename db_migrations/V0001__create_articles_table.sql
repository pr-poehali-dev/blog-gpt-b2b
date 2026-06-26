CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  article_key VARCHAR(100) NOT NULL UNIQUE,
  category_slug VARCHAR(50) NOT NULL,
  article_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  excerpt TEXT,
  content JSONB NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_key ON articles(article_key);
