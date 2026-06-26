import json
import os
import urllib.request
# v2

def handler(event: dict, context) -> dict:
    """
    Генерирует полный текст статьи по заголовку и категории через GPT-4o.
    Принимает: { "title": "...", "category": "...", "excerpt": "..." }
    Возвращает: { "content": [...sections] }
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
    print(f"[DEBUG] key length={len(api_key)}, prefix={api_key[:8] if api_key else 'EMPTY'}")
    if not api_key:
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'API key not configured'})}

    prompt = f"""Ты — редактор делового B2B-журнала btwob.ru. Напиши полную профессиональную статью на русском языке.

Категория: {category}
Заголовок: {title}
Краткое описание: {excerpt}

Требования:
- Деловой, строгий, экспертный стиль без воды
- Структура: 4-5 разделов, каждый с подзаголовком
- Объём: ~800-1000 слов
- Конкретные примеры, цифры, практические советы
- Целевая аудитория: топ-менеджеры и владельцы B2B-бизнеса

Верни JSON строго в таком формате (без markdown обёртки):
{{
  "intro": "вводный абзац",
  "sections": [
    {{"heading": "Подзаголовок", "text": "Текст раздела..."}},
    {{"heading": "Подзаголовок", "text": "Текст раздела..."}},
    {{"heading": "Подзаголовок", "text": "Текст раздела..."}},
    {{"heading": "Подзаголовок", "text": "Текст раздела..."}}
  ],
  "conclusion": "заключительный абзац с выводами",
  "key_points": ["тезис 1", "тезис 2", "тезис 3"]
}}"""

    payload = json.dumps({
        'model': 'gpt-4o',
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0.7,
        'response_format': {'type': 'json_object'},
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=payload,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )

    with urllib.request.urlopen(req, timeout=25) as resp:
        result = json.loads(resp.read())

    content_str = result['choices'][0]['message']['content']
    content = json.loads(content_str)

    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({'content': content}),
    }