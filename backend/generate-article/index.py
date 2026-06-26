import json
import os
import urllib.request
import urllib.parse
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def fetch_unsplash_image(query: str, seed: int = 1) -> str:
    """Ищет уникальное фото через Unsplash API по точному запросу темы статьи."""
    access_key = os.environ.get('UNSPLASH_ACCESS_KEY', '').strip()

    if access_key:
        try:
            encoded = urllib.parse.quote(query)
            # page варьируется по seed — разные статьи получают разные фото
            page = (seed % 5) + 1
            url = (
                f"https://api.unsplash.com/search/photos"
                f"?query={encoded}&per_page=5&page={page}"
                f"&orientation=landscape&content_filter=high"
            )
            req = urllib.request.Request(url)
            req.add_header('Authorization', f'Client-ID {access_key}')
            req.add_header('Accept-Version', 'v1')
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
            results = data.get('results', [])
            if results:
                # берём фото по индексу seed чтобы не повторяться
                idx = seed % len(results)
                img_url = results[idx]['urls'].get('regular', results[idx]['urls']['full'])
                # добавляем параметры качества
                sep = '&' if '?' in img_url else '?'
                return f"{img_url}{sep}w=1280&q=85&fit=crop"
        except BaseException:
            pass

    # Fallback без ключа
    try:
        encoded = urllib.parse.quote(query)
        url = f"https://source.unsplash.com/featured/1280x720/?{encoded}&sig={seed}"
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.geturl()
    except BaseException:
        pass

    # Финальный фолбэк — набор разных бизнес-фото
    fallbacks = [
        "photo-1454165804606-c3d57bc86b40",
        "photo-1507003211169-0a1dd7228f2d",
        "photo-1521737604893-d14cc237f11d",
        "photo-1551434678-e076c223a692",
        "photo-1460925895917-afdab827c52f",
    ]
    return f"https://images.unsplash.com/{fallbacks[seed % len(fallbacks)]}?w=1280&q=85"

def handler(event: dict, context) -> dict:
    """
    Генерирует статью через GPT-4o и сохраняет в БД.
    При повторном запросе отдаёт уже сохранённую версию (статья уникальна).
    GET  ?category_slug=...&article_id=... — получить статью из БД
    POST { title, category, excerpt, category_slug, article_id } — сгенерировать и сохранить
    """
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    # GET — отдать из БД если есть
    if event.get('httpMethod') == 'GET':
        params = event.get('queryStringParameters') or {}
        cat_slug = params.get('category_slug', '')
        art_id = params.get('article_id', '')
        if not cat_slug or not art_id:
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'missing params'})}

        article_key = f"{cat_slug}_{art_id}"
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT content, image_url FROM articles WHERE article_key = %s",
            (article_key,)
        )
        row = cur.fetchone()
        conn.close()

        if row and row[1] and row[0] and row[0] != {}:  # контент и image_url должны быть непустыми
            return {
                'statusCode': 200,
                'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'content': row[0], 'image_url': row[1], 'cached': True}),
            }
        return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'cached': False})}

    # POST — сгенерировать и сохранить
    body = json.loads(event.get('body') or '{}')
    title = body.get('title', '')
    category = body.get('category', '')
    excerpt = body.get('excerpt', '')
    category_slug = body.get('category_slug', '')
    article_id = body.get('article_id', '')

    if not title or not category_slug or not article_id:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'title, category_slug, article_id required'})}

    article_key = f"{category_slug}_{article_id}"

    # Проверить кэш в БД
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT content, image_url FROM articles WHERE article_key = %s", (article_key,))
    row = cur.fetchone()
    conn.close()

    if row:
        return {
            'statusCode': 200,
            'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({'content': row[0], 'image_url': row[1], 'cached': True}),
        }

    # Генерировать
    api_key = os.environ.get('OPENAI_API_KEY', '').strip()
    if not api_key:
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'API key not configured'})}

    prompt = f"""Ты — шеф-редактор делового B2B-журнала btwob.ru. Напиши УНИКАЛЬНУЮ, глубокую профессиональную статью на русском языке.

Категория: {category}
Заголовок: {title}
Краткое описание: {excerpt}

ТРЕБОВАНИЯ К СТИЛЮ:
- Деловой, строгий, экспертный тон без маркетинговой воды
- Конкретные цифры, примеры из практики, реальные кейсы
- Целевая аудитория: CEO, CFO, владельцы B2B-компаний
- Статья должна быть УНИКАЛЬНОЙ — не повторяй шаблонные фразы

ТРЕБОВАНИЯ К СТРУКТУРЕ — строго следуй схеме JSON:
- intro: сильный вводный абзац (3-4 предложения), захватывает внимание конкретным фактом
- sections: РОВНО 4 раздела. Каждый раздел имеет:
  - heading: чёткий подзаголовок
  - paragraphs: массив из 2-3 абзацев (каждый 3-5 предложений)
  - list: массив из 3-5 конкретных советов/фактов/шагов — ОБЯЗАТЕЛЬНО
  - quote: один ключевой факт или принцип (1-2 предложения) — ОБЯЗАТЕЛЬНО
- conclusion: заключение с призывом к действию (2-3 предложения)
- key_points: 4 ключевых тезиса всей статьи (кратко, по сути)
- unsplash_query: УНИКАЛЬНЫЙ поисковый запрос на английском для Unsplash (3-5 слов), точно отражающий тему ИМЕННО ЭТОЙ статьи. НЕ используй общие слова вроде "business", "office", "meeting". Используй конкретные понятия из темы статьи: например для статьи о воронке продаж — "sales funnel pipeline diagram", для unit-экономики — "financial metrics dashboard analytics", для найма — "executive interview hiring handshake".

Верни ТОЛЬКО валидный JSON без markdown-обёртки:
{{
  "intro": "...",
  "sections": [
    {{
      "heading": "...",
      "paragraphs": ["абзац 1", "абзац 2"],
      "list": ["пункт 1", "пункт 2", "пункт 3"],
      "quote": "ключевой факт"
    }}
  ],
  "conclusion": "...",
  "key_points": ["тезис 1", "тезис 2", "тезис 3", "тезис 4"],
  "unsplash_query": "specific topic keywords here"
}}"""

    payload = json.dumps({
        'model': 'gpt-4o',
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0.85,
        'response_format': {'type': 'json_object'},
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://polza.ai/api/v1/chat/completions',
        data=payload,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )

    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read()
        result = json.loads(raw.decode('utf-8'))

    content = json.loads(result['choices'][0]['message']['content'])
    unsplash_query = content.pop('unsplash_query', f"{title} {category}")
    image_url = fetch_unsplash_image(unsplash_query, seed=int(article_id))

    # Сохранить в БД
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO articles (article_key, category_slug, article_id, title, category_name, excerpt, content, image_url)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
           ON CONFLICT (article_key) DO UPDATE SET image_url = EXCLUDED.image_url, updated_at = NOW()""",
        (article_key, category_slug, int(article_id), title, category, excerpt, json.dumps(content), image_url)
    )
    conn.commit()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({'content': content, 'image_url': image_url, 'cached': False}),
    }