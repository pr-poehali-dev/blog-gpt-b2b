import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  keywords?: string;
  publishedTime?: string;
  jsonLd?: object | object[];
}

const SITE = 'https://btwob.ru';
const DEFAULT_IMAGE = `${SITE}/og-default.jpg`;

export function useSeo({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  keywords,
  publishedTime,
  jsonLd,
}: SeoProps) {
  useEffect(() => {
    const fullTitle = title.includes('BTWOB') ? title : `${title} — BTWOB`;
    document.title = fullTitle;

    const setMeta = (name: string, content: string, prop = false) => {
      const attr = prop ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // Basic
    setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
    setMeta('robots', 'index, follow');
    setMeta('author', 'BTWOB');

    // Canonical
    setLink('canonical', canonical ? `${SITE}${canonical}` : `${SITE}${window.location.pathname}`);

    // Open Graph
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:type', ogType, true);
    setMeta('og:url', `${SITE}${window.location.pathname}`, true);
    setMeta('og:image', ogImage || DEFAULT_IMAGE, true);
    setMeta('og:image:width', '1200', true);
    setMeta('og:image:height', '630', true);
    setMeta('og:site_name', 'BTWOB — B2B деловой журнал', true);
    setMeta('og:locale', 'ru_RU', true);
    if (publishedTime) setMeta('article:published_time', publishedTime, true);

    // Twitter / VK
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage || DEFAULT_IMAGE);

    // Yandex
    setMeta('yandex-verification', '');

    // JSON-LD
    const existingLd = document.querySelectorAll('script[data-jsonld="true"]');
    existingLd.forEach((el) => el.remove());

    const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
    schemas.forEach((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-jsonld', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      // Очищаем JSON-LD при уходе со страницы
      document.querySelectorAll('script[data-jsonld="true"]').forEach((el) => el.remove());
    };
  }, [title, description, canonical, ogImage, ogType, keywords, publishedTime, JSON.stringify(jsonLd)]);
}
