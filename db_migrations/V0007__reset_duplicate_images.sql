-- Сбрасываем дублирующиеся image_url, оставляем только первую из группы
UPDATE articles SET image_url = NULL
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY image_url ORDER BY published_at ASC) AS rn
    FROM articles
    WHERE image_url IS NOT NULL
  ) t
  WHERE rn > 1
);
