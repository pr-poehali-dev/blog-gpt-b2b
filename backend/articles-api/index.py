import json
import os
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """
    API для получения статей из БД.
    GET ?category_slug=... — список статей категории (последние 20)
    GET ?category_slug=...&article_key=... — конкретная статья
    """
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    params = event.get('queryStringParameters') or {}
    category_slug = params.get('category_slug', '')
    article_key = params.get('article_key', '')

    conn = get_db()
    cur = conn.cursor()

    try:
        if article_key:
            # Получить конкретную статью
            cur.execute(
                """SELECT article_key, category_slug, title, category_name, excerpt,
                          content, image_url, read_time, views, published_at
                   FROM articles
                   WHERE article_key = %s AND is_published = TRUE AND content != '{}'""",
                (article_key,)
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'not found'})}

            # Увеличиваем счётчик просмотров
            cur.execute("UPDATE articles SET views = views + 1 WHERE article_key = %s", (article_key,))
            conn.commit()

            article = {
                'article_key': row[0],
                'category_slug': row[1],
                'title': row[2],
                'category_name': row[3],
                'excerpt': row[4],
                'content': row[5],
                'image_url': row[6],
                'read_time': row[7],
                'views': row[8],
                'published_at': row[9].isoformat() if row[9] else None,
            }
            return {
                'statusCode': 200,
                'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps(article, ensure_ascii=False, default=str),
            }

        elif category_slug:
            # Список статей категории
            cur.execute(
                """SELECT article_key, title, excerpt, image_url, read_time, views, published_at
                   FROM articles
                   WHERE category_slug = %s AND is_published = TRUE AND content != '{}'
                   ORDER BY published_at DESC
                   LIMIT 20""",
                (category_slug,)
            )
            rows = cur.fetchall()
            articles = [
                {
                    'article_key': r[0],
                    'title': r[1],
                    'excerpt': r[2],
                    'image_url': r[3],
                    'read_time': r[4],
                    'views': r[5],
                    'published_at': r[6].isoformat() if r[6] else None,
                }
                for r in rows
            ]
            return {
                'statusCode': 200,
                'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'articles': articles, 'total': len(articles)}, ensure_ascii=False, default=str),
            }

        else:
            # Все последние статьи (для главной)
            cur.execute(
                """SELECT article_key, category_slug, category_name, title, excerpt,
                          image_url, read_time, views, published_at
                   FROM articles
                   WHERE is_published = TRUE AND content != '{}'
                   ORDER BY published_at DESC
                   LIMIT 12""",
            )
            rows = cur.fetchall()
            articles = [
                {
                    'article_key': r[0],
                    'category_slug': r[1],
                    'category_name': r[2],
                    'title': r[3],
                    'excerpt': r[4],
                    'image_url': r[5],
                    'read_time': r[6],
                    'views': r[7],
                    'published_at': r[8].isoformat() if r[8] else None,
                }
                for r in rows
            ]
            return {
                'statusCode': 200,
                'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'articles': articles}, ensure_ascii=False, default=str),
            }

    finally:
        conn.close()
