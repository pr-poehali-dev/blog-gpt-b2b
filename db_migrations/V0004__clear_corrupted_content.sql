UPDATE articles SET content = '{}', image_url = NULL, updated_at = NOW()
WHERE content::text LIKE '%\uFFFD%'
   OR content::text LIKE '%\\357\\277\\275%';
