// pages/[slug].js
import Head from 'next/head';
import Script from 'next/script';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { buildRaceJsonLd } from '../lib/structuredData';
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { nb } from 'date-fns/locale';
import {
  MapPin, Flag, Mountain, Globe, ArrowLeft,
  ChevronDown, ChevronUp, Share2, CalendarPlus,
  ExternalLink, Trophy, Calendar,
} from 'lucide-react';

// ─── Data fetching ────────────────────────────────────────────────────────────

export async function getStaticPaths() {
  const { data: races } = await supabase.from('races').select('slug');
  return {
    paths: (races || []).map((r) => ({ params: { slug: r.slug } })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const { data: race } = await supabase
    .from('races')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!race) return { notFound: true };

  const [{ data: comments }, { data: results }, { data: nearbyRaces }] =
    await Promise.all([
      supabase
        .from('comments')
        .select('id, name, comment, created_at')
        .eq('race_id', race.id)
        .eq('approved', true)
        .order('created_at', { ascending: false }),

      // Hent alle år – ikke hardkodet
      supabase
        .from('race_results')
        .select('id, year, distance_km, position, name, laps, time_seconds, gender')
        .eq('race_id', race.slug)
        .order('year', { ascending: false })
        .order('distance_km', { ascending: true })
        .order('position', { ascending: true }),

      // Kommende løp i samme region
      supabase
        .from('races')
        .select('slug, name, date, distance, location, image_url, distance_numeric')
        .eq('region', race.region)
        .neq('slug', race.slug)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(4),
    ]);

  return {
    props: {
      race,
      comments: comments || [],
      results: results || [],
      nearbyRaces: nearbyRaces || [],
    },
    revalidate: 3600,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (dateString) => {
  try {
    return format(parseISO(dateString), 'd. MMMM yyyy', { locale: nb });
  } catch {
    return dateString;
  }
};

const formatDateShort = (dateString) => {
  try {
    return format(parseISO(dateString), 'd. MMM', { locale: nb });
  } catch {
    return dateString;
  }
};

const formatTime = (seconds) => {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const truncateAtSentence = (text, maxChars = 650) => {
  if (!text) return '';
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const lastPeriod = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? ')
  );
  return lastPeriod > 100 ? slice.slice(0, lastPeriod + 1) : slice + '…';
};

function downloadICS(race) {
  const date = new Date(race.date + 'T08:00:00');
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Langeløp.no//NO',
    'BEGIN:VEVENT',
    `UID:${race.slug}@langelop.no`,
    `DTSTART:${fmt(date)}`,
    `SUMMARY:${race.name}`,
    `LOCATION:${race.location}, Norge`,
    `DESCRIPTION:https://langelop.no/${race.slug}`,
    `URL:https://langelop.no/${race.slug}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${race.slug}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── CommentForm ──────────────────────────────────────────────────────────────

function CommentForm({ raceId }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [formState, setFormState] = useState({ status: 'idle', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormState({ status: 'loading', message: '' });

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ race_id: raceId, name, email, comment }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setFormState({ status: 'error', message: json.error || 'Noe gikk galt.' });
      return;
    }

    setFormState({
      status: 'success',
      message: 'Takk! Kommentaren er sendt inn og vises etter godkjenning.',
    });
    setName(''); setEmail(''); setComment('');
  };

  if (formState.status === 'success') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-900">
        <p className="font-semibold">Sendt inn! 🎉</p>
        <p className="mt-1 text-sm">{formState.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input type="text" placeholder="Fornavn" value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required />
        <input type="email" placeholder="E-post (vises ikke)" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required />
      </div>
      <textarea placeholder="Del dine erfaringer, tips eller anbefalinger…" value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={4} required />
      {formState.status === 'error' && (
        <p className="text-sm text-red-600">{formState.message}</p>
      )}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-gray-400">
          E-posten din vises ikke offentlig. Kommentaren godkjennes før den publiseres.
        </p>
        <button type="submit" disabled={formState.status === 'loading'}
          className="shrink-0 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition disabled:opacity-60">
          {formState.status === 'loading' ? 'Sender…' : 'Send inn'}
        </button>
      </div>
    </form>
  );
}

// ─── NearbyRaceCard ───────────────────────────────────────────────────────────

function NearbyRaceCard({ race }) {
  const distances = [].concat(race.distance || [])
    .flatMap((d) => (typeof d === 'string' ? d.split(',') : [d]))
    .map((d) => String(d).trim().replace(/[\[\]{}"']/g, ''))
    .filter(Boolean);

  return (
    <Link href={`/${race.slug}`}
      className="flex-shrink-0 w-56 sm:w-auto bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition group">
      <div className="relative h-24 bg-gray-100 overflow-hidden">
        <img
          src={race.image_url || '/fallback.jpg'}
          alt={race.name}
          className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity duration-300"
        />
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{race.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{formatDateShort(race.date)}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {distances.slice(0, 2).map((d, i) => (
            <span key={i} className="bg-blue-50 text-blue-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
              {d}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

// ─── KeyFactsCard ─────────────────────────────────────────────────────────────

function KeyFactsCard({ race, onShare, onCalendar, shareLabel }) {
  const distances = Array.isArray(race.distance) ? race.distance : race.distance?.split(',') || [];
  const isUpcoming = race.date && new Date(race.date) >= new Date();

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
      {/* Distanser */}
      <div className="flex flex-wrap gap-2">
        {distances.map((d, i) => (
          <span key={i}
            className="bg-blue-50 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
            {String(d).trim().replace(/[[\]"']/g, '')}
          </span>
        ))}
      </div>

      {/* Detaljer */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div className="flex items-start gap-2 text-gray-700">
          <Calendar size={15} className="mt-0.5 shrink-0 text-gray-400" />
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Dato</dt>
            <dd className="font-medium">{formatDate(race.date)}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2 text-gray-700">
          <MapPin size={15} className="mt-0.5 shrink-0 text-gray-400" />
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Sted</dt>
            <dd className="font-medium">{race.location || '–'}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2 text-gray-700">
          <Flag size={15} className="mt-0.5 shrink-0 text-gray-400" />
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Fylke</dt>
            <dd className="font-medium">{race.region || '–'}</dd>
          </div>
        </div>
        {race.elevation_m && (
          <div className="flex items-start gap-2 text-gray-700">
            <Mountain size={15} className="mt-0.5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Høydemeter</dt>
              <dd className="font-medium">+{race.elevation_m.toLocaleString('nb-NO')} m</dd>
            </div>
          </div>
        )}
        {race.url && (
          <div className="flex items-start gap-2 text-gray-700">
            <Globe size={15} className="mt-0.5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Nettside</dt>
              <dd>
                <a href={race.url.startsWith('http') ? race.url : `https://${race.url}`}
                  target="_blank" rel="noreferrer"
                  className="text-blue-600 hover:underline font-medium text-xs break-all">
                  {race.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]}
                </a>
              </dd>
            </div>
          </div>
        )}
      </dl>

      {/* CTA */}
      {isUpcoming && race.url && (
        <a href={race.url.startsWith('http') ? race.url : `https://${race.url}`}
          target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition">
          Meld deg på
          <ExternalLink size={14} />
        </a>
      )}

      {/* Del + kalender */}
      <div className="flex gap-2">
        <button onClick={onShare}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition">
          <Share2 size={14} />
          {shareLabel}
        </button>
        <button onClick={onCalendar}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition">
          <CalendarPlus size={14} />
          Kalender
        </button>
      </div>
    </div>
  );
}

