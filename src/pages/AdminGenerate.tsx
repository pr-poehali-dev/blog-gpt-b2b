import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { categories } from '@/data/categories';

interface JobStatus {
  key: string;
  title: string;
  category: string;
  status: 'pending' | 'running' | 'done' | 'error' | 'cached';
  message?: string;
}

const getBase = () => {
  const urls = (window as Record<string, unknown>).__func2url as Record<string, string> || {};
  return urls['generate-article'] || '/api/generate-article';
};

const AdminGenerate = () => {
  const allJobs: Omit<JobStatus, 'status'>[] = categories.flatMap((cat) =>
    cat.articles.map((a) => ({
      key: `${cat.slug}_${a.id}`,
      title: a.title,
      category: cat.name,
      excerpt: a.excerpt,
      categorySlug: cat.slug,
      articleId: a.id,
    }))
  );

  const [jobs, setJobs] = useState<JobStatus[]>(
    allJobs.map((j) => ({ ...j, status: 'pending' }))
  );
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const updateJob = (key: string, patch: Partial<JobStatus>) =>
    setJobs((prev) => prev.map((j) => (j.key === key ? { ...j, ...patch } : j)));

  const generateAll = async () => {
    setRunning(true);
    setDone(false);
    const base = getBase();

    for (const job of allJobs as (Omit<JobStatus, 'status'> & { excerpt: string; categorySlug: string; articleId: number })[]) {
      updateJob(job.key, { status: 'running' });

      // Сначала проверим кэш
      try {
        const check = await fetch(`${base}?category_slug=${job.categorySlug}&article_id=${job.articleId}`);
        if (check.status === 200) {
          updateJob(job.key, { status: 'cached', message: 'Уже есть в базе' });
          continue;
        }
      } catch { /* ignore */ }

      // Генерируем
      try {
        const res = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: job.title,
            category: job.category,
            excerpt: job.excerpt,
            category_slug: job.categorySlug,
            article_id: String(job.articleId),
          }),
        });
        const data = await res.json();
        if (data.content) {
          updateJob(job.key, { status: 'done', message: 'Сгенерировано и сохранено' });
        } else {
          updateJob(job.key, { status: 'error', message: data.error || 'Ошибка GPT' });
        }
      } catch (e) {
        updateJob(job.key, { status: 'error', message: 'Ошибка соединения' });
      }

      // Пауза между запросами — не перегружаем API
      await new Promise((r) => setTimeout(r, 1500));
    }

    setRunning(false);
    setDone(true);
  };

  const counts = {
    pending: jobs.filter((j) => j.status === 'pending').length,
    running: jobs.filter((j) => j.status === 'running').length,
    done: jobs.filter((j) => j.status === 'done').length,
    cached: jobs.filter((j) => j.status === 'cached').length,
    error: jobs.filter((j) => j.status === 'error').length,
  };

  const progress = Math.round(((counts.done + counts.cached + counts.error) / jobs.length) * 100);

  const statusIcon = (s: JobStatus['status']) => {
    if (s === 'pending') return <Icon name="Clock" size={16} className="text-muted-foreground" />;
    if (s === 'running') return <div className="w-4 h-4 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: 'hsl(222 80% 42%)' }} />;
    if (s === 'done') return <Icon name="CheckCircle" size={16} className="text-green-600" />;
    if (s === 'cached') return <Icon name="Database" size={16} className="text-blue-500" />;
    if (s === 'error') return <Icon name="XCircle" size={16} className="text-destructive" />;
  };

  const statusLabel = (s: JobStatus['status']) => ({
    pending: 'Ожидает',
    running: 'Генерируется...',
    done: 'Готово',
    cached: 'Из кэша',
    error: 'Ошибка',
  }[s]);

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
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Генерация контента</span>
          <Link to="/" className="flex items-center gap-2 border border-border px-4 py-2 text-sm font-medium hover:border-foreground transition-colors">
            <Icon name="ArrowLeft" size={15} />
            На сайт
          </Link>
        </div>
      </header>

      <div className="container py-14 max-w-3xl">
        <div className="mb-10">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">Панель управления</div>
          <h1 className="font-display text-4xl font-bold tracking-tight mb-4">Массовая генерация статей</h1>
          <p className="text-muted-foreground">
            GPT-4o сгенерирует {jobs.length} статей по всем категориям и сохранит их в базу данных. Уже сохранённые статьи будут пропущены.
          </p>
        </div>

        {/* Progress */}
        {running || done ? (
          <div className="mb-8 border border-border p-6">
            <div className="flex items-center justify-between mb-3 text-sm">
              <span className="font-medium">{running ? 'Идёт генерация...' : '✓ Генерация завершена'}</span>
              <span className="font-mono text-muted-foreground">{progress}%</span>
            </div>
            <div className="h-2 bg-muted overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'hsl(222 80% 42%)' }}
              />
            </div>
            <div className="mt-4 flex gap-6 text-xs font-mono text-muted-foreground">
              <span className="text-green-600">✓ {counts.done} сгенерировано</span>
              <span className="text-blue-500">⬤ {counts.cached} из кэша</span>
              {counts.error > 0 && <span className="text-destructive">✗ {counts.error} ошибок</span>}
            </div>
          </div>
        ) : null}

        {/* Start button */}
        {!running && !done && (
          <button
            onClick={generateAll}
            className="flex items-center gap-3 px-8 py-4 text-sm font-medium text-background bg-foreground hover:opacity-85 transition-opacity mb-10"
          >
            <Icon name="Zap" size={18} />
            Запустить генерацию всех {jobs.length} статей
          </button>
        )}

        {done && (
          <div className="flex gap-3 mb-10">
            <Link to="/" className="flex items-center gap-2 px-6 py-3 text-sm font-medium bg-foreground text-background hover:opacity-85 transition-opacity">
              <Icon name="Globe" size={16} />
              Открыть сайт
            </Link>
            <button
              onClick={() => { setJobs(allJobs.map((j) => ({ ...j, status: 'pending' }))); setDone(false); }}
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium border border-border hover:border-foreground transition-colors"
            >
              <Icon name="RefreshCw" size={16} />
              Перегенерировать всё
            </button>
          </div>
        )}

        {/* Jobs list */}
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
                      {statusIcon(job.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug truncate">{a.title}</p>
                      {job.message && (
                        <p className="text-xs text-muted-foreground mt-0.5">{job.message}</p>
                      )}
                    </div>
                    <span className={`text-xs font-mono shrink-0 ${
                      job.status === 'done' ? 'text-green-600' :
                      job.status === 'cached' ? 'text-blue-500' :
                      job.status === 'error' ? 'text-destructive' :
                      'text-muted-foreground'
                    }`}>
                      {statusLabel(job.status)}
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
