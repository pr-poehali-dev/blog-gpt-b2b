import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { categories, getCategory } from '@/data/categories';
import { useSeo } from '@/hooks/useSeo';
import func2url from '../../backend/func2url.json';

const ARTICLES_API = (func2url as Record<string, string>)['articles-api'];
const GENERATE_URL = (func2url as Record<string, string>)['generate-article'];

interface Section {
  heading: string;
  paragraphs: string[];
  list: string[];
  quote: string;
}

interface ArticleContent {
  intro: string;
  sections: Section[];
  conclusion: string;
  key_points: string[];
}

interface FullArticle {
  article_key: string;
  category_slug: string;
  title: string;
  category_name: string;
  excerpt: string;
  content: ArticleContent;
  image_url: string | null;
  read_time: string;
  views: number;
  published_at: string;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return iso; }
};

const Article = () => {
  const { categorySlug, articleId } = useParams();
  const location = useLocation();

  const category = getCategory(categorySlug || '');
  const [article, setArticle] = useState<FullArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const accentStyle = category
    ? ({ '--accent': category.accent, '--accent-foreground': category.accentForeground } as React.CSSProperties)
    : {};

  useSeo(category && article ? {
    title: `${article.title} | ${category.name} — BTWOB`,
    description: article.excerpt,
    canonical: `/article/${category.slug}/${article.article_key}`,
    ogImage: article.image_url || undefined,
    ogType: 'article',
    keywords: `${article.title}, ${category.name} B2B, деловой журнал, ${category.tagline}`,
    publishedTime: article.published_at,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.excerpt,
        image: article.image_url || 'https://btwob.ru/og-default.jpg',
        datePublished: article.published_at,
        author: { '@type': 'Organization', name: 'BTWOB', url: 'https://btwob.ru' },
        publisher: { '@type': 'Organization', name: 'BTWOB', logo: { '@type': 'ImageObject', url: 'https://btwob.ru/favicon.svg' } },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `https://btwob.ru/article/${categorySlug}/${articleId}` },
        articleSection: category.name,
        inLanguage: 'ru',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://btwob.ru' },
          { '@type': 'ListItem', position: 2, name: category.name, item: `https://btwob.ru/category/${category.slug}` },
          { '@type': 'ListItem', position: 3, name: article.title, item: `https://btwob.ru/article/${categorySlug}/${articleId}` },
        ],
      },
    ],
  } : { title: 'Статья — BTWOB', description: 'B2B деловой журнал' });

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!articleId) return;
    setLoading(true);
    setError('');

    // article_key может быть как UUID-ключ (новый формат), так и slug_id (старый)
    fetch(`${ARTICLES_API}?article_key=${articleId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.content?.intro) {
          setArticle(data);
        } else {
          // Старый формат: пробуем generate-article GET
          const catSlug = categorySlug || '';
          fetch(`${GENERATE_URL}?category_slug=${catSlug}&article_id=${articleId}`)
            .then((r) => r.ok ? r.json() : null)
            .then((legacyData) => {
              if (legacyData?.content?.intro) {
                // Собираем совместимый объект
                const staticCat = getCategory(catSlug);
                const staticArt = staticCat?.articles.find((a) => String(a.id) === articleId);
                setArticle({
                  article_key: articleId,
                  category_slug: catSlug,
                  title: staticArt?.title || '',
                  category_name: staticCat?.name || '',
                  excerpt: staticArt?.excerpt || '',
                  content: legacyData.content,
                  image_url: legacyData.image_url || null,
                  read_time: staticArt?.read || '5 мин',
                  views: 0,
                  published_at: new Date().toISOString(),
                });
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [location.pathname]);

  const generate = async () => {
    if (!categorySlug || !articleId) return;
    setGenerating(true);
    setError('');
    // Только для старого формата (числовой id)
    const staticCat = getCategory(categorySlug);
    const staticArt = staticCat?.articles.find((a) => String(a.id) === articleId);
    if (!staticArt || !staticCat) { setGenerating(false); return; }
    try {
      const res = await fetch(GENERATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: staticArt.title, category: staticCat.name, excerpt: staticArt.excerpt, category_slug: categorySlug, article_id: articleId }),
      });
      const data = await res.json();
      if (data.content) {
        setArticle((prev) => prev ? { ...prev, content: data.content, image_url: data.image_url || prev.image_url } : null);
      } else setError(data.error || 'Ошибка генерации');
    } catch { setError('Ошибка соединения'); }
    finally { setGenerating(false); }
  };

  if (!category) return (
    <div className="min-h-screen bg-background grain flex flex-col items-center justify-center text-center px-6">
      <h1 className="font-display text-4xl font-semibold mb-4">Статья не найдена</h1>
      <Link to="/" className="text-accent underline-grow">На главную</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground" style={accentStyle}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-foreground flex items-center justify-center">
              <span className="font-display font-bold text-background text-sm">B</span>
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">BTWOB</span>
          </Link>
          <nav className="hidden md:flex items-center gap-9 text-sm font-medium">
            <Link to="/" className="underline-grow">Главная</Link>
            <Link to={`/category/${category.slug}`} className="underline-grow">{category.name}</Link>
          </nav>
          <Link to={`/category/${category.slug}`} className="flex items-center gap-2 border border-border px-4 py-2 text-sm font-medium hover:border-foreground transition-colors">
            <Icon name="ArrowLeft" size={15} />
            Назад
          </Link>
        </div>
      </header>

      {/* Hero image */}
      <section className="relative">
        <div className="w-full h-[420px] md:h-[520px] overflow-hidden relative">
          {article?.image_url ? (
            <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" loading="eager" decoding="async" fetchPriority="high" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: `hsl(${category.accent})` }}>
              <Icon name={category.icon} size={96} style={{ color: `hsl(${category.accentForeground})`, opacity: 0.4 }} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 container pb-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4 text-xs font-mono uppercase tracking-[0.2em]" style={{ color: `hsl(${category.accent})` }}>
                <span className="w-6 h-px" style={{ background: `hsl(${category.accent})` }} />
                {category.name} · {article?.read_time || '—'}
              </div>
              {loading ? (
                <div className="h-12 w-2/3 bg-white/10 animate-pulse rounded" />
              ) : (
                <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight tracking-tight text-white text-balance">
                  {article?.title || 'Загрузка...'}
                </h1>
              )}
              {article && (
                <div className="mt-5 flex items-center gap-6 text-sm text-white/70">
                  <span className="flex items-center gap-1.5"><Icon name="Calendar" size={14} /> {formatDate(article.published_at)}</span>
                  <span className="flex items-center gap-1.5"><Icon name="Eye" size={14} /> {article.views}</span>
                  <span className="flex items-center gap-1.5"><Icon name="Clock" size={14} /> {article.read_time}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="h-1 w-full" style={{ background: `hsl(${category.accent})` }} />
      </section>

      {/* Breadcrumb */}
      <div className="container pt-7 pb-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors">Главная</Link>
          <Icon name="ChevronRight" size={13} />
          <Link to={`/category/${category.slug}`} className="hover:text-foreground transition-colors">{category.name}</Link>
          <Icon name="ChevronRight" size={13} />
          <span className="text-foreground truncate max-w-[260px]">{article?.title}</span>
        </div>
      </div>

      {/* Content */}
      <section className="container py-10 md:py-16">
        <div className="grid lg:grid-cols-[1fr_300px] gap-14 items-start">
          <div className="min-w-0">
            {article?.excerpt && (
              <p className="text-xl md:text-2xl leading-relaxed text-foreground/80 font-medium border-l-4 pl-6 mb-10" style={{ borderColor: `hsl(${category.accent})` }}>
                {article.excerpt}
              </p>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col gap-4 py-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted animate-pulse rounded" style={{ width: `${80 + (i % 3) * 10}%` }} />
                ))}
              </div>
            )}

            {/* No content — generate */}
            {!loading && !article?.content?.intro && (
              <div className="border border-dashed border-border p-10 flex flex-col items-center text-center gap-6">
                <div className="w-14 h-14 flex items-center justify-center" style={{ background: `hsl(${category.accent} / 0.1)` }}>
                  <Icon name="Sparkles" size={28} style={{ color: `hsl(${category.accent})` }} />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold mb-2">Статья ещё не сгенерирована</p>
                  <p className="text-sm text-muted-foreground">GPT-4o mini напишет полный текст</p>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button onClick={generate} disabled={generating} className="flex items-center gap-2 px-8 py-3.5 text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-50" style={{ background: `hsl(${category.accent})`, color: `hsl(${category.accentForeground})` }}>
                  {generating ? <><div className="w-4 h-4 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: `hsl(${category.accentForeground})` }} /> Генерируется...</> : <><Icon name="Zap" size={16} /> Сгенерировать</>}
                </button>
              </div>
            )}

            {/* Article body */}
            {article?.content?.intro && (
              <article>
                <p className="text-lg leading-[1.9] text-foreground mb-12 pb-12 border-b border-border">
                  {article.content.intro}
                </p>
                {article.content.sections?.map((s, i) => (
                  <div key={i} className="mb-14">
                    <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-6 flex items-baseline gap-3">
                      <span className="font-mono text-xs font-normal shrink-0 px-2 py-1" style={{ background: `hsl(${category.accent})`, color: `hsl(${category.accentForeground})` }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {s.heading}
                    </h2>
                    <div className="space-y-5 mb-8">
                      {s.paragraphs?.map((p, j) => <p key={j} className="text-base leading-[1.9] text-foreground/85">{p}</p>)}
                    </div>
                    {s.list?.length > 0 && (
                      <ul className="mb-8 space-y-3 border-l-2 pl-6" style={{ borderColor: `hsl(${category.accent} / 0.4)` }}>
                        {s.list.map((item, j) => (
                          <li key={j} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/80">
                            <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: `hsl(${category.accent})` }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                    {s.quote && (
                      <blockquote className="my-8 px-7 py-5 border-l-4 bg-foreground/[0.03]" style={{ borderColor: `hsl(${category.accent})` }}>
                        <p className="text-base font-medium leading-relaxed text-foreground/90 italic">{s.quote}</p>
                      </blockquote>
                    )}
                    {i < (article.content.sections?.length ?? 0) - 1 && (
                      <div className="mt-14 flex items-center gap-4"><div className="flex-1 h-px bg-border" /><span className="font-mono text-xs text-muted-foreground">§</span><div className="flex-1 h-px bg-border" /></div>
                    )}
                  </div>
                ))}
                {article.content.conclusion && (
                  <div className="mt-12 pt-10 border-t-2 border-border">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-6 h-6 flex items-center justify-center" style={{ background: `hsl(${category.accent})` }}>
                        <Icon name="CheckCheck" size={14} style={{ color: `hsl(${category.accentForeground})` }} />
                      </div>
                      <h2 className="font-display text-xl font-semibold tracking-tight">Итоги</h2>
                    </div>
                    <p className="text-base leading-[1.9] text-foreground/85">{article.content.conclusion}</p>
                  </div>
                )}
                <div className="mt-12 pt-8 border-t border-border flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Материал создан при поддержке <a href="https://i-hunt.ru/" target="_blank" rel="noopener noreferrer" className="font-medium underline-grow hover:opacity-70 transition-opacity" style={{ color: `hsl(${category.accent})` }}>iHUNT</a></span>
                </div>
              </article>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col gap-6 sticky top-24">
            {article?.content?.key_points && (
              <div className="border border-border p-7">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-5 flex items-center gap-2">
                  <Icon name="Lightbulb" size={13} /> Ключевые тезисы
                </div>
                <ul className="space-y-4">
                  {article.content.key_points.map((kp, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                      <span className="w-5 h-5 shrink-0 flex items-center justify-center text-xs font-mono mt-0.5" style={{ background: `hsl(${category.accent})`, color: `hsl(${category.accentForeground})` }}>{i + 1}</span>
                      {kp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="border border-border p-7" style={{ borderLeftColor: `hsl(${category.accent})`, borderLeftWidth: '3px' }}>
              <div className="flex items-center gap-2 mb-4">
                <Icon name={category.icon} size={18} style={{ color: `hsl(${category.accent})` }} />
                <span className="font-display text-lg font-semibold">{category.name}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{category.description}</p>
              <Link to={`/category/${category.slug}`} className="flex items-center gap-2 text-sm font-medium" style={{ color: `hsl(${category.accent})` }}>
                Все статьи <Icon name="ArrowRight" size={15} />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border container py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-foreground flex items-center justify-center">
              <span className="font-display font-bold text-background text-xs">B</span>
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">BTWOB</span>
            <span className="text-sm text-muted-foreground ml-2">btwob.ru</span>
          </Link>
          <span className="text-xs text-muted-foreground font-mono">© 2026 BTWOB</span>
        </div>
      </footer>
    </div>
  );
};

export default Article;