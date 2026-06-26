-- Убираем ограничение article_key = slug_id (теперь ключ будет UUID-like)
-- Добавляем поля для автопубликации
ALTER TABLE articles ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS read_time VARCHAR(20) DEFAULT '5 мин';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Индекс для быстрой выборки по категории и дате
CREATE INDEX IF NOT EXISTS idx_articles_category_published ON articles(category_slug, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published, published_at DESC);
