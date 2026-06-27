import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { categories } from '@/data/categories';
import func2url from '../../backend/func2url.json';

const SCHEDULER_URL = (func2url as Record<string, string>)['scheduler'];
const ARTICLES_API = (func2url as Record<string, string>)['articles-api'];

const AdminGenerate = () => {
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [schedulerResult, setSchedulerResult] = useState('');
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({});

  const SLUGS = ['strategy', 'finance', 'tech', 'marketing', 'management', 'sales'];
  const ARTICLES_PER_CAT = 3;
  const total = SLUGS.length * ARTICLES_PER_CAT;

  // Загружаем статистику из БД
  const loadStats = () => {
    Promise.all(
      SLUGS.map(slug =>
        fetch(`${ARTICLES_API}?category_slug=${slug}`)
          .then(r => r.json())
          .then(d => ({ slug, count: d.total || d.articles?.length || 0 }))
          .catch(() => ({ slug, count: 0 }))
      )
    ).then(results => {
      const s: Record<string, number> = {};
      results.forEach(r => { s[r.slug] = r.count; });
      setStats(s);
    });
  };

  useEffect(() => { loadStats(); }, []);

  const runScheduler = async () => {
    setSchedulerRunning(true);
    setSchedulerResult('');
    setProgress(0);
    let published = 0;
    let errors = 0;

    for (const slug of SLUGS) {
      for (let i = 0; i < ARTICLES_PER_CAT; i++) {
        try {
          const res = await fetch(SCHEDULER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category_slug: slug }),
          });
          if (res.ok) {
            published++;
          } else {
            errors++;
          }
        } catch {
          errors++;
        }
        setProgress(Math.round(((published + errors) / total) * 100));
        await new Promise(r => setTimeout(r, 500));
      }
    }

    const msg = errors > 0
      ? `✓ Опубликовано ${published} статей, ошибок: ${errors}`
      : `✓ Опубликовано ${published} новых статей`;
    setSchedulerResult(msg);
    setSchedulerRunning(false);
    loadStats(); // Обновляем статистику
  };

  const totalArticles = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-background grain text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-foreground flex items-center justify-center">
              <span className="font-display font-bold text-background text-sm">B</span>
            </div>
            <span className="font-display text-base font-semibold tracking-tight hidden sm:block">B2B - деловой журнал</span>
          </Link>
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground hidden md:block">
            Панель управления
          </span>
          <Link to="/" className="flex items-center gap-2 border border-border px-4 py-2 text-sm font-medium hover:border-foreground transition-colors">
            <Icon name="ArrowLeft" size={15} />
            На сайт
          </Link>
        </div>
      </header>

      <div className="container py-14 max-w-3xl">
        <div className="mb-10">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">Панель управления</div>
          <h1 className="font-display text-4xl font-bold tracking-tight mb-2">Автопубликация статей</h1>
          <p className="text-muted-foreground">
            Всего опубликовано статей: <span className="font-semibold text-foreground">{totalArticles}</span>
          </p>
        </div>

        {/* Scheduler */}
        <div className="border border-border p-7 mb-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="font-display text-xl font-semibold mb-2 flex items-center gap-2">
                <Icon name="CalendarClock" size={20} style={{ color: 'hsl(222 80% 42%)' }} />
                Генерация новых статей
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                GPT-4o mini придумывает уникальные темы и публикует по {ARTICLES_PER_CAT} статьи в каждой из {SLUGS.length} категорий ({total} статей за запуск).
              </p>

              {/* Progress */}
              {schedulerRunning && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Публикуется...</span>
                    <span className="font-mono">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-muted overflow-hidden">
                    <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, background: 'hsl(222 80% 42%)' }} />
                  </div>
                </div>
              )}

              {schedulerResult && (
                <p className={`mt-3 text-sm font-medium ${schedulerResult.startsWith('✓') ? 'text-green-600' : 'text-destructive'}`}>
                  {schedulerResult}
                </p>
              )}
            </div>
            <button
              onClick={runScheduler}
              disabled={schedulerRunning}
              className="shrink-0 flex items-center gap-2 px-6 py-3 text-sm font-medium text-background bg-foreground hover:opacity-85 transition-opacity disabled:opacity-50 whitespace-nowrap"
            >
              {schedulerRunning
                ? <><div className="w-4 h-4 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: 'white' }} />Публикация...</>
                : <><Icon name="Zap" size={16} />Запустить</>}
            </button>
          </div>
        </div>

        {/* Stats by category */}
        <div className="border border-border divide-y divide-border">
          <div className="px-6 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Статьи по категориям
          </div>
          {categories.map((cat) => (
            <div key={cat.slug} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name={cat.icon} size={17} style={{ color: `hsl(${cat.accent})` }} />
                <span className="font-medium">{cat.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono text-muted-foreground">
                  {stats[cat.slug] ?? '—'} статей
                </span>
                <Link
                  to={`/category/${cat.slug}`}
                  className="text-xs border border-border px-3 py-1 hover:border-foreground transition-colors"
                >
                  Открыть
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-muted-foreground text-center">
          Для автозапуска по расписанию настрой cron-job на{' '}
          <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="underline-grow">cron-job.org</a>
          {' '}→ POST на URL планировщика каждый день.
        </p>
      </div>
    </div>
  );
};

export default AdminGenerate;