import { useState } from 'react';
import Icon from '@/components/ui/icon';

const categories = [
  { name: 'Стратегия', count: 42, icon: 'Target' },
  { name: 'Финансы', count: 38, icon: 'TrendingUp' },
  { name: 'Технологии', count: 56, icon: 'Cpu' },
  { name: 'Маркетинг', count: 31, icon: 'Megaphone' },
  { name: 'Управление', count: 27, icon: 'Users' },
  { name: 'Продажи', count: 44, icon: 'Handshake' },
];

const articles = [
  {
    id: 1,
    category: 'Стратегия',
    title: 'Как выстроить B2B-воронку, которая работает на длинном цикле сделки',
    excerpt: 'Разбираем архитектуру воронки для сложных продаж с несколькими лицами, принимающими решения.',
    date: '24 июня 2026',
    read: '8 мин',
    views: '12.4K',
    featured: true,
  },
  {
    id: 2,
    category: 'Технологии',
    title: 'AI-агенты в корпоративных процессах: что реально внедрять в 2026',
    excerpt: 'Обзор зрелых сценариев автоматизации без хайпа и обещаний.',
    date: '23 июня 2026',
    read: '6 мин',
    views: '9.1K',
  },
  {
    id: 3,
    category: 'Финансы',
    title: 'Unit-экономика SaaS: метрики, которые смотрят инвесторы',
    excerpt: 'CAC, LTV, payback и почему усреднённые цифры вводят в заблуждение.',
    date: '22 июня 2026',
    read: '7 мин',
    views: '7.8K',
  },
  {
    id: 4,
    category: 'Маркетинг',
    title: 'Account-Based Marketing: персонализация на масштабе',
    excerpt: 'Как работать с ключевыми клиентами точечно, не теряя в эффективности.',
    date: '21 июня 2026',
    read: '5 мин',
    views: '6.2K',
  },
  {
    id: 5,
    category: 'Управление',
    title: 'OKR в распределённых командах: типичные ошибки внедрения',
    excerpt: 'Почему цели не достигаются и как выстроить прозрачную систему.',
    date: '20 июня 2026',
    read: '9 мин',
    views: '5.5K',
  },
];

const stats = [
  { label: 'Просмотров за месяц', value: '1.2M', delta: '+18%', icon: 'Eye' },
  { label: 'Откликов и комментариев', value: '34.7K', delta: '+9%', icon: 'MessageSquare' },
  { label: 'Постов в публикации', value: '238', delta: '+24', icon: 'FileText' },
  { label: 'Подписок на рассылку', value: '48.9K', delta: '+12%', icon: 'Mail' },
];

const Index = () => {
  const [active, setActive] = useState('Все');

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
              <button
                key={c.name}
                className="group text-left border-r border-b border-border p-8 hover:bg-foreground hover:text-background transition-colors duration-300"
              >
                <div className="flex items-center justify-between mb-10">
                  <Icon name={c.icon} size={26} className="text-accent group-hover:text-background transition-colors" />
                  <span className="font-mono text-sm text-muted-foreground group-hover:text-background/60 transition-colors">{c.count}</span>
                </div>
                <div className="font-display text-2xl font-semibold tracking-tight flex items-center gap-2">
                  {c.name}
                  <Icon name="ArrowRight" size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground group-hover:text-background/60 transition-colors">{c.count} материалов</p>
              </button>
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
            {['Все', ...categories.map((c) => c.name)].map((f) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={`px-4 py-2 text-sm font-medium border transition-colors ${
                  active === f
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border hover:border-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Featured */}
          {articles.filter((a) => a.featured).map((a) => (
            <article key={a.id} className="group grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16 pb-16 border-b border-border cursor-pointer">
              <div className="aspect-[4/3] bg-foreground overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(222_80%_42%/0.5),transparent_60%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon name="TrendingUp" size={64} className="text-background/25" />
                </div>
                <span className="absolute top-4 left-4 bg-accent text-accent-foreground text-xs font-mono uppercase tracking-wider px-3 py-1">
                  Главное
                </span>
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-5">
                  <span className="text-accent">{a.category}</span>
                  <span>·</span>
                  <span>{a.date}</span>
                </div>
                <h3 className="font-display text-3xl md:text-4xl font-semibold leading-tight tracking-tight group-hover:text-accent transition-colors text-balance">
                  {a.title}
                </h3>
                <p className="mt-5 text-muted-foreground leading-relaxed">{a.excerpt}</p>
                <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Icon name="Clock" size={15} /> {a.read}</span>
                  <span className="flex items-center gap-1.5"><Icon name="Eye" size={15} /> {a.views}</span>
                  <span className="ml-auto flex items-center gap-1.5 font-medium text-foreground underline-grow">
                    Читать <Icon name="ArrowRight" size={15} />
                  </span>
                </div>
              </div>
            </article>
          ))}

          {/* Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
            {articles.filter((a) => !a.featured).map((a) => (
              <article key={a.id} className="group bg-background p-8 hover:bg-card transition-colors cursor-pointer flex flex-col">
                <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-6">
                  <span className="text-accent">{a.category}</span>
                  <span>·</span>
                  <span>{a.read}</span>
                </div>
                <h3 className="font-display text-xl font-semibold leading-snug tracking-tight group-hover:text-accent transition-colors flex-1">
                  {a.title}
                </h3>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{a.excerpt}</p>
                <div className="mt-7 pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>{a.date}</span>
                  <span className="flex items-center gap-1.5"><Icon name="Eye" size={14} /> {a.views}</span>
                </div>
              </article>
            ))}
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
            <span className="text-sm text-muted-foreground ml-2">btwob.ru</span>
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
