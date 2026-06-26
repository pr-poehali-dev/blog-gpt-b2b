import json
import os
import uuid
import urllib.request
import urllib.parse
import psycopg2
import datetime

CATEGORIES = [
    {
        "slug": "strategy",
        "name": "Стратегия",
        "topics": [
            "Как масштабировать B2B-бизнес без потери качества",
            "Стратегия выхода на корпоративный рынок: с чего начать",
            "Конкурентный анализ для B2B: методы и инструменты",
            "Партнёрские продажи в B2B: когда и как строить канал",
            "Pivot в B2B: как менять направление без потери клиентов",
            "Стратегия удержания vs стратегия привлечения в B2B",
            "Построение экосистемы вокруг B2B-продукта",
            "Выход на зарубежные рынки: B2B-стратегия экспансии",
            "Как оценить стратегические риски компании",
            "Вертикальная интеграция в B2B: плюсы и ловушки",
        ]
    },
    {
        "slug": "finance",
        "name": "Финансы",
        "topics": [
            "Как читать P&L и что скрывается за цифрами",
            "EBITDA: почему этот показатель любят инвесторы",
            "Финансовое планирование на год: rolling forecast",
            "Управление дебиторской задолженностью в B2B",
            "Оценка бизнеса: методы и когда применять каждый",
            "Стоимость привлечения капитала: долг vs акционерный",
            "Финансовые KPI для операционного директора",
            "Бюджетирование снизу вверх vs сверху вниз",
            "Как снизить операционные расходы без вреда для роста",
            "Финансовая модель для переговоров с инвесторами",
        ]
    },
    {
        "slug": "tech",
        "name": "Технологии",
        "topics": [
            "Цифровая трансформация B2B-компании: с чего начать",
            "No-code инструменты для автоматизации бизнес-процессов",
            "Безопасность корпоративных данных в облаке",
            "API-интеграции для B2B: когда строить, когда покупать",
            "Выбор CRM для сложных B2B-продаж",
            "Data-driven культура в компании: как внедрить",
            "Микросервисы vs монолит для корпоративного SaaS",
            "Автоматизация маркетинга в B2B: стек технологий",
            "Кибербезопасность для среднего бизнеса",
            "Внедрение ERP: как не провалить проект",
        ]
    },
    {
        "slug": "marketing",
        "name": "Маркетинг",
        "topics": [
            "Demand generation в B2B: как создавать спрос",
            "SEO для B2B-компании: долгосрочная стратегия",
            "Вебинары как инструмент B2B-лидогенерации",
            "Как построить бренд B2B-компании с нуля",
            "Email-маркетинг в B2B: сегментация и автоматизация",
            "Ивент-маркетинг для B2B: ROI и измерение результатов",
            "Лидер мнений в B2B: персональный бренд CEO",
            "Product-led growth для B2B SaaS",
            "Маркетинг партнёрских программ в B2B",
            "Analyst relations: работа с отраслевыми аналитиками",
        ]
    },
    {
        "slug": "management",
        "name": "Управление",
        "topics": [
            "Как выстроить систему отчётности в быстрорастущей компании",
            "Корпоративная культура как конкурентное преимущество",
            "Управление изменениями: как минимизировать сопротивление",
            "Построение совета директоров для среднего бизнеса",
            "Как проводить продуктивные стратегические сессии",
            "Система мотивации топ-менеджеров: опционы и KPI",
            "Операционная модель масштабируемой компании",
            "Управление распределённой командой в разных часовых поясах",
            "Антикризисное управление: действия в первые 90 дней",
            "Succession planning: подготовка преемников в B2B",
        ]
    },
    {
        "slug": "sales",
        "name": "Продажи",
        "topics": [
            "Построение отдела продаж с нуля: структура и роли",
            "Скрипты vs методология: что работает в корпоративных продажах",
            "Работа с закупочными комитетами в enterprise",
            "Sales enablement: как вооружить команду продаж",
            "Переговоры об условиях контракта с крупным клиентом",
            "Churn prevention: как удержать B2B-клиентов",
            "Построение системы реферальных продаж",
            "Продажи через партнёров: управление каналом",
            "Как сократить цикл сделки не теряя в качестве",
            "Customer success как драйвер выручки в SaaS",
        ]
    },
]

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

