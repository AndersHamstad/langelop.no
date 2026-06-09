// pages/utstyr/[kategori].js

import Head from 'next/head';
import Link from 'next/link';
import { kategorier, produkter } from '../../data/utstyr';
import UtstyrReviews from '../../components/UtstyrReviews';

export async function getStaticPaths() {
  return {
    paths: kategorier.map((k) => ({ params: { kategori: k.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const kategori = kategorier.find((k) => k.slug === params.kategori);
  if (!kategori) return { notFound: true };
  const liste = produkter[params.kategori] || [];
  return { props: { kategori, liste } };
}

function ProduktKort({ produkt }) {
  const { navn, merkevare, pris, forhandler, url, bilde, tags, anbefalt,
          anbefalingsTekst, beskrivelse, plusser, minuser } = produkt;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${
      anbefalt ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'
    }`}>
      {/* Image */}
      <div className="relative">
        <img
          src={bilde}
          alt={navn}
          className="w-full h-48 object-cover"
        />
        {anbefalt && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
            ★ {anbefalingsTekst || 'Vår anbefaling'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
              {merkevare}
            </p>
            <h3 className="text-lg font-bold text-gray-900">{navn}</h3>
          </div>
          <span className="text-base font-bold text-gray-900 whitespace-nowrap ml-2">
            {pris}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          {beskrivelse}
        </p>

        {/* Plusser/minuser */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            {plusser?.map((p) => (
              <p key={p} className="text-xs text-gray-600 flex gap-1.5 mb-1">
                <span className="text-green-500 flex-shrink-0">✓</span> {p}
              </p>
            ))}
          </div>
          <div>
            {minuser?.map((m) => (
              <p key={m} className="text-xs text-gray-400 flex gap-1.5 mb-1">
                <span className="flex-shrink-0">–</span> {m}
              </p>
            ))}
          </div>
        </div>

        {/* CTA */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`block w-full text-center py-3 rounded-xl text-sm font-semibold transition ${
            anbefalt
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          }`}
        >
          Se hos {forhandler} →
        </a>

        {/* Reviews */}
        <UtstyrReviews produktId={produkt.id} />
      </div>
    </div>
  );
}

export default function KategoriPage({ kategori, liste }) {
  return (
    <>
      <Head>
        <title>{kategori.navn} til ultraløp – Anbefalinger | Langeløp.no</title>
        <meta name="description" content={kategori.beskrivelse} />
      </Head>

      {/* Breadcrumb + header */}
      <div className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/utstyr"
            className="text-xs text-gray-400 hover:text-white mb-4 inline-flex items-center gap-1"
          >
            ← Utstyrsguide
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{kategori.emoji}</span>
            <h1 className="text-3xl font-extrabold">{kategori.navn}</h1>
          </div>
          <p className="text-gray-300 max-w-xl leading-relaxed">
            {kategori.beskrivelse}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">

          {liste.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-3xl mb-3">{kategori.emoji}</p>
              <p className="font-medium text-gray-600">Anbefalinger kommer snart</p>
              <p className="text-sm mt-1">Vi jobber med å teste produktene skikkelig før vi anbefaler dem.</p>
            </div>
          ) : (
            <>
              {/* Toppanbefaling */}
              {liste.filter((p) => p.anbefalt).length > 0 && (
                <div className="mb-10">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                    Vår toppanbefaling
                  </h2>
                  <div className="grid gap-6 md:grid-cols-1 max-w-xl">
                    {liste.filter((p) => p.anbefalt).map((p) => (
                      <ProduktKort key={p.id} produkt={p} />
                    ))}
                  </div>
                </div>
              )}

              {/* Andre anbefalinger */}
              {liste.filter((p) => !p.anbefalt).length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                    Andre gode alternativer
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {liste.filter((p) => !p.anbefalt).map((p) => (
                      <ProduktKort key={p.id} produkt={p} />
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-xs text-gray-400 text-center mt-10 max-w-lg mx-auto leading-relaxed">
                Noen lenker er affiliatelenker. Vi tjener en liten provisjon hvis du
                kjøper via lenken — uten ekstra kostnad for deg. Dette påvirker ikke
                hvilke produkter vi anbefaler.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
