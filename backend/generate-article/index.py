import json
import os
import urllib.request
import urllib.parse
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def fetch_unsplash_image(query: str) -> str:
    """Ищет фото через официальный Unsplash API, берёт первый результат в размере 1280px."""
    access_key = os.environ.get('UNSPLASH_ACCESS_KEY', '').strip()

    if access_key:
        try:
            encoded = urllib.parse.quote(query)
            url = f"https://api.unsplash.com/search/photos?query={encoded}&per_page=1&orientation=landscape&content_filter=high"
            req = urllib.request.Request(url)
            req.add_header('Authorization', f'Client-ID {access_key}')
            req.add_header('Accept-Version', 'v1')
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read())
            results = data.get('results', [])
            if results:
                img_url = results[0]['urls'].get('regular', results[0]['urls']['full'])
                return img_url
        except BaseException:
            pass

    # Fallback: source.unsplash.com (без ключа, менее стабильный)
    try:
        encoded = urllib.parse.quote(query)
        url = f"https://source.unsplash.com/featured/1280x720/?{encoded}"
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.geturl()
    except BaseException:
        pass

    return f"https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1280&q=80"

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

        if row:
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
- unsplash_query: поисковый запрос на английском для Unsplash (2-4 слова)

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
  "unsplash_query": "business strategy"
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
        result = json.loads(resp.read())

    content = json.loads(result['choices'][0]['message']['content'])
    unsplash_query = content.pop('unsplash_query', f"{category} business")
    image_url = fetch_unsplash_image(unsplash_query)

    # Сохранить в БД
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO articles (article_key, category_slug, article_id, title, category_name, excerpt, content, image_url)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
           ON CONFLICT (article_key) DO NOTHING""",
        (article_key, category_slug, int(article_id), title, category, excerpt, json.dumps(content), image_url)
    )
    conn.commit()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({'content': content, 'image_url': image_url, 'cached': False}),
    }