def generate_article(api_key: str, category_name: str, title: str, excerpt: str) -> dict:
    prompt = f"""Ты — редактор делового B2B-журнала btwob.ru. Напиши профессиональную статью на русском языке.

Категория: {category_name}
Заголовок: {title}
Краткое описание: {excerpt}

Требования:
- Деловой экспертный тон, конкретные цифры и примеры
- Целевая аудитория: CEO, CFO, владельцы B2B-компаний

Верни ТОЛЬКО JSON без markdown:
{{
  "intro": "вводный абзац 3-4 предложения с конкретным фактом",
  "sections": [
    {{"heading": "подзаголовок", "paragraphs": ["абзац 1", "абзац 2"], "list": ["пункт 1", "пункт 2", "пункт 3", "пункт 4"], "quote": "ключевой факт"}},
    {{"heading": "подзаголовок", "paragraphs": ["абзац 1", "абзац 2"], "list": ["пункт 1", "пункт 2", "пункт 3"], "quote": "ключевой факт"}},
    {{"heading": "подзаголовок", "paragraphs": ["абзац 1", "абзац 2"], "list": ["пункт 1", "пункт 2", "пункт 3"], "quote": "ключевой факт"}},
    {{"heading": "подзаголовок", "paragraphs": ["абзац 1", "абзац 2"], "list": ["пункт 1", "пункт 2", "пункт 3"], "quote": "ключевой факт"}}
  ],
  "conclusion": "заключение 2-3 предложения",
  "key_points": ["тезис 1", "тезис 2", "тезис 3", "тезис 4"],
  "unsplash_query": "3-4 english words specific to article topic (not generic business/office)"
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

    content_str = result['choices'][0]['message']['content'].replace('\ufffd', '')
    content = json.loads(content_str)
    return clean(content)

def generate_new_topics(api_key: str, category_name: str, used_titles: list, count: int = 3) -> list:
    """GPT генерирует уникальные темы, которых ещё не было."""
    used_str = '\n'.join(f'- {t}' for t in used_titles[-30:]) if used_titles else 'нет'
    prompt = f"""Ты — редактор B2B-журнала. Придумай {count} новые темы статей для категории "{category_name}".

Уже опубликованные темы (НЕ повторяй):
{used_str}

Требования:
- Темы должны быть актуальными для B2B-бизнеса
- Конкретные, не абстрактные
- На русском языке
- Каждая тема — отдельная статья

Верни ТОЛЬКО JSON:
{{"topics": [{{"title": "Заголовок статьи", "excerpt": "Краткое описание 1-2 предложения что раскрывается в статье"}}]}}"""

    payload = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0.9,
        'max_tokens': 800,
        'response_format': {'type': 'json_object'},
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://polza.ai/api/v1/chat/completions',
        data=payload,
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json; charset=utf-8'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read().decode('utf-8', errors='replace'))

    raw = result['choices'][0]['message']['content'].replace('\ufffd', '')
    data = json.loads(raw)
    topics = clean(data.get('topics', []))
    return topics[:count]

def handler(event: dict, context) -> dict:
    """
    Планировщик автопубликации: генерирует 3 новые статьи в день для каждой категории.
    Вызывается по расписанию (cron) или вручную через POST.
    """
    cors = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    api_key = os.environ.get('OPENAI_API_KEY', '').strip()
    if not api_key:
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'API key not configured'})}

    articles_per_category = 3
    results = []
    conn = get_db()

    try:
        for cat in CATEGORIES:
            cat_results = []
            used_titles = get_used_titles(conn, cat['slug'])

            # Генерируем новые темы через GPT (уникальные, не повторяющиеся)
            try:
                new_topics = generate_new_topics(api_key, cat['name'], used_titles, articles_per_category)
            except BaseException as e:
                results.append({'category': cat['slug'], 'error': f'Topic generation failed: {str(e)}'})
                continue

            for i, topic in enumerate(new_topics):
                title = topic.get('title', '')
                excerpt = topic.get('excerpt', '')
                if not title:
                    continue

                # Пропускаем если такой заголовок уже есть
                if title in used_titles:
                    continue

                try:
                    content = generate_article(api_key, cat['name'], title, excerpt)
                    unsplash_query = content.pop('unsplash_query', f"{title[:30]}")

                    # Уникальный ключ на основе UUID
                    article_key = f"{cat['slug']}_{uuid.uuid4().hex[:8]}"
                    seed = hash(title) % 1000
                    image_url = fetch_unsplash_image(unsplash_query, seed=abs(seed))

                    # Вычисляем примерное время чтения (150 слов/мин)
                    word_count = sum(len(p.split()) for s in content.get('sections', []) for p in s.get('paragraphs', []))
                    word_count += len(content.get('intro', '').split())
                    read_minutes = max(3, round(word_count / 150))

                    cur = conn.cursor()
                    cur.execute(
                        """INSERT INTO articles
                           (article_key, category_slug, article_id, title, category_name, excerpt,
                            content, image_url, read_time, is_published, published_at)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE, NOW())""",
                        (article_key, cat['slug'], 0, title, cat['name'], excerpt,
                         json.dumps(content, ensure_ascii=False), image_url,
                         f"{read_minutes} мин")
                    )
                    conn.commit()
                    cat_results.append({'title': title, 'key': article_key})
                    used_titles.append(title)

                except BaseException as e:
                    cat_results.append({'title': title, 'error': str(e)})

            results.append({'category': cat['slug'], 'published': cat_results})

    finally:
        conn.close()

    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({'results': results, 'generated_at': datetime.datetime.utcnow().isoformat()}, ensure_ascii=False),
    }
