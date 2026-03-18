// pages/artikler/liste.js
import Head from 'next/head';
import Link from 'next/link'; // ✅ FIX 2: Link i stedet for <a>
import Image from 'next/image';
import { articles } from '../../data/articles';

// ✅ FIX 1: getStaticProps – klar for fremtidig CMS/Supabase-migrering
export async function getStaticProps() {
  // Artikler kommer fra lokal datafil nå, men kan enkelt byttes til API-kall her
  const sorted = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
  return {
    props: { articles: sorted },
    revalidate: 3600,
  };
}

export default function ArtiklerListe({ articles }) {
  // ✅ FIX 5: Hent unike kategorier for filtrering (klar når articles får category-felt)
  const hasCategories = articles.some((a) => a.category);
  const categories = hasCategories
    ? ['Alle', ...new Set(articles.map((a) => a.category).filter(Boolean))]
    : [];

  return (
    <>
      <Head>
        <title>Artikler om ultraløping | Langeløp.no</title>
        <meta
          name="description"
          content="Tips, guider og erfaringer fra ultraløpsmiljøet i Norge."
        />
        {/* ✅ FIX 4: OpenGraph */}
        <meta property="og:title" content="Artikler om ultraløping – Langeløp.no" />
        <meta property="og:description" content="Tips, guider og erfaringer fra ultraløpsmiljøet i Norge." />
        <meta property="og:type" content="website" />
      </Head>

      {/* === Hero === */}
      <div className="relative bg-[#0f1f2e] overflow-hidden">
        {/* Subtil tekstur-overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #1d4ed8 0%, transparent 40%)`,
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-10 pb-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400 mb-3">
            Langeløp.no
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight max-w-xl">
            Artikler og guider
          </h1>
          <p className="mt-4 text-gray-400 text-base max-w-lg leading-relaxed">
            Tips, erfaringer og kunnskap fra ultraløpsmiljøet i Norge.
          </p>

          {/* ✅ FIX 5: Kategori-filtre (vises kun hvis artikler har category-felt) */}
          {hasCategories && (
            <div className="flex flex-wrap gap-2 mt-6">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white hover:bg-white/20 transition"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* === Artikkelgrid === */}
      <main className="bg-gray-100 px-4 py-10 min-h-screen">
        <div className="max-w-5xl mx-auto">

          {/* ✅ FIX 3: Fallback hvis ingen artikler */}
          {articles.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg font-medium">Ingen artikler publisert enda.</p>
              <p className="text-sm mt-1">Kom tilbake snart!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, index) => (
                // ✅ FIX 2: Link i stedet for <a>
                <Link
                  key={article.slug}
                  href={`/artikler/${article.slug}`}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-200 hover:border-gray-300 overflow-hidden flex flex-col transition-all duration-200"
                >
                  {/* ✅ FIX 8: h-48 i stedet for h-36 – mer luft til bilder */}
                  {article.image ? (
                    <div className="relative w-full h-48 overflow-hidden bg-gray-200">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        // ✅ FIX 7: Fallback til 'center center' hvis focusList mangler
                        style={{ objectPosition: article.focusList || 'center center' }}
                        loading={index < 3 ? 'eager' : 'lazy'}
                      />
                      {/* Kategori-chip over bildet */}
                      {article.category && (
                        <span className="absolute top-3 left-3 bg-white/90 text-gray-800 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full">
                          {article.category}
                        </span>
                      )}
                    </div>
                  ) : (
                    // Placeholder hvis ingen bilde
                    <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
                      <span className="text-3xl opacity-30">🏔️</span>
                    </div>
                  )}

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex-1">
                      <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug mb-2 line-clamp-2">
                        {article.title}
                      </h2>
                      <p className="text-xs text-gray-400 mb-3">
                        {article.date}
                        {article.author && (
                          <> &bull; <span>{article.author}</span></>
                        )}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </div>

                    <span className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 font-medium group-hover:gap-2 transition-all">
                      Les mer
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                        <path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}