// pages/utstyr/index.js

import Head from 'next/head';
import Link from 'next/link';
import { kategorier } from '../../data/utstyr';

export default function UtstyrPage() {
  return (
    <>
      <Head>
        <title>Utstyrsguide for ultraløp | Langeløp.no</title>
        <meta
          name="description"
          content="Kuraterte anbefalinger for utstyr til ultraløp i Norge – vester, sko, sokker, lykter og ernæring. Testet og anbefalt av løpere."
        />
      </Head>

      {/* Hero */}
      <div className="bg-gray-900 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Utstyrsguide
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
            Det du trenger — ikke mer
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-xl leading-relaxed">
            Vi anbefaler kun utstyr vi faktisk bruker selv. Ingen sponsede rangeringer,
            ingen affiliate-press — bare ærlige anbefalinger fra løpere som vet hva som
            holder når det virkelig gjelder.
          </p>
        </div>
      </div>

      {/* Kategorier */}
      <div className="bg-gray-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {kategorier.map((kat) => (
              <Link
                key={kat.slug}
                href={`/utstyr/${kat.slug}`}
                className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 overflow-hidden transition"
              >
                {kat.image ? (
                  <div className="overflow-hidden">
                    <img
                      src={kat.image}
                      alt={kat.navn}
                      className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                    />
                  </div>
                ) : (
                  <div className="w-full h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-5xl">{kat.emoji}</span>
                  </div>
                )}
                <div className="p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                    {kat.navn}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                    {kat.beskrivelse}
                  </p>
                  <p className="text-xs font-semibold text-blue-600 mt-3 group-hover:underline">
                    Se anbefalinger →
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 text-center mt-10 max-w-lg mx-auto leading-relaxed">
            Noen lenker på denne siden er affiliatelenker. Det betyr at vi kan tjene
            en liten provisjon hvis du kjøper via lenken — uten ekstra kostnad for deg.
            Dette påvirker ikke hvilke produkter vi anbefaler.
          </p>
        </div>
      </div>
    </>
  );
}
