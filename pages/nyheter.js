// pages/nyheter.js
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), 'd. MMMM yyyy', { locale: nb });
  } catch {
    return dateString;
  }
};

const formatResultTime = (seconds) => {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export async function getStaticProps() {
  // ── Siste resultater: vinnere (posisjon 1) fra de nyeste løpene ──
  const { data: winnerResults } = await supabase
    .from('race_results')
    .select('race_id, name, time_seconds, gender, distance_km')
    .eq('position', 1)
    .order('year', { ascending: false })
    .limit(150);

  let results = [];
  if (winnerResults?.length > 0) {
    const raceIds = [...new Set(winnerResults.map((r) => r.race_id))];
    const { data: resultRaces } = await supabase
      .from('races')
      .select('slug, name, date')
      .in('slug', raceIds);
    const raceBySlug = Object.fromEntries((resultRaces || []).map((r) => [r.slug, r]));

    const grouped = {};
    for (const r of winnerResults) {
      const race = raceBySlug[r.race_id];
      if (!race?.date) continue;
      if (!grouped[r.race_id]) {
        grouped[r.race_id] = { slug: r.race_id, name: race.name, date: race.date, winners: [] };
      }
      grouped[r.race_id].winners.push({ name: r.name, time_seconds: r.time_seconds, gender: r.gender });
    }

    results = Object.values(grouped)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 30);
  }

  // ── Påmeldinger som har åpnet / åpner ──
  const { data: registrationRaces } = await supabase
    .from('races')
    .select('slug, name, date, location, region, registration_opens_at, status_note, updated_at')
    .not('registration_opens_at', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(30);

  return {
    props: {
      results,
      registrations: registrationRaces || [],
    },
    revalidate: 300,
  };
}

export default function Nyheter({ results, registrations }) {
  const [tab, setTab] = useState('resultater');

  return (
    <>
      <Head>
        <title>Nyheter – resultater og påmeldinger | Langeløp.no</title>
        <meta
          name="description"
          content="Siste resultater og påmeldingsnyheter fra norske ultraløp."
        />
        <meta property="og:title" content="Nyheter – Langeløp.no" />
        <meta property="og:description" content="Siste resultater og påmeldingsnyheter fra norske ultraløp." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.langelop.no/nyheter" />
      </Head>

      {/* === Hero === */}
      <div className="relative bg-[#0f1f2e] overflow-hidden">
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
            Nyheter
          </h1>
          <p className="mt-4 text-gray-400 text-base max-w-lg leading-relaxed">
            Ferske resultater og påmeldingsnyheter fra norske ultraløp.
          </p>

          <div className="flex gap-1 mt-6 bg-white/10 rounded-xl p-1 w-fit">
            {[
              { value: 'resultater', label: 'Resultater' },
              { value: 'pameldinger', label: 'Påmeldinger' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  tab === t.value ? 'bg-white text-gray-900' : 'text-gray-300 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* === Innhold === */}
      <main className="bg-gray-100 px-4 py-10 min-h-screen">
        <div className="max-w-5xl mx-auto">
          {tab === 'resultater' && (
            results.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-lg font-medium">Ingen resultater registrert enda.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
                {results.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/${r.slug}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                      <p className="text-xs text-gray-400 mb-1">{formatDate(r.date)}</p>
                      <p className="text-sm text-gray-600">
                        {r.winners.map((w, i) => (
                          <span key={i}>
                            {w.name} <span className="text-gray-400">{formatResultTime(w.time_seconds)}</span>
                            {i < r.winners.length - 1 ? ' · ' : ''}
                          </span>
                        ))}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}

          {tab === 'pameldinger' && (
            registrations.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-lg font-medium">Ingen påmeldingsnyheter enda.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
                {registrations.map((r) => {
                  const opensInFuture = r.registration_opens_at && new Date(r.registration_opens_at) > new Date();
                  return (
                    <Link
                      key={r.slug}
                      href={`/${r.slug}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                        <p className="text-xs text-gray-400 mb-1">
                          {formatDate(r.date)} · {r.location}
                        </p>
                        <p className="text-sm text-gray-600">
                          {opensInFuture ? (
                            <>📅 Påmelding åpner {formatDate(r.registration_opens_at)}</>
                          ) : (
                            <>Påmelding åpnet {formatDate(r.registration_opens_at)}</>
                          )}
                          {r.status_note ? ` · ${r.status_note}` : ''}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          )}
        </div>
      </main>
    </>
  );
}
