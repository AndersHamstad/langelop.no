// pages/sitemap.xml.js
// Dynamisk sitemap — henter alle løpsslugs fra Supabase

import { supabase } from '../lib/supabaseClient';

const BASE_URL = 'https://www.langelop.no';

const STATIC_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/artikler/liste', priority: '0.8', changefreq: 'weekly' },
  { url: '/om-oss', priority: '0.5', changefreq: 'monthly' },
  { url: '/shop', priority: '0.6', changefreq: 'weekly' },
];

function generateSitemap(races, articleSlugs) {
  const racePaths = races.map((r) => ({
    url: `/${r.slug}`,
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: r.updated_at?.split('T')[0] || r.date || undefined,
  }));

  const articlePaths = articleSlugs.map((slug) => ({
    url: `/artikler/${slug}`,
    priority: '0.7',
    changefreq: 'monthly',
  }));

  const allPaths = [...STATIC_PAGES, ...racePaths, ...articlePaths];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPaths
  .map(
    ({ url, priority, changefreq, lastmod }) => `  <url>
    <loc>${BASE_URL}${url}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;
}

export async function getServerSideProps({ res }) {
  const { data: races } = await supabase.from('races').select('slug, date, updated_at');

  // Artikkel-slugs fra data/articles.js
  const { articles } = await import('../data/articles');
  const articleSlugs = articles.map((a) => a.slug);

  const sitemap = generateSitemap(races || [], articleSlugs);

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
  res.write(sitemap);
  res.end();

  return { props: {} };
}

export default function Sitemap() {
  return null;
}