// ─── RacePage ─────────────────────────────────────────────────────────────────

export default function RacePage({ race, comments, results, nearbyRaces }) {
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [shareLabel, setShareLabel] = useState('Del');

  // Resultater: dynamisk årsvalg
  const availableYears = [...new Set(results.map((r) => r.year))].sort((a, b) => b - a);
  const [selectedYear, setSelectedYear] = useState(availableYears[0] ?? null);
  const yearResults = results.filter((r) => r.year === selectedYear);

  const isUpcoming = race.date && new Date(race.date) >= new Date();

  const truncated = race.description ? truncateAtSentence(race.description, 400) : null;
  const needsTruncation = race.description && truncated !== race.description;

  const distances = Array.isArray(race.distance) ? race.distance : race.distance?.split(',') || [];

  // SEO
  const distStr = distances
    .map((d) => String(d).trim().replace(/[[\]"']/g, ''))
    .filter(Boolean)
    .join(', ');
  const year = race.date ? new Date(race.date).getFullYear() : '';
  const seoTitle = `${race.name}${distStr ? ` ${distStr}` : ''} ${year} – ${race.location} | Langeløp.no`;
  const seoDesc = race.description?.slice(0, 155) || `${race.name} – ${race.location}, ${formatDate(race.date)}`;

  const jsonLd = buildRaceJsonLd(race);

  // Handlers
  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: race.name, url });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(url);
    setShareLabel('Kopiert!');
    setTimeout(() => setShareLabel('Del'), 2000);
  }

  function handleCalendar() {
    downloadICS(race);
  }

  const sharedCardProps = { race, onShare: handleShare, onCalendar: handleCalendar, shareLabel };

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={`https://www.langelop.no/${race.slug}`} />
        <meta property="og:title" content={`${race.name} – ${formatDate(race.date)}`} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:url" content={`https://www.langelop.no/${race.slug}`} />
        <meta property="og:type" content="website" />
        {race.image_url && <meta property="og:image" content={race.image_url} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${race.name} – ${formatDate(race.date)}`} />
        <meta name="twitter:description" content={seoDesc} />
        {race.image_url && <meta name="twitter:image" content={race.image_url} />}
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      {race.strava_route_id && (
        <Script src="https://strava-embeds.com/embed.js" strategy="lazyOnload" />
      )}

      {/* Hero */}
      <div className="relative w-full h-[42vh] md:h-[46vh] overflow-hidden bg-gray-900">
        {race.image_url ? (
          <img src={race.image_url} alt={race.name}
            className="absolute inset-0 w-full h-full object-cover opacity-50 scale-105 blur-[1px]" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute top-3 left-3 md:top-6 md:left-8 z-20">
          <Link href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition">
            <ArrowLeft size={15} /> Alle løp
          </Link>
        </div>

        <div className="absolute bottom-8 md:bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            {isUpcoming && (
              <span className="inline-block mb-3 text-xs font-semibold uppercase tracking-widest text-green-400">
                Kommende løp
              </span>
            )}
            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              {race.name}
            </h1>
            <p className="mt-2 text-white/75 text-base md:text-lg">
              {formatDate(race.date)} · {race.location}
            </p>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="bg-gray-100 px-4 pb-16 min-h-screen">
        <div className="max-w-5xl mx-auto -mt-4 md:mt-10 relative z-10">

          {/* Desktop: to kolonner | Mobil: enkeltkolonne */}
          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 lg:items-start">

            {/* ── Venstre kolonne (og mobil) ── */}
            <div className="space-y-5">

              {/* Fakta-kort: kun synlig på mobil */}
              <div className="lg:hidden">
                <KeyFactsCard {...sharedCardProps} />
              </div>

              {/* Beskrivelse */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-900 mb-3">
                  Om løpet
                </h2>
                {race.description ? (
                  <>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                      {showFullDesc ? race.description : truncated || race.description}
                    </p>
                    {needsTruncation && (
                      <button onClick={() => setShowFullDesc((p) => !p)}
                        className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                        {showFullDesc
                          ? <><ChevronUp size={15} /> Vis mindre</>
                          : <><ChevronDown size={15} /> Les mer</>}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Ingen beskrivelse lagt inn ennå.</p>
                )}
              </div>

              {/* Løypekart */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-900 mb-4">
                  Løypekart
                </h2>
                {race.strava_route_id ? (
                  <div className="strava-embed-placeholder"
                    data-embed-type="route"
                    data-embed-id={race.strava_route_id}
                    data-style="standard"
                    data-from-embed="true" />
                ) : (
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-sm font-medium text-gray-700">Løypekart er ikke lagt inn ennå.</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Har du Strava- eller GPX-lenke? Send den gjerne til oss.
                    </p>
                  </div>
                )}
              </div>

              {/* Resultater */}
              {results.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                      <Trophy size={13} /> Toppliste
                    </h2>

                    {/* Årsvelger */}
                    {availableYears.length > 1 && (
                      <div className="flex gap-1">
                        {availableYears.map((y) => (
                          <button key={y} onClick={() => setSelectedYear(y)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                              selectedYear === y
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}>
                            {y}
                          </button>
                        ))}
                      </div>
                    )}
                    {availableYears.length === 1 && (
                      <span className="text-xs text-gray-400">{selectedYear}</span>
                    )}
                  </div>

                  {/* Vinner */}
                  {yearResults[0] && (
                    <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 text-white p-5 mb-4">
                      <p className="text-xs uppercase tracking-wide text-white/60 font-semibold mb-2">
                        Vinner {selectedYear}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                        <p className="text-xl font-bold">🥇 {yearResults[0].name}</p>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold font-mono self-start sm:self-auto">
                          {formatTime(yearResults[0].time_seconds)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Resten av topplisten */}
                  <div className="divide-y divide-gray-100">
                    {yearResults.slice(1, 10).map((r) => {
                      const medalClass =
                        r.position === 2 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800' :
                        r.position === 3 ? 'bg-gradient-to-br from-orange-200 to-orange-400 text-orange-950' :
                        'bg-gray-100 text-gray-700';
                      const isTop3 = r.position <= 3;

                      return (
                        <div key={r.id}>
                          <div className={`flex items-center justify-between gap-4 py-3 ${isTop3 ? 'px-3 rounded-xl bg-gray-50' : ''}`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`w-9 h-9 rounded-full text-sm font-semibold flex items-center justify-center shrink-0 shadow-sm ${medalClass}`}>
                                {r.position}
                              </span>
                              <p className={`truncate ${isTop3 ? 'text-base font-semibold text-gray-900' : 'text-sm font-medium text-gray-900'}`}>
                                {r.name}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-gray-700 shrink-0 font-mono">
                              {formatTime(r.time_seconds)}
                            </p>
                          </div>
                          {r.position === 3 && <div className="h-3" />}
                        </div>
                      );
                    })}
                  </div>

                  {yearResults.length > 10 && (
                    <p className="mt-4 text-xs text-gray-400">
                      Viser topp 10 av {yearResults.length} registrerte resultater.
                    </p>
                  )}
                </div>
              )}

              {/* Kommentarer */}
              <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-gray-900 mb-1">
                    Erfaringer fra løpere
                  </h2>
                  <p className="text-xs text-gray-400">
                    Har du løpt dette løpet? Del tips og erfaringer med andre.
                  </p>
                </div>

                {comments.length === 0 ? (
                  <p className="text-gray-400 text-sm">Ingen erfaringer delt enda – bli den første!</p>
                ) : (
                  <ul className="space-y-3">
                    {comments.map((c) => (
                      <li key={c.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                          <p className="text-xs text-gray-400">{formatDate(c.created_at)}</p>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{c.comment}</p>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">Del din erfaring</h3>
                  <CommentForm raceId={race.id} />
                </div>
              </div>

              {/* Løp i nærheten */}
              {nearbyRaces.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-base font-bold text-gray-900 mb-4">
                    Andre løp i {race.region}
                  </h2>
                  {/* Horisontal scroll på mobil, grid på desktop */}
                  <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0">
                    {nearbyRaces.map((r) => (
                      <NearbyRaceCard key={r.slug} race={r} />
                    ))}
                  </div>
                </div>
              )}

              {/* Arrangør-oppfordring */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">👋 Arrangerer du dette løpet?</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Ta kontakt så hjelper vi deg å oppdatere informasjonen.
                  </p>
                </div>
                <a href="/for-arrangorer"
                  className="shrink-0 inline-block px-4 py-2 bg-white border border-blue-200 text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-100 transition">
                  Oppdater informasjon
                </a>
              </div>
            </div>

            {/* ── Høyre kolonne (kun desktop, sticky) ── */}
            <aside className="hidden lg:block lg:sticky lg:top-6 space-y-4">
              <KeyFactsCard {...sharedCardProps} />
            </aside>
          </div>
        </div>
      </main>

      {/* Bunn-footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-8 mt-0">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <Link href="/" className="inline-flex items-center gap-1.5 hover:text-gray-900 transition">
            <ArrowLeft size={14} /> Tilbake til alle løp
          </Link>
          <p>Savner du et løp? <a href="mailto:post@langelop.no" className="text-blue-600 hover:underline">Tips oss</a></p>
        </div>
      </div>

      {/* Mobil sticky CTA (kun kommende løp med påmeldingslenke) */}
      {isUpcoming && race.url && (
        <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
          <a href={race.url.startsWith('http') ? race.url : `https://${race.url}`}
            target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl">
            Meld deg på <ExternalLink size={14} />
          </a>
          <button onClick={handleShare}
            className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600">
            <Share2 size={16} />
          </button>
          <button onClick={handleCalendar}
            className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600">
            <CalendarPlus size={16} />
          </button>
        </div>
      )}
    </>
  );
}
