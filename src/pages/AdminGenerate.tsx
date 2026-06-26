import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { categories } from '@/data/categories';

type JobStatus = 'pending' | 'running' | 'done' | 'error' | 'cached';

interface Job {
  key: string;
  categorySlug: string;
  categoryName: string;
  categoryIcon: string;
  categoryAccent: string;
  articleId: number;
  title: string;
  excerpt: string;
  status: JobStatus;
  message: string;
}

const getBase = () => {
  const urls = (window as Record<string, unknown>).__func2url as Record<string, string> || {};
  return urls['generate-article'] || '/api/generate-article';
};

const buildJobs = (): Job[] =>
  categories.flatMap((cat) =>
    cat.articles.map((a) => ({
      key: `${cat.slug}_${a.id}`,
      categorySlug: cat.slug,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryAccent: cat.accent,
      articleId: a.id,
      title: a.title,
      excerpt: a.excerpt,
      status: 'pending' as JobStatus,
      message: '',
    }))
  );

const AdminGenerate = () => {
  const [jobs, setJobs] = useState<Job[]>(buildJobs);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const update = (key: string, patch: Partial<Job>) =>
    setJobs((prev) => prev.map((j) => (j.key === key ? { ...j, ...patch } : j)));

  const generateAll = async () => {
    setRunning(true);
    setDone(false);
    const base = getBase();

    const snapshot = buildJobs(); // свежий список с нужными полями

    for (const job of snapshot) {
      update(job.key, { status: 'running', message: '' });

      // Проверяем кэш
      try {
        const check = await fetch(
          `${base}?category_slug=${job.categorySlug}&article_id=${job.articleId}`
        );
        if (check.ok) {
          update(job.key, { status: 'cached', message: 'Уже есть в базе' });
          continue;
        }
      } catch { /* нет соединения — пробуем генерировать */ }

      // Генерируем
      try {
        const res = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: job.title,
            category: job.categoryName,
            excerpt: job.excerpt,
            category_slug: job.categorySlug,
            article_id: String(job.articleId),
          }),
        });
        const data = await res.json();
        if (data.content) {
          update(job.key, { status: 'done', message: 'Сгенерировано и сохранено' });
        } else {
          update(job.key, { status: 'error', message: data.error || 'Ошибка GPT' });
        }
      } catch {
        update(job.key, { status: 'error', message: 'Ошибка соединения с сервером' });
      }

      await new Promise((r) => setTimeout(r, 1500));
    }

    setRunning(false);
    setDone(true);
  };

  const counts = {
    pending: jobs.filter((j) => j.status === 'pending').length,
    done: jobs.filter((j) => j.status === 'done').length,
    cached: jobs.filter((j) => j.status === 'cached').length,
    error: jobs.filter((j) => j.status === 'error').length,
  };

  const finished = counts.done + counts.cached + counts.error;
  const progress = Math.round((finished / jobs.length) * 100);

  const StatusIcon = ({ s }: { s: JobStatus }) => {
    if (s === 'pending') return <Icon name="Clock" size={16} className="text-muted-foreground" />;
    if (s === 'running') return (
      <div className="w-4 h-4 border-2 border-transparent rounded-full animate-spin"
        style={{ borderTopColor: 'hsl(222 80% 42%)', borderRightColor: 'hsl(222 80% 42% / 0.3)' }} />
    );
    if (s === 'done') return <Icon name="CheckCircle" size={16} style={{ color: 'hsl(152 60% 36%)' }} />;
    if (s === 'cached') return <Icon name="Database" size={16} style={{ color: 'hsl(222 80% 42%)' }} />;
    if (s === 'error') return <Icon name="XCircle" size={16} className="text-destructive" />;
    return null;
  };

  const statusLabel: Record<JobStatus, string> = {
    pending: 'Ожидает',
    running: 'Генерируется...',
    done: 'Готово',
    cached: 'Из кэша',
    error: 'Ошибка',
  };

  return (
    <div className="min-h-screen bg-background grain text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-foreground flex items-center justify-center">
              <span className="font-display font-bold text-background text-sm">B</span>
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">BTWOB</span>
          </Link>
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground hidden md:block">
            Генерация контента
          </span>
          <Link to="/" className="flex items-center gap-2 border border-border px-4 py-2 text-sm font-medium hover:border-foreground transition-colors">
            <Icon name="ArrowLeft" size={15} />
            На сайт
          </Link>
        </div>
      </header>

      <div className="container py-14 max-w-3xl">
        <div className="mb-10">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Панель управления
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight mb-4">
            Массовая генерация статей
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            GPT-4o сгенерирует {jobs.length} статей по всем категориям с тематическими фото из Unsplash.
            Уже сохранённые статьи будут пропущены.
          </p>
        </div>

        {/* Progress bar */}
        {(running || done) && (
          <div className="mb-8 border border-border p-6">
            <div className="flex items-center justify-between mb-3 text-sm">
              <span className="font-medium">
                {running ? `Генерируется... (${finished} из ${jobs.length})` : '✓ Генерация завершена'}
              </span>
              <span className="font-mono text-muted-foreground">{progress}%</span>
            </div>
            <div className="h-2 bg-muted overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'hsl(222 80% 42%)' }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-6 text-xs font-mono text-muted-foreground">
              {counts.done > 0 && <span style={{ color: 'hsl(152 60% 36%)' }}>✓ {counts.done} сгенерировано</span>}
              {counts.cached > 0 && <span style={{ color: 'hsl(222 80% 42%)' }}>⬤ {counts.cached} из кэша</span>}
              {counts.error > 0 && <span className="text-destructive">✗ {counts.error} ошибок</span>}
              {counts.pending > 0 && <span>◌ {counts.pending} ожидает</span>}
            </div>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex flex-wrap gap-3 mb-10">
          {!running && (
            <button
              onClick={generateAll}
              className="flex items-center gap-3 px-8 py-4 text-sm font-medium text-background bg-foreground hover:opacity-85 transition-opacity"
            >
              <Icon name="Zap" size={18} />
              {done ? 'Перегенерировать всё' : `Запустить генерацию ${jobs.length} статей`}
            </button>
          )}
          {running && (
            <div className="flex items-center gap-3 px-8 py-4 text-sm font-medium border border-border text-muted-foreground">
              <div className="w-4 h-4 border-2 border-transparent rounded-full animate-spin"
                style={{ borderTopColor: 'hsl(222 80% 42%)' }} />
              Идёт генерация, не закрывай страницу...
            </div>
          )}
          {done && (
            <Link
              to="/"
              className="flex items-center gap-2 px-6 py-4 text-sm font-medium border border-border hover:border-foreground transition-colors"
            >
              <Icon name="Globe" size={16} />
              Открыть сайт
            </Link>
          )}
        </div>

        {/* Список статей */}
        <div className="border border-border divide-y divide-border">
          {categories.map((cat) => (
            <div key={cat.slug}>
              <div
                className="px-6 py-3 flex items-center gap-2 text-xs font-mono uppercase tracking-widest"
                style={{ background: `hsl(${cat.accent} / 0.07)`, color: `hsl(${cat.accent})` }}
              >
                <Icon name={cat.icon} size={13} />
                {cat.name}
              </div>
              {cat.articles.map((a) => {
                const job = jobs.find((j) => j.key === `${cat.slug}_${a.id}`);
                if (!job) return null;
                return (
                  <div key={a.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="shrink-0 w-5 flex items-center justify-center">
                      <StatusIcon s={job.status} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{a.title}</p>
                      {job.message && (
                        <p className={`text-xs mt-0.5 ${job.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {job.message}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-mono shrink-0 ${
                      job.status === 'done' ? 'text-green-600' :
                      job.status === 'cached' ? '' :
                      job.status === 'error' ? 'text-destructive' :
                      job.status === 'running' ? 'text-foreground' :
                      'text-muted-foreground'
                    }`}
                    style={job.status === 'cached' ? { color: 'hsl(222 80% 42%)' } : {}}>
                      {statusLabel[job.status]}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminGenerate;
