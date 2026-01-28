// pages/artikler/liste.js
import Head from 'next/head';
import { articles } from '../../data/articles'; 

export default function ArtiklerListe() {
return (
<>
<Head>
<title>Artikler | langeløp.no</title>
</Head>

<main className="bg-gray-100 py-10 px-4 min-h-screen">
<div className="max-w-5xl mx-auto">
<h1 className="text-3xl font-bold text-gray-900 mb-8">Artikler</h1>


<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
{articles.map((article) => (
<a
key={article.slug}
href={`/artikler/${article.slug}`}
className="group bg-white rounded-xl shadow hover:shadow-md border border-gray-200 overflow-hidden flex flex-col"
>
{article.image && (
  <img
  src={article.image}
  alt={article.title}
  className="w-full h-36 object-cover group-hover:opacity-90 transition"
  style={{ objectPosition: article.focusList || 'center center' }}
/>
)}

<div className="p-4 flex flex-col justify-between h-full">
<div>
<h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 mb-1">
{article.title}
</h2>
<p className="text-xs text-gray-500 mb-2">
{article.date} &bull; Skrevet av {article.author}
</p>
<p className="text-sm text-gray-700 line-clamp-3">{article.excerpt}</p>
</div>
<span className="mt-4 text-sm text-blue-600 font-medium group-hover:underline">Les mer &rarr;</span>
</div>
</a>
))}
</div>
</div>
</main>
</>
);
}