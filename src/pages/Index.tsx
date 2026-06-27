import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { categories } from '@/data/categories';
import { useSeo } from '@/hooks/useSeo';
import func2url from '../../backend/func2url.json';

const ARTICLES_API = (func2url as Record<string, string>)['articles-api'];

interface DbArticle {
  article_key: string;
  category_slug: string;
  category_name: string;
  title: string;
  excerpt: string;
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

const stats = [
  { label: 'Просмотров за месяц', value: '1.2M', delta: '+18%', icon: 'Eye' },
  { label: 'Откликов и комментариев', value: '34.7K', delta: '+9%', icon: 'MessageSquare' },
  { label: 'Постов в публикации', value: '238', delta: '+24', icon: 'FileText' },
  { label: 'Подписок на рассылку', value: '48.9K', delta: '+12%', icon: 'Mail' },
];

const Index = () => {
  const [active, setActive] = useState('Все');
  const [allArticles, setAllArticles] = useState<DbArticle[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 6;

  const fetchArticles = (filterActive: string, currentPage: number, append = false) => {
    const loading = append ? setLoadingMore : (v: boolean) => setLoadingArticles(v);
    loading(true);

    if (filterActive === 'Все') {
      // Страница 1 — по одной из каждой категории
      // Страница 2+ — следующие по одной из каждой (offset)
      const offset = (currentPage - 1) * 1; // по 1 из каждой на страницу
      Promise.all(
        categories.map(c =>
          fetch(`${ARTICLES_API}?category_slug=${c.slug}&offset=${offset}`)
            .then(r => r.json())
            .then(d => (d.articles || [])[0] || null)
            .catch(() => null)
        )
      ).then(results => {
        const fresh = results.filter(Boolean) as DbArticle[];
        setAllArticles(prev => append ? [...prev, ...fresh] : fresh);
        setHasMore(fresh.length === categories.length);
      }).finally(() => loading(false));
    } else {
      const slug = categories.find(c => c.name === filterActive)?.slug || '';
      const offset = (currentPage - 1) * PAGE_SIZE;
      fetch(`${ARTICLES_API}?category_slug=${slug}&offset=${offset}&limit=${PAGE_SIZE}`)
        .then(r => r.json())
        .then(data => {
          const fresh = data.articles || [];
          setAllArticles(prev => append ? [...prev, ...fresh] : fresh);
          setHasMore(fresh.length === PAGE_SIZE);
        })
        .catch(() => { setAllArticles([]); setHasMore(false); })
        .finally(() => loading(false));
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(false);
    fetchArticles(active, 1, false);
  }, [active]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchArticles(active, next, true);
  };

  useSeo({
    title: 'BTWOB — B2B деловой журнал о стратегии, финансах и технологиях',
    description: 'Экспертные статьи для топ-менеджеров и владельцев B2B-компаний. Стратегия, финансы, технологии, маркетинг, управление и продажи.',
    canonical: '/',
    keywords: 'B2B журнал, бизнес статьи, стратегия бизнеса, B2B маркетинг, управление компанией, финансы B2B',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'BTWOB',
        url: 'https://btwob.ru',
        description: 'Деловой B2B журнал — стратегия, финансы, технологии, маркетинг',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://btwob.ru/?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'BTWOB',
        url: 'https://btwob.ru',
        logo: 'https://btwob.ru/favicon.svg',
        sameAs: ['https://btwob.ru'],
      },
    ],
  });

  const activeCategory = categories.find((c) => c.name === active) ?? null;

  // allArticles уже содержит нужный набор (1 из каждой или все из категории)
  const visibleArticles = allArticles;

  const featured = visibleArticles[0] ?? null;
  const rest = visibleArticles.slice(1);

