import json
import os
import urllib.request
import urllib.parse
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def fetch_unsplash_image(query: str, seed: int = 1) -> str:
    access_key = os.environ.get('UNSPLASH_ACCESS_KEY', '').strip()
    if access_key:
        try:
            encoded = urllib.parse.quote(query)
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
                idx = seed % len(results)
                # Берём базовый URL без параметров Unsplash (ixid, ixlib и пр.)
                raw_url = results[idx]['urls'].get('raw', results[idx]['urls']['full'])
                raw_base = raw_url.split('?')[0]
                # auto=format → WebP/AVIF для современных браузеров, q=75 оптимальный баланс
                return f"{raw_base}?w=1200&h=630&fit=crop&crop=entropy&auto=format&q=75"
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

    fallbacks = [
        "photo-1454165804606-c3d57bc86b40",
        "photo-1507003211169-0a1dd7228f2d",
        "photo-1521737604893-d14cc237f11d",
        "photo-1551434678-e076c223a692",
        "photo-1460925895917-afdab827c52f",
    ]
    return f"https://images.unsplash.com/{fallbacks[seed % len(fallbacks)]}?w=1200&h=630&fit=crop&auto=format&q=75"

def is_valid_content(content) -> bool:
    """Проверяет что контент реально сгенерирован, а не пустой объект."""
    if not content or not isinstance(content, dict):
        return False
    if not content.get('intro') or not content.get('sections'):
        return False
    return True

def handler(event: dict, context) -> dict:
    """
    Генерирует статью через GPT-4o и сохраняет в БД.
    GET  ?category_slug=...&article_id=... — получить из кэша
    POST { title, category, excerpt, category_slug, article_id } — сгенерировать
    """
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    # GET — отдать из кэша если есть валидный контент
    if event.get('httpMethod') == 'GET':
        params = event.get('queryStringParameters') or {}
        cat_slug = params.get('category_slug', '')
        art_id = params.get('article_id', '')
        if not cat_slug or not art_id:
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'missing params'})}

        article_key = f"{cat_slug}_{art_id}"
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT content, image_url FROM articles WHERE article_key = %s", (article_key,))
        row = cur.fetchone()
        conn.close()

        if row and row[1] and is_valid_content(row[0]):
            return {
                'statusCode': 200,
                'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'content': row[0], 'image_url': row[1], 'cached': True}),
            }
        return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'cached': False})}

    # POST — генерировать
    body = json.loads(event.get('body') or '{}')
    title = body.get('title', '')
    category = body.get('category', '')
    excerpt = body.get('excerpt', '')
    category_slug = body.get('category_slug', '')
    article_id = body.get('article_id', '')

    if not title or not category_slug or not article_id:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'title, category_slug, article_id required'})}

    article_key = f"{category_slug}_{article_id}"

    # Проверить кэш — только если контент валидный
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT content, image_url FROM articles WHERE article_key = %s", (article_key,))
    row = cur.fetchone()
    conn.close()

    if row and row[1] and is_valid_content(row[0]):
        return {
            'statusCode': 200,
            'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({'content': row[0], 'image_url': row[1], 'cached': True}),
        }

    # Генерировать через GPT
    api_key = os.environ.get('OPENAI_API_KEY', '').strip()
    if not api_key:
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'API key not configured'})}

    prompt = f"""Ты — редактор делового B2B-журнала btwob.ru. Напиши профессиональную статью на русском языке.

Категория: {category}
Заголовок: {title}
Краткое описание: {excerpt}

Требования:
- Деловой экспертный тон, конкретные цифры и примеры
- Целевая аудитория: CEO, CFO, владельцы B2B-компаний

Структура JSON (верни ТОЛЬКО JSON без markdown):
{{
  "intro": "вводный абзац 3-4 предложения",
  "sections": [
    {{
      "heading": "подзаголовок",
      "paragraphs": ["абзац 1 (3-4 предложения)", "абзац 2 (3-4 предложения)"],
      "list": ["конкретный пункт 1", "конкретный пункт 2", "конкретный пункт 3", "конкретный пункт 4"],
      "quote": "ключевой факт или принцип"
    }},
    {{
      "heading": "подзаголовок",
      "paragraphs": ["абзац 1", "абзац 2"],
      "list": ["пункт 1", "пункт 2", "пункт 3"],
      "quote": "ключевой факт"
    }},
    {{
      "heading": "подзаголовок",
      "paragraphs": ["абзац 1", "абзац 2"],
      "list": ["пункт 1", "пункт 2", "пункт 3"],
      "quote": "ключевой факт"
    }},
    {{
      "heading": "подзаголовок",
      "paragraphs": ["абзац 1", "абзац 2"],
      "list": ["пункт 1", "пункт 2", "пункт 3"],
      "quote": "ключевой факт"
    }}
  ],
  "conclusion": "заключение 2-3 предложения",
  "key_points": ["тезис 1", "тезис 2", "тезис 3", "тезис 4"],
  "unsplash_query": "3-4 english words specific to this article topic"
}}"""

    payload = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0.7,
        'max_tokens': 3000,
        'response_format': {'type': 'json_object'},
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://polza.ai/api/v1/chat/completions',
        data=payload,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json; charset=utf-8',
        },
        method='POST',
    )

    with urllib.request.urlopen(req, timeout=55) as resp:
        raw = resp.read()
        # Декодируем с заменой — потом вычистим replacement chars
        result = json.loads(raw.decode('utf-8', errors='replace'))

    content_str = result['choices'][0]['message']['content']
    # Убираем U+FFFD (replacement character = знак вопроса в ромбике)
    content_str = content_str.replace('\ufffd', '')
    content = json.loads(content_str)

    # Рекурсивно чистим все строки в контенте
    def clean(obj):
        if isinstance(obj, str):
            return obj.replace('\ufffd', '').replace('\x00', '')
        if isinstance(obj, list):
            return [clean(i) for i in obj]
        if isinstance(obj, dict):
            return {k: clean(v) for k, v in obj.items()}
        return obj

    content = clean(content)

    if not is_valid_content(content):
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'Invalid content from GPT'})}

    unsplash_query = content.pop('unsplash_query', f"{title[:30]}")
    image_url = fetch_unsplash_image(unsplash_query, seed=int(article_id))

    # Сохранить / обновить в БД
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO articles (article_key, category_slug, article_id, title, category_name, excerpt, content, image_url)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
           ON CONFLICT (article_key) DO UPDATE
           SET content = EXCLUDED.content, image_url = EXCLUDED.image_url, updated_at = NOW()""",
        (article_key, category_slug, int(article_id), title, category, excerpt, json.dumps(content, ensure_ascii=False), image_url)
    )
    conn.commit()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json; charset=utf-8'},
        'body': json.dumps({'content': content, 'image_url': image_url, 'cached': False}, ensure_ascii=False),
    }