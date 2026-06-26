import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { categories } from '@/data/categories';

interface ArticleContent {
  intro: string;
  sections: { heading: string; text: string }[];
  conclusion: string;
  key_points: string[];
}

const Article = () => {
  const { categorySlug, articleId } = useParams();
  const location = useLocation();

  const category = categories.find((c) => c.slug === categorySlug);
  const article = category?.articles.find((a) => String(a.id) === articleId);

  const [content, setContent] = useState<ArticleContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const accentStyle = category
    ? ({ '--accent': category.accent, '--accent-foreground': category.accentForeground } as React.CSSProperties)
    : {};

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const generate = async () => {
    if (!article || !category) return;
    setLoading(true);
    setError('');
    try {
      const urls = (window as Record<string, unknown>).__func2url as Record<string, string> || {};
      const base = urls['generate-article'] || '/api/generate-article';
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          category: category.name,
          excerpt: article.excerpt,
        }),
      });
      const data = await res.json();
      if (data.content) setContent(data.content);
      else setError('Не удалось получить контент. Попробуй ещё раз.');
    } catch {
      setError('Ошибка соединения. Попробуй ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  if (!category || !article) {
    return (
      <div className="min-h-screen bg-background grain flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-display text-4xl font-semibold mb-4">Статья не найдена</h1>
        <Link to="/" className="text-accent underline-grow">На главную</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grain text-foreground" style={accentStyle}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
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
          <Link
            to={`/category/${category.slug}`}
            className="flex items-center gap-2 border border-border px-4 py-2 text-sm font-medium hover:border-foreground transition-colors"
          >
            <Icon name="ArrowLeft" size={15} />
            Назад
          </Link>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="container pt-8">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors">Главная</Link>
          <Icon name="ChevronRight" size={13} />
          <Link to={`/category/${category.slug}`} className="hover:text-foreground transition-colors">{category.name}</Link>
          <Icon name="ChevronRight" size={13} />
          <span className="text-foreground truncate max-w-[260px]">{article.title}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-border mt-8">
        <div className="container pb-14">
          <div className="max-w-3xl">
            <div className="reveal flex items-center gap-3 mb-6 text-xs font-mono uppercase tracking-[0.2em]" style={{ color: `hsl(${category.accent})` }}>
              <Icon name={category.icon} size={15} />
              {category.name} · {article.read}
            </div>
            <h1 className="reveal font-display text-4xl md:text-6xl font-bold leading-[0.95] tracking-tight text-balance" style={{ animationDelay: '0.06s' }}>
              {article.title}
            </h1>
            <p className="reveal mt-6 text-lg text-muted-foreground leading-relaxed" style={{ animationDelay: '0.12s' }}>
              {article.excerpt}
            </p>
            <div className="reveal mt-8 flex items-center gap-6 text-sm text-muted-foreground" style={{ animationDelay: '0.18s' }}>
              <span className="flex items-center gap-1.5"><Icon name="Calendar" size={15} /> {article.date}</span>
              <span className="flex items-center gap-1.5"><Icon name="Eye" size={15} /> {article.views}</span>
              <span className="flex items-center gap-1.5"><Icon name="Clock" size={15} /> {article.read}</span>
            </div>
          </div>
        </div>

        {/* Color band */}
        <div className="h-2 w-full" style={{ background: `hsl(${category.accent})` }} />
      </section>

      {/* Content */}
      <section className="container py-14 md:py-20">
        <div className="grid lg:grid-cols-[1fr_320px] gap-16 items-start">

          {/* Main */}
          <div className="max-w-2xl">
            {!content && !loading && (
              <div className="border border-dashed border-border rounded-none p-12 flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 flex items-center justify-center" style={{ background: `hsl(${category.accent} / 0.1)` }}>
                  <Icon name="Sparkles" size={32} style={{ color: `hsl(${category.accent})` }} />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold mb-2">Статья ещё не сгенерирована</p>
                  <p className="text-sm text-muted-foreground">Нажми кнопку, и GPT-4o напишет полный текст на основе заголовка и темы</p>
                </div>
                <button
                  onClick={generate}
                  className="flex items-center gap-2 px-8 py-3.5 text-sm font-medium transition-opacity hover:opacity-85"
                  style={{ background: `hsl(${category.accent})`, color: `hsl(${category.accentForeground})` }}
                >
                  <Icon name="Zap" size={16} />
                  Сгенерировать статью
                </button>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center gap-6 py-20">
                <div
                  className="w-12 h-12 border-2 border-transparent rounded-full animate-spin"
                  style={{ borderTopColor: `hsl(${category.accent})`, borderRightColor: `hsl(${category.accent} / 0.3)` }}
                />
                <div className="text-center">
                  <p className="font-display text-lg font-semibold">GPT пишет статью...</p>
                  <p className="text-sm text-muted-foreground mt-1">Обычно занимает 10–20 секунд</p>
                </div>
              </div>
            )}

            {error && (
              <div className="border border-destructive/30 bg-destructive/5 p-6 mb-8">
                <p className="text-sm text-destructive">{error}</p>
                <button onClick={generate} className="mt-3 text-sm font-medium underline-grow">Попробовать снова</button>
              </div>
            )}

            {content && (
              <div className="prose-article">
                {/* Intro */}
                <p className="text-lg leading-relaxed text-foreground/90 mb-10 pb-10 border-b border-border font-medium">
                  {content.intro}
                </p>

                {/* Sections */}
                {content.sections.map((s, i) => (
                  <div key={i} className="mb-10">
                    <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-4 flex items-start gap-3">
                      <span className="font-mono text-sm mt-1.5 shrink-0" style={{ color: `hsl(${category.accent})` }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {s.heading}
                    </h2>
                    <p className="text-base leading-[1.85] text-foreground/80">{s.text}</p>
                  </div>
                ))}

                {/* Conclusion */}
                <div className="mt-12 pt-10 border-t border-border">
                  <h2 className="font-display text-xl font-semibold mb-4 tracking-tight">Итог</h2>
                  <p className="text-base leading-[1.85] text-foreground/80">{content.conclusion}</p>
                </div>

                {/* Regen */}
                <div className="mt-12 flex items-center gap-3">
                  <button
                    onClick={generate}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-border hover:border-foreground transition-colors"
                  >
                    <Icon name="RefreshCw" size={14} />
                    Перегенерировать
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block space-y-8">
            {/* Key points */}
            {content?.key_points && (
              <div className="border border-border p-7">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-5">Ключевые тезисы</div>
                <ul className="space-y-3">
                  {content.key_points.map((kp, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                      <span className="w-5 h-5 shrink-0 flex items-center justify-center text-xs font-mono mt-0.5" style={{ background: `hsl(${category.accent})`, color: `hsl(${category.accentForeground})` }}>
                        {i + 1}
                      </span>
                      {kp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Category info */}
            <div className="border border-border p-7" style={{ borderLeftColor: `hsl(${category.accent})`, borderLeftWidth: '3px' }}>
              <div className="flex items-center gap-2 mb-4">
                <Icon name={category.icon} size={18} style={{ color: `hsl(${category.accent})` }} />
                <span className="font-display text-lg font-semibold">{category.name}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{category.description}</p>
              <Link
                to={`/category/${category.slug}`}
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: `hsl(${category.accent})` }}
              >
                Все статьи <Icon name="ArrowRight" size={15} />
              </Link>
            </div>

            {/* Other articles */}
            <div className="border border-border p-7">
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-5">Ещё из {category.name}</div>
              <ul className="space-y-4">
                {category.articles
                  .filter((a) => String(a.id) !== articleId)
                  .slice(0, 3)
                  .map((a) => (
                    <li key={a.id}>
                      <Link
                        to={`/article/${category.slug}/${a.id}`}
                        className="group block"
                      >
                        <p className="text-sm font-medium leading-snug group-hover:opacity-70 transition-opacity">{a.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{a.date} · {a.read}</p>
                      </Link>
                    </li>
                  ))}
              </ul>
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