  return (
    <div className="min-h-screen bg-background grain text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <a href="#" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-foreground flex items-center justify-center">
              <span className="font-display font-bold text-background text-sm tracking-tight">B</span>
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">BTWOB</span>
          </a>
          <nav className="hidden md:flex items-center gap-9 text-sm font-medium">
            <a href="#" className="underline-grow">Главная</a>
            <a href="#categories" className="underline-grow">Категории</a>
            <a href="#articles" className="underline-grow">Статьи</a>
          </nav>
          <button className="flex items-center gap-2 bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
            <Icon name="Mail" size={15} />
            Подписаться
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border overflow-hidden">
        <div className="container py-20 md:py-28">
          <div className="reveal flex items-center gap-3 mb-7 text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            <span className="w-8 h-px bg-accent" />
            Деловой журнал · btwob.ru
          </div>
          <h1 className="reveal font-display text-5xl md:text-7xl lg:text-8xl font-700 leading-[0.95] tracking-tight max-w-4xl text-balance" style={{ animationDelay: '0.05s', fontWeight: 700 }}>
            Бизнес-аналитика,<br />которой <span className="text-accent">доверяют</span>
          </h1>
          <p className="reveal mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed" style={{ animationDelay: '0.15s' }}>
            Стратегия, технологии и управление для тех, кто принимает решения. Свежие материалы каждый день — отобранные и выверенные.
          </p>
          <div className="reveal mt-10 flex flex-wrap items-center gap-4" style={{ animationDelay: '0.25s' }}>
            <a href="#articles" className="flex items-center gap-2 bg-foreground text-background px-7 py-3.5 text-sm font-medium hover:bg-accent transition-colors">
              Читать статьи
              <Icon name="ArrowRight" size={16} />
            </a>
            <a href="#categories" className="flex items-center gap-2 border border-border px-7 py-3.5 text-sm font-medium hover:border-foreground transition-colors">
              Все категории
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-foreground text-background">
        <div className="container grid grid-cols-2 lg:grid-cols-4 divide-x divide-background/15">
          {stats.map((s, i) => (
            <div key={s.label} className="px-6 py-9 reveal" style={{ animationDelay: `${0.1 + i * 0.07}s` }}>
              <div className="flex items-center justify-between mb-4">
                <Icon name={s.icon} size={18} className="text-background/50" />
                <span className="text-xs font-mono text-accent">{s.delta}</span>
              </div>
              <div className="font-display text-4xl md:text-5xl font-semibold tracking-tight">{s.value}</div>
              <div className="mt-2 text-xs text-background/55 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">01 — Направления</div>
              <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">Категории</h2>
            </div>
            <a href="#articles" className="hidden md:flex items-center gap-2 text-sm font-medium underline-grow">
              Смотреть все <Icon name="ArrowUpRight" size={15} />
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-border">
            {categories.map((c) => (
              <Link
                to={`/category/${c.slug}`}
                key={c.slug}
                className="group text-left border-r border-b border-border p-8 hover:bg-foreground hover:text-background transition-colors duration-300"
              >
                <div className="flex items-center mb-10">
                  <Icon name={c.icon} size={26} className="group-hover:text-background transition-colors" style={{ color: `hsl(${c.accent})` }} />
                </div>
                <div className="font-display text-2xl font-semibold tracking-tight flex items-center gap-2">
                  {c.name}
                  <Icon name="ArrowRight" size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground group-hover:text-background/60 transition-colors">{c.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section id="articles" className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">02 — Публикации</div>
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-10">Статьи</h2>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-12">
            {['Все', ...categories.map((c) => c.name)].map((f) => {
              const cat = categories.find((c) => c.name === f);
              const isActive = active === f;
              return (
                <button
                  key={f}
                  onClick={() => setActive(f)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border transition-all duration-200 ${
                    isActive
                      ? 'text-background border-transparent'
                      : 'border-border hover:border-foreground'
                  }`}
                  style={isActive && cat ? { background: `hsl(${cat.accent})`, borderColor: `hsl(${cat.accent})` } : isActive ? { background: 'hsl(var(--foreground))' } : {}}
                >
                  {cat && <Icon name={cat.icon} size={14} style={isActive ? { color: `hsl(${cat.accentForeground})` } : { color: `hsl(${cat.accent})` }} />}
                  {f}
                </button>
              );
            })}
          </div>

          {/* Loading */}
          {loadingArticles && (
            <div className="flex items-center gap-3 py-16 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: 'hsl(var(--accent))' }} />
              Загрузка статей...
            </div>
          )}

          {/* Empty */}
          {!loadingArticles && visibleArticles.length === 0 && (
            <div className="py-16 text-center border border-dashed border-border">
              <p className="text-muted-foreground">Статьи ещё не опубликованы</p>
              <Link to="/admin/generate" className="mt-3 inline-flex items-center gap-2 text-sm font-medium underline-grow">
                Запустить генерацию <Icon name="ArrowRight" size={14} />
              </Link>
            </div>
          )}

          {/* Grid — все 6 статей (по одной из каждой категории) */}
          {!loadingArticles && visibleArticles.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
              {visibleArticles.map((a) => {
                const cat = categories.find(c => c.slug === a.category_slug);
                return (
                  <Link to={`/article/${a.category_slug}/${a.article_key}`} key={a.article_key} className="group bg-background hover:bg-card transition-colors cursor-pointer flex flex-col overflow-hidden">
                    <div className="aspect-[16/9] relative overflow-hidden" style={{ background: `hsl(${cat?.accent || '222 80% 42%'})` }}>
                      {a.image_url ? (
                        <img src={a.image_url} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icon name={cat?.icon || 'FileText'} size={36} style={{ color: 'white', opacity: 0.6 }} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                    <div className="p-7 flex flex-col flex-1">
                      <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
                        <span style={{ color: `hsl(${cat?.accent || '222 80% 42%'})` }}>{a.category_name}</span>
                      </div>
                      <h3 className="font-display text-xl font-semibold leading-snug tracking-tight transition-opacity group-hover:opacity-70 flex-1">{a.title}</h3>
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">{a.excerpt}</p>
                      <div className="mt-6 pt-5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDate(a.published_at)}</span>
                        <span className="flex items-center gap-1.5"><Icon name="Eye" size={14} /> {a.views}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Load more / category link */}
          <div className="mt-10 flex items-center justify-center gap-4">
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-8 py-3.5 text-sm font-medium border border-border hover:border-foreground transition-colors disabled:opacity-50"
              >
                {loadingMore
                  ? <><div className="w-4 h-4 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: 'hsl(var(--foreground))' }} />Загрузка...</>
                  : <><Icon name="ChevronDown" size={16} />Загрузить ещё</>}
              </button>
            )}
            {activeCategory && (
              <Link
                to={`/category/${activeCategory.slug}`}
                className="flex items-center gap-2 px-8 py-3.5 text-sm font-medium text-background transition-opacity hover:opacity-85"
                style={{ background: `hsl(${activeCategory.accent})` }}
              >
                Все статьи: {activeCategory.name}
                <Icon name="ArrowRight" size={16} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-b border-border bg-foreground text-background">
        <div className="container py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-background/50 mb-5">Рассылка</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
              Лучшие материалы — раз в неделю, без воды
            </h2>
            <p className="mt-6 text-background/60 text-lg">
              Подборка ключевых статей и аналитики для тех, кто ценит своё время.
            </p>
            <form className="mt-10 flex flex-col sm:flex-row gap-3 max-w-lg">
              <input
                type="email"
                placeholder="email@company.ru"
                className="flex-1 bg-transparent border border-background/25 px-5 py-3.5 text-sm placeholder:text-background/40 focus:outline-none focus:border-accent transition-colors"
              />
              <button type="submit" className="bg-accent text-accent-foreground px-7 py-3.5 text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
                Подписаться
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container py-14">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-foreground flex items-center justify-center">
              <span className="font-display font-bold text-background text-xs">B</span>
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">BTWOB</span>
            <span className="text-sm text-muted-foreground ml-2"></span>
          </div>
          <nav className="flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#" className="underline-grow">Главная</a>
            <a href="#categories" className="underline-grow">Категории</a>
            <a href="#articles" className="underline-grow">Статьи</a>
          </nav>
          <span className="text-xs text-muted-foreground font-mono">© 2026 BTWOB</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;