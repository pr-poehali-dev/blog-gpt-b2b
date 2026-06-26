import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { getCategory, categories } from '@/data/categories';
import { useSeo } from '@/hooks/useSeo';
import func2url from '../../backend/func2url.json';

const ARTICLES_API = (func2url as Record<string, string>)['articles-api'];

interface DbArticle {
  article_key: string;
  title: string;
  excerpt: string;
  image_url: string | null;
  read_time: string;
  views: number;
  published_at: string;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

const CategorySeo = ({ slug }: { slug: string }) => {
  const category = getCategory(slug);
  useSeo(category ? {
    title: `${category.name} — статьи и аналитика для B2B | BTWOB`,
    description: `${category.description} Читайте экспертные материалы в разделе «${category.name}» на BTWOB.`,
    canonical: `/category/${category.slug}`,
    keywords: `${category.name} B2B, ${category.name.toLowerCase()} для бизнеса, ${category.tagline}, B2B журнал`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${category.name} — BTWOB`,
        description: category.description,
        url: `https://btwob.ru/category/${category.slug}`,
        isPartOf: { '@type': 'WebSite', url: 'https://btwob.ru' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://btwob.ru' },
          { '@type': 'ListItem', position: 2, name: 'Категории', item: 'https://btwob.ru/#categories' },
          { '@type': 'ListItem', position: 3, name: category.name, item: `https://btwob.ru/category/${category.slug}` },
        ],
      },
    ],
  } : { title: 'Категория — BTWOB', description: 'B2B журнал' });
  return null;
};

