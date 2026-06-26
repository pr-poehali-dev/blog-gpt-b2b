import json
import os
import uuid
import random
import urllib.request
import urllib.parse
import psycopg2
import datetime

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def clean(obj):
    if isinstance(obj, str):
        return obj.replace('\ufffd', '').replace('\x00', '')
    if isinstance(obj, list):
        return [clean(i) for i in obj]
    if isinstance(obj, dict):
        return {k: clean(v) for k, v in obj.items()}
    return obj

def fetch_unsplash_image(query: str, seed: int = 1) -> str:
    access_key = os.environ.get('UNSPLASH_ACCESS_KEY', '').strip()
    if access_key:
        try:
            encoded = urllib.parse.quote(query)
            page = (seed % 5) + 1
            url = (f"https://api.unsplash.com/search/photos"
                   f"?query={encoded}&per_page=5&page={page}&orientation=landscape&content_filter=high")
            req = urllib.request.Request(url)
            req.add_header('Authorization', f'Client-ID {access_key}')
            req.add_header('Accept-Version', 'v1')
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
            results = data.get('results', [])
            if results:
                idx = seed % len(results)
                raw_url = results[idx]['urls'].get('raw', results[idx]['urls']['full'])
                base = raw_url.split('?')[0]
                return f"{base}?w=1200&h=630&fit=crop&crop=entropy&auto=format&q=75"
        except BaseException:
            pass
    fallbacks = [
        "photo-1454165804606-c3d57bc86b40", "photo-1507003211169-0a1dd7228f2d",
        "photo-1521737604893-d14cc237f11d", "photo-1551434678-e076c223a692",
        "photo-1460925895917-afdab827c52f",
    ]
    return f"https://images.unsplash.com/{fallbacks[seed % len(fallbacks)]}?w=1200&h=630&fit=crop&auto=format&q=75"

def get_used_titles(conn, category_slug: str) -> list:
    cur = conn.cursor()
    cur.execute("SELECT title FROM articles WHERE category_slug = %s", (category_slug,))
    return [row[0] for row in cur.fetchall()]

def generate_topic(api_key: str, category_name: str, used_titles: list) -> dict:
    """Генерирует одну новую тему, которой ещё не было."""
    used_str = '\n'.join(f'- {t}' for t in used_titles[-20:]) if used_titles else 'нет'
    prompt = f"""Придумай одну новую тему статьи для B2B-журнала в категории "{category_name}".

Уже опубликованные темы (НЕ повторяй):
{used_str}

Требования: актуально для B2B, конкретно, на русском.

Верни ТОЛЬКО JSON:
{{"title": "Заголовок статьи", "excerpt": "Краткое описание 1-2 предложения"}}"""

    payload = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0.9,
        'max_tokens': 200,
        'response_format': {'type': 'json_object'},
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://polza.ai/api/v1/chat/completions',
        data=payload,
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json; charset=utf-8'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read().decode('utf-8', errors='replace'))
    raw = result['choices'][0]['message']['content'].replace('\ufffd', '')
    return clean(json.loads(raw))

