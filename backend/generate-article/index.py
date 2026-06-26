import json
import os
import urllib.request
import urllib.parse

def fetch_unsplash_image(query: str) -> str:
    """Получает URL фото из Unsplash по запросу."""
    encoded = urllib.parse.quote(query)
    url = f"https://source.unsplash.com/1200x630/?{encoded},business"
    req = urllib.request.Request(url, method='HEAD')
    req.add_header('User-Agent', 'Mozilla/5.0')
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return resp.geturl()
    except BaseException:
        return "https://source.unsplash.com/1200x630/?business,office"

def handler(event: dict, context) -> dict:
    """
    Генерирует структурированную статью через GPT-4o и подбирает фото из Unsplash.
    Принимает: { "title": "...", "category": "...", "excerpt": "..." }
    Возвращает: { "content": {...}, "image_url": "..." }
    """
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    title = body.get('title', '')
    category = body.get('category', '')
    excerpt = body.get('excerpt', '')

    if not title:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'title is required'})}

    api_key = os.environ.get('OPENAI_API_KEY', '').strip()
    if not api_key:
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'API key not configured'})}

    prompt = f"""Ты — шеф-редактор делового B2B-журнала btwob.ru. Напиши глубокую профессиональную статью на русском языке.

Категория: {category}
Заголовок: {title}
Краткое описание: {excerpt}

ТРЕБОВАНИЯ К СТИЛЮ:
- Деловой, строгий, экспертный тон без маркетинговой воды
- Конкретные цифры, примеры из практики, кейсы
- Целевая аудитория: CEO, CFO, владельцы B2B-компаний

ТРЕБОВАНИЯ К СТРУКТУРЕ — строго следуй схеме JSON:
- intro: сильный вводный абзац (3-4 предложения), захватывает внимание
- sections: РОВНО 4 раздела. Каждый раздел имеет:
  - heading: чёткий подзаголовок
  - paragraphs: массив из 2-3 абзацев (каждый 3-5 предложений)
  - list: массив из 3-5 пунктов (конкретные советы/факты/шаги) — ОБЯЗАТЕЛЬНО
  - quote: одна короткая цитата или ключевой факт (1-2 предложения) — ОБЯЗАТЕЛЬНО
- conclusion: заключение с призывом к действию (2-3 предложения)  
- key_points: 4 ключевых тезиса всей статьи (кратко, по сути)
- unsplash_query: поисковый запрос на английском для Unsplash (2-4 слова, тематика статьи)

Верни ТОЛЬКО валидный JSON без markdown-обёртки:
{{
  "intro": "...",
  "sections": [
    {{
      "heading": "...",
      "paragraphs": ["абзац 1", "абзац 2", "абзац 3"],
      "list": ["пункт 1", "пункт 2", "пункт 3", "пункт 4"],
      "quote": "ключевой факт или мысль"
    }}
  ],
  "conclusion": "...",
  "key_points": ["тезис 1", "тезис 2", "тезис 3", "тезис 4"],
  "unsplash_query": "business strategy meeting"
}}"""

    payload = json.dumps({
        'model': 'gpt-4o',
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0.7,
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

    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({'content': content, 'image_url': image_url}),
    }