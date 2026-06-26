import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { categories } from '@/data/categories';

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

const Article = () => {
  const { categorySlug, articleId } = useParams();
  const location = useLocation();

  const category = categories.find((c) => c.slug === categorySlug);
  const article = category?.articles.find((a) => String(a.id) === articleId);

  const [content, setContent] = useState<ArticleContent | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
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
      if (data.content) {
        setContent(data.content);
        if (data.image_url) setImageUrl(data.image_url);
      } else {
        setError('Не удалось получить контент. Попробуй ещё раз.');
      }
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
          <Link
            to={`/category/${category.slug}`}
            className="flex items-center gap-2 border border-border px-4 py-2 text-sm font-medium hover:border-foreground transition-colors"
          >
            <Icon name="ArrowLeft" size={15} />
            Назад
          </Link>
        </div>
      </header>

      {/* Hero image + title overlay */}
      <section className="relative">
        {/* Image */}
        <div className="w-full h-[420px] md:h-[520px] overflow-hidden relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: `hsl(${category.accent})` }}>
              <Icon name={category.icon} size={96} style={{ color: `hsl(${category.accentForeground})`, opacity: 0.4 }} />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />

          {/* Title on image */}
          <div className="absolute bottom-0 left-0 right-0 container pb-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4 text-xs font-mono uppercase tracking-[0.2em]" style={{ color: `hsl(${category.accent})` }}>
                <span className="w-6 h-px" style={{ background: `hsl(${category.accent})` }} />
                {category.name} · {article.read}
              </div>
              <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight tracking-tight text-white text-balance">
                {article.title}
              </h1>
              <div className="mt-5 flex items-center gap-6 text-sm text-white/70">
                <span className="flex items-center gap-1.5"><Icon name="Calendar" size={14} /> {article.date}</span>
                <span className="flex items-center gap-1.5"><Icon name="Eye" size={14} /> {article.views}</span>
                <span className="flex items-center gap-1.5"><Icon name="Clock" size={14} /> {article.read}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Accent line */}
        <div className="h-1 w-full" style={{ background: `hsl(${category.accent})` }} />
      </section>

      {/* Breadcrumb */}
      <div className="container pt-7 pb-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors">Главная</Link>
          <Icon name="ChevronRight" size={13} />
          <Link to={`/category/${category.slug}`} className="hover:text-foreground transition-colors">{category.name}</Link>
          <Icon name="ChevronRight" size={13} />
          <span className="text-foreground truncate max-w-[260px]">{article.title}</span>
        </div>
      </div>

      {/* Content */}
      <section className="container py-10 md:py-16">
        <div className="grid lg:grid-cols-[1fr_300px] gap-14 items-start">

          {/* Main article body */}
          <div className="min-w-0">

            {/* Excerpt lead */}
            <p className="text-xl md:text-2xl leading-relaxed text-foreground/80 font-medium border-l-4 pl-6 mb-10" style={{ borderColor: `hsl(${category.accent})` }}>
              {article.excerpt}
            </p>

            {/* Generate CTA */}
            {!content && !loading && (
              <div className="border border-dashed border-border p-10 flex flex-col items-center text-center gap-6 mb-10">
                <div className="w-14 h-14 flex items-center justify-center" style={{ background: `hsl(${category.accent} / 0.1)` }}>
                  <Icon name="Sparkles" size={28} style={{ color: `hsl(${category.accent})` }} />
                </div>
                <div>
                  <p className="font-display text-xl font-semibold mb-2">Статья ещё не сгенерирована</p>
                  <p className="text-sm text-muted-foreground">GPT-4o напишет полный текст с подзаголовками, примерами и выводами</p>
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

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center gap-6 py-20">
                <div
                  className="w-12 h-12 border-2 border-transparent rounded-full animate-spin"
                  style={{ borderTopColor: `hsl(${category.accent})`, borderRightColor: `hsl(${category.accent} / 0.25)` }}
                />
                <div className="text-center">
                  <p className="font-display text-lg font-semibold">GPT пишет статью...</p>
                  <p className="text-sm text-muted-foreground mt-1">Обычно занимает 15–25 секунд</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="border border-destructive/30 bg-destructive/5 p-6 mb-8">
                <p className="text-sm text-destructive">{error}</p>
                <button onClick={generate} className="mt-3 text-sm font-medium underline-grow">Попробовать снова</button>
              </div>
            )}

            {/* Article content */}
            {content && (
              <article>
                {/* Intro */}
                <p className="text-lg leading-[1.9] text-foreground mb-12 pb-12 border-b border-border">
                  {content.intro}
                </p>

                {/* Sections */}
                {content.sections.map((s, i) => (
                  <div key={i} className="mb-14">
                    {/* Section heading */}
                    <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-6 flex items-baseline gap-3">
                      <span
                        className="font-mono text-xs font-normal shrink-0 px-2 py-1"
                        style={{ background: `hsl(${category.accent})`, color: `hsl(${category.accentForeground})` }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {s.heading}
                    </h2>

                    {/* Paragraphs */}
                    <div className="space-y-5 mb-8">
                      {s.paragraphs.map((p, j) => (
                        <p key={j} className="text-base leading-[1.9] text-foreground/85">
                          {p}
                        </p>
                      ))}
                    </div>

                    {/* List */}
                    {s.list && s.list.length > 0 && (
                      <ul className="mb-8 space-y-3 border-l-2 pl-6" style={{ borderColor: `hsl(${category.accent} / 0.4)` }}>
                        {s.list.map((item, j) => (
                          <li key={j} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/80">
                            <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: `hsl(${category.accent})` }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Quote */}
                    {s.quote && (
                      <blockquote
                        className="my-8 px-7 py-5 border-l-4 bg-foreground/[0.03]"
                        style={{ borderColor: `hsl(${category.accent})` }}
                      >
                        <p className="text-base font-medium leading-relaxed text-foreground/90 italic">
                          {s.quote}
                        </p>
                      </blockquote>
                    )}

                    {/* Divider between sections */}
                    {i < content.sections.length - 1 && (
                      <div className="mt-14 flex items-center gap-4">
                        <div className="flex-1 h-px bg-border" />
                        <span className="font-mono text-xs text-muted-foreground">§</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Conclusion */}
                <div className="mt-12 pt-10 border-t-2 border-border">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-6 h-6 flex items-center justify-center" style={{ background: `hsl(${category.accent})` }}>
                      <Icon name="CheckCheck" size={14} style={{ color: `hsl(${category.accentForeground})` }} />
                    </div>
                    <h2 className="font-display text-xl font-semibold tracking-tight">Итоги</h2>
                  </div>
                  <p className="text-base leading-[1.9] text-foreground/85">{content.conclusion}</p>
                </div>

                {/* Regen */}
                <div className="mt-12 pt-8 border-t border-border flex items-center gap-3">
                  <button
                    onClick={generate}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-border hover:border-foreground transition-colors"
                  >
                    <Icon name="RefreshCw" size={14} />
                    Перегенерировать
                  </button>
                  <span className="text-xs text-muted-foreground">Статья создана с помощью GPT-4o</span>
                </div>
              </article>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col gap-6 sticky top-24">

            {/* Key points — shown after generation */}
            {content?.key_points && (
              <div className="border border-border p-7">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-5 flex items-center gap-2">
                  <Icon name="Lightbulb" size={13} />
                  Ключевые тезисы
                </div>
                <ul className="space-y-4">
                  {content.key_points.map((kp, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                      <span
                        className="w-5 h-5 shrink-0 flex items-center justify-center text-xs font-mono mt-0.5"
                        style={{ background: `hsl(${category.accent})`, color: `hsl(${category.accentForeground})` }}
                      >
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
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-5">
                Ещё из {category.name}
              </div>
              <ul className="space-y-5">
                {category.articles
                  .filter((a) => String(a.id) !== articleId)
                  .slice(0, 3)
                  .map((a) => (
                    <li key={a.id}>
                      <Link to={`/article/${category.slug}/${a.id}`} className="group block">
                        <p className="text-sm font-medium leading-snug group-hover:opacity-70 transition-opacity">{a.title}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <span>{a.date}</span>
                          <span>·</span>
                          <span>{a.read}</span>
                        </div>
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