def generate_article_content(api_key: str, category_name: str, title: str, excerpt: str) -> dict:
    """Генерирует полный текст статьи."""
    prompt = f"""Ты — редактор делового B2B-журнала btwob.ru. Напиши профессиональную статью на русском языке.

Категория: {category_name}
Заголовок: {title}
Краткое описание: {excerpt}

Требования: деловой экспертный тон, конкретные цифры, аудитория — CEO и владельцы B2B.

Верни ТОЛЬКО JSON без markdown:
{{
  "intro": "вводный абзац 3-4 предложения",
  "sections": [
    {{"heading": "подзаголовок", "paragraphs": ["абзац 1", "абзац 2"], "list": ["пункт 1", "пункт 2", "пункт 3"], "quote": "ключевой факт"}},
    {{"heading": "подзаголовок", "paragraphs": ["абзац 1", "абзац 2"], "list": ["пункт 1", "пункт 2", "пункт 3"], "quote": "ключевой факт"}},
    {{"heading": "подзаголовок", "paragraphs": ["абзац 1", "абзац 2"], "list": ["пункт 1", "пункт 2", "пункт 3"], "quote": "ключевой факт"}},
    {{"heading": "подзаголовок", "paragraphs": ["абзац 1", "абзац 2"], "list": ["пункт 1", "пункт 2", "пункт 3"], "quote": "ключевой факт"}}
  ],
  "conclusion": "заключение 2-3 предложения",
  "key_points": ["тезис 1", "тезис 2", "тезис 3", "тезис 4"],
  "unsplash_query": "3-4 english words specific to this article topic"
}}"""

    payload = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0.8,
        'max_tokens': 3000,
        'response_format': {'type': 'json_object'},
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://polza.ai/api/v1/chat/completions',
        data=payload,
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json; charset=utf-8'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=55) as resp:
        result = json.loads(resp.read().decode('utf-8', errors='replace'))
    raw = result['choices'][0]['message']['content'].replace('\ufffd', '')
    return clean(json.loads(raw))

CATEGORY_NAMES = {
    'strategy': 'Стратегия',
    'finance': 'Финансы',
    'tech': 'Технологии',
    'marketing': 'Маркетинг',
    'management': 'Управление',
    'sales': 'Продажи',
}

def handler(event: dict, context) -> dict:
    """
    Генерирует ОДНУ статью для указанной категории и сохраняет в БД.
    POST { "category_slug": "strategy" }
    Возвращает { "title": "...", "article_key": "..." }
    Вызывается последовательно с фронтенда по одной статье за раз.
    """
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    category_slug = body.get('category_slug', '')

    if not category_slug or category_slug not in CATEGORY_NAMES:
        return {'statusCode': 400, 'headers': cors,
                'body': json.dumps({'error': f'Unknown category: {category_slug}'})}

    api_key = os.environ.get('OPENAI_API_KEY', '').strip()
    if not api_key:
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'API key not configured'})}

    category_name = CATEGORY_NAMES[category_slug]
    conn = get_db()

    try:
        used_titles = get_used_titles(conn, category_slug)

        # 1. Генерируем тему
        topic = generate_topic(api_key, category_name, used_titles)
        title = topic.get('title', '').strip()
        excerpt = topic.get('excerpt', '').strip()

        if not title:
            return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'Empty title from GPT'})}

        # 2. Генерируем контент
        content = generate_article_content(api_key, category_name, title, excerpt)
        if not content.get('intro') or not content.get('sections'):
            return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'Invalid content from GPT'})}

        unsplash_query = content.pop('unsplash_query', title[:30])
        seed = abs(hash(title)) % 1000
        image_url = fetch_unsplash_image(unsplash_query, seed=seed)

        # 3. Время чтения
        word_count = sum(len(p.split()) for s in content.get('sections', []) for p in s.get('paragraphs', []))
        word_count += len(content.get('intro', '').split())
        read_minutes = max(3, round(word_count / 150))

        # 4. Сохраняем
        article_key = f"{category_slug}_{uuid.uuid4().hex[:8]}"
        initial_views = random.randint(500, 3500)
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO articles
               (article_key, category_slug, article_id, title, category_name, excerpt,
                content, image_url, read_time, views, is_published, published_at)
               VALUES (%s, %s, 0, %s, %s, %s, %s, %s, %s, %s, TRUE, NOW())""",
            (article_key, category_slug, title, category_name, excerpt,
             json.dumps(content, ensure_ascii=False), image_url, f"{read_minutes} мин", initial_views)
        )
        conn.commit()

    finally:
        conn.close()

    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({
            'title': title,
            'article_key': article_key,
            'category_slug': category_slug,
            'published_at': datetime.datetime.utcnow().isoformat(),
        }, ensure_ascii=False),
    }