const Category = () => {
  const { slug } = useParams();
  const category = getCategory(slug || '');
  const [articles, setArticles] = useState<DbArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${ARTICLES_API}?category_slug=${slug}`)
      .then((r) => r.json())
      .then((data) => setArticles(data.articles || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [slug]);

  if (!category) {
    return (
      <div className="min-h-screen bg-background grain flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-display text-4xl font-semibold mb-4">Категория не найдена</h1>
        <Link to="/" className="text-accent underline-grow">На главную</Link>
      </div>
    );
  }

  const accentStyle = { '--accent': category.accent, '--accent-foreground': category.accentForeground } as React.CSSProperties;
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="min-h-screen bg-background grain text-foreground" style={accentStyle}>
      <CategorySeo slug={category.slug} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-foreground flex items-center justify-center">
              <span className="font-display font-bold text-background text-sm tracking-tight">B</span>
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">BTWOB</span>
          </Link>
          <nav className="hidden md:flex items-center gap-9 text-sm font-medium">
            <Link to="/" className="underline-grow">Главная</Link>
            <Link to="/#categories" className="underline-grow">Категории</Link>
            <Link to="/#articles" className="underline-grow">Статьи</Link>
          </nav>
          <Link to="/" className="flex items-center gap-2 border border-border px-4 py-2 text-sm font-medium hover:border-foreground transition-colors">
            <Icon name="ArrowLeft" size={15} />
            Назад
          </Link>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="container pt-8">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Главная</Link>
          <Icon name="ChevronRight" size={13} />
          <Link to="/#categories" className="hover:text-foreground transition-colors">Категории</Link>
          <Icon name="ChevronRight" size={13} />
          <span style={{ color: `hsl(${category.accent})` }}>{category.name}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-border overflow-hidden">
        <div className="container py-16 md:py-24">
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-12 items-end">
            <div>
              <div className="reveal flex items-center gap-3 mb-7 text-xs font-mono uppercase tracking-[0.2em]" style={{ color: `hsl(${category.accent})` }}>
                <span className="w-8 h-px" style={{ background: `hsl(${category.accent})` }} />
                {category.tagline}
              </div>
              <h1 className="reveal font-display text-5xl md:text-7xl font-bold leading-[0.95] tracking-tight text-balance" style={{ animationDelay: '0.05s' }}>
                {category.name}
              </h1>
              <p className="reveal mt-7 text-lg text-muted-foreground max-w-xl leading-relaxed" style={{ animationDelay: '0.12s' }}>
                {category.description}
              </p>
              <div className="reveal mt-8 flex items-center gap-6 text-sm font-mono text-muted-foreground" style={{ animationDelay: '0.2s' }}>
                <span className="flex items-center gap-2"><Icon name="FileText" size={15} /> {articles.length} материалов</span>
                <span className="flex items-center gap-2"><Icon name="Sparkles" size={15} /> Обновляется ежедневно</span>
              </div>
            </div>
            <div className="reveal aspect-square relative overflow-hidden hidden lg:block" style={{ animationDelay: '0.15s', background: `hsl(${category.accent})` }}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.25),transparent_55%)]" />
              <div className="absolute inset-0 grain opacity-40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name={category.icon} size={120} style={{ color: `hsl(${category.accentForeground})`, opacity: 0.9 }} />
              </div>
              <span className="absolute bottom-6 left-6 font-display text-6xl font-bold" style={{ color: `hsl(${category.accentForeground})`, opacity: 0.85 }}>
                {String(articles.length).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="border-b border-border">
        <div className="container py-16 md:py-20">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">Публикации · {category.name}</div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-12">Свежие статьи</h2>

          {loading && (
            <div className="flex items-center gap-3 py-16 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: `hsl(${category.accent})` }} />
              Загрузка статей...
            </div>
          )}

          {!loading && articles.length === 0 && (
            <div className="py-16 text-center border border-dashed border-border">
              <p className="text-muted-foreground mb-2">Статьи ещё не опубликованы</p>
              <p className="text-sm text-muted-foreground">Первые материалы появятся после запуска генерации</p>
            </div>
          )}

          {!loading && featured && (
            <Link to={`/article/${category.slug}/${featured.article_key}`} className="group grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16 pb-16 border-b border-border cursor-pointer block">
              <div className="aspect-[4/3] overflow-hidden relative" style={{ background: `hsl(${category.accent})` }}>
                {featured.image_url ? (
                  <img src={featured.image_url} alt={featured.title} className="absolute inset-0 w-full h-full object-cover" loading="eager" decoding="async" fetchPriority="high" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon name={category.icon} size={72} style={{ color: `hsl(${category.accentForeground})`, opacity: 0.85 }} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <span className="absolute top-4 left-4 text-xs font-mono uppercase tracking-wider px-3 py-1" style={{ background: `hsl(${category.accentForeground})`, color: `hsl(${category.accent})` }}>
                  Главное
                </span>
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-5">
                  <span style={{ color: `hsl(${category.accent})` }}>{category.name}</span>
                  <span>·</span>
                  <span>{formatDate(featured.published_at)}</span>
                </div>
                <h3 className="font-display text-3xl md:text-4xl font-semibold leading-tight tracking-tight transition-colors text-balance group-hover:opacity-80">
                  {featured.title}
                </h3>
                <p className="mt-5 text-muted-foreground leading-relaxed">{featured.excerpt}</p>
                <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Icon name="Eye" size={15} /> {featured.views}</span>
                  <span className="ml-auto flex items-center gap-1.5 font-medium" style={{ color: `hsl(${category.accent})` }}>
                    Читать <Icon name="ArrowRight" size={15} />
                  </span>
                </div>
              </div>
            </Link>
          )}

          {!loading && rest.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
              {rest.map((a) => (
                <Link to={`/article/${category.slug}/${a.article_key}`} key={a.article_key} className="group bg-background hover:bg-card transition-colors cursor-pointer flex flex-col overflow-hidden">
                  <div className="aspect-[16/9] relative overflow-hidden" style={{ background: `hsl(${category.accent})` }}>
                    {a.image_url ? (
                      <img src={a.image_url} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon name={category.icon} size={36} style={{ color: `hsl(${category.accentForeground})`, opacity: 0.6 }} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="p-7 flex flex-col flex-1">
                    <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
                      <span style={{ color: `hsl(${category.accent})` }}>{category.name}</span>
                    </div>
                    <h3 className="font-display text-xl font-semibold leading-snug tracking-tight transition-opacity flex-1 group-hover:opacity-70">
                      {a.title}
                    </h3>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">{a.excerpt}</p>
                    <div className="mt-6 pt-5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(a.published_at)}</span>
                      <span className="flex items-center gap-1.5"><Icon name="Eye" size={14} /> {a.views}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Other categories */}
      <section className="border-b border-border">
        <div className="container py-14">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-8">Другие направления</div>
          <div className="flex flex-wrap gap-3">
            {categories.filter((c) => c.slug !== category.slug).map((c) => (
              <Link key={c.slug} to={`/category/${c.slug}`} className="group flex items-center gap-2.5 border border-border px-5 py-3 hover:border-foreground transition-colors">
                <Icon name={c.icon} size={17} style={{ color: `hsl(${c.accent})` }} />
                <span className="font-display text-base font-medium">{c.name}</span>
                <Icon name="ArrowUpRight" size={15} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container py-14">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
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

export default Category;