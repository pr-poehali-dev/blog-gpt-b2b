export interface CategoryArticle {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  read: string;
  views: string;
}

export interface Category {
  slug: string;
  name: string;
  count: number;
  icon: string;
  accent: string;          // hsl values for --accent
  accentForeground: string;
  tagline: string;
  description: string;
  articles: CategoryArticle[];
}

export const categories: Category[] = [
  {
    slug: 'strategy',
    name: 'Стратегия',
    count: 42,
    icon: 'Target',
    accent: '222 80% 42%',
    accentForeground: '0 0% 100%',
    tagline: 'Долгосрочное мышление',
    description: 'Архитектура роста, конкурентное позиционирование и решения на длинном горизонте для B2B-компаний.',
    articles: [
      { id: 1, title: 'Как выстроить B2B-воронку для длинного цикла сделки', excerpt: 'Архитектура воронки для сложных продаж с несколькими ЛПР.', date: '24 июня 2026', read: '8 мин', views: '12.4K' },
      { id: 2, title: 'Синяя стратегия: где искать незанятые ниши B2B', excerpt: 'Поиск рынков без прямой конкуренции и переоценка спроса.', date: '19 июня 2026', read: '7 мин', views: '8.9K' },
      { id: 3, title: 'Стратегические сессии, которые не тонут в текучке', excerpt: 'Формат, который превращает планы в действия.', date: '15 июня 2026', read: '6 мин', views: '6.3K' },
      { id: 4, title: 'M&A для среднего бизнеса: когда покупать конкурента', excerpt: 'Критерии оценки сделки и интеграции активов.', date: '11 июня 2026', read: '9 мин', views: '5.1K' },
    ],
  },
  {
    slug: 'finance',
    name: 'Финансы',
    count: 38,
    icon: 'TrendingUp',
    accent: '152 60% 36%',
    accentForeground: '0 0% 100%',
    tagline: 'Цифры под контролем',
    description: 'Unit-экономика, денежные потоки и метрики, на которые смотрят инвесторы и советы директоров.',
    articles: [
      { id: 1, title: 'Unit-экономика SaaS: метрики глазами инвесторов', excerpt: 'CAC, LTV, payback и почему усреднения вводят в заблуждение.', date: '22 июня 2026', read: '7 мин', views: '7.8K' },
      { id: 2, title: 'Кассовый разрыв: как увидеть его за квартал до', excerpt: 'Прогнозирование cash flow для растущей компании.', date: '18 июня 2026', read: '6 мин', views: '6.0K' },
      { id: 3, title: 'Финмодель за один вечер: рабочий шаблон', excerpt: 'Минимальная модель, которая отвечает на главные вопросы.', date: '14 июня 2026', read: '5 мин', views: '9.2K' },
      { id: 4, title: 'Налоговая оптимизация без рисков для B2B', excerpt: 'Легальные инструменты снижения нагрузки.', date: '9 июня 2026', read: '8 мин', views: '4.7K' },
    ],
  },
  {
    slug: 'tech',
    name: 'Технологии',
    count: 56,
    icon: 'Cpu',
    accent: '262 70% 52%',
    accentForeground: '0 0% 100%',
    tagline: 'Внедрять, а не хайповать',
    description: 'AI, автоматизация и цифровая инфраструктура — зрелые сценарии без обещаний и маркетингового шума.',
    articles: [
      { id: 1, title: 'AI-агенты в корпоративных процессах в 2026', excerpt: 'Обзор зрелых сценариев автоматизации без хайпа.', date: '23 июня 2026', read: '6 мин', views: '9.1K' },
      { id: 2, title: 'RAG для внутренней базы знаний компании', excerpt: 'Как сделать поиск по документам, которому доверяют.', date: '20 июня 2026', read: '8 мин', views: '11.3K' },
      { id: 3, title: 'Legacy-системы: мигрировать или жить с ними', excerpt: 'Стратегия модернизации без остановки бизнеса.', date: '16 июня 2026', read: '7 мин', views: '5.8K' },
      { id: 4, title: 'Безопасность данных при работе с LLM', excerpt: 'Что нельзя отдавать в облако и как это контролировать.', date: '12 июня 2026', read: '6 мин', views: '7.4K' },
    ],
  },
  {
    slug: 'marketing',
    name: 'Маркетинг',
    count: 31,
    icon: 'Megaphone',
    accent: '14 88% 52%',
    accentForeground: '0 0% 100%',
    tagline: 'Спрос на масштабе',
    description: 'Account-Based Marketing, контент и спрос-генерация для сложных продуктов с длинным циклом.',
    articles: [
      { id: 1, title: 'Account-Based Marketing: персонализация на масштабе', excerpt: 'Точечная работа с ключевыми клиентами.', date: '21 июня 2026', read: '5 мин', views: '6.2K' },
      { id: 2, title: 'Контент-маркетинг для B2B, который приводит лиды', excerpt: 'Воронка контента от осведомлённости до сделки.', date: '17 июня 2026', read: '7 мин', views: '8.1K' },
      { id: 3, title: 'Позиционирование: одно предложение, которое продаёт', excerpt: 'Как сформулировать ценность за 10 секунд.', date: '13 июня 2026', read: '4 мин', views: '9.5K' },
      { id: 4, title: 'Performance в B2B: атрибуция длинного цикла', excerpt: 'Как считать вклад каналов в сделку.', date: '8 июня 2026', read: '6 мин', views: '4.3K' },
    ],
  },
  {
    slug: 'management',
    name: 'Управление',
    count: 27,
    icon: 'Users',
    accent: '38 92% 46%',
    accentForeground: '220 30% 8%',
    tagline: 'Команды и процессы',
    description: 'OKR, найм и операционная эффективность распределённых команд в условиях быстрого роста.',
    articles: [
      { id: 1, title: 'OKR в распределённых командах: ошибки внедрения', excerpt: 'Почему цели не достигаются и как это исправить.', date: '20 июня 2026', read: '9 мин', views: '5.5K' },
      { id: 2, title: 'Найм топ-менеджеров: как не ошибиться', excerpt: 'Сигналы, которые видны до оффера.', date: '16 июня 2026', read: '7 мин', views: '6.8K' },
      { id: 3, title: 'Операционные ритмы: совещания, которые двигают', excerpt: 'Календарь управленческих встреч без выгорания.', date: '11 июня 2026', read: '5 мин', views: '7.2K' },
      { id: 4, title: 'Делегирование без потери контроля', excerpt: 'Система передачи задач и ответственности.', date: '7 июня 2026', read: '6 мин', views: '4.9K' },
    ],
  },
  {
    slug: 'sales',
    name: 'Продажи',
    count: 44,
    icon: 'Handshake',
    accent: '188 80% 38%',
    accentForeground: '0 0% 100%',
    tagline: 'Сделки, а не презентации',
    description: 'Методологии сложных продаж, работа с ЛПР и построение предсказуемого пайплайна выручки.',
    articles: [
      { id: 1, title: 'MEDDIC: квалификация сделок, которая работает', excerpt: 'Методология для крупных корпоративных продаж.', date: '23 июня 2026', read: '8 мин', views: '10.2K' },
      { id: 2, title: 'Работа с возражениями по цене в B2B', excerpt: 'Как защитить ценность и не давать скидку первым.', date: '19 июня 2026', read: '6 мин', views: '8.7K' },
      { id: 3, title: 'Пайплайн, которому верит финдиректор', excerpt: 'Прогноз продаж с честной вероятностью.', date: '14 июня 2026', read: '7 мин', views: '6.6K' },
      { id: 4, title: 'Up-sell и cross-sell на существующей базе', excerpt: 'Рост выручки без новых клиентов.', date: '10 июня 2026', read: '5 мин', views: '5.4K' },
    ],
  },
];

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
