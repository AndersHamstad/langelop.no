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
  MapPin,
  Flag,
  Mountain,
  Globe,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

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

  const { data: comments } = await supabase
    .from('comments')
    .select('id, name, comment, created_at')
    .eq('race_id', race.id)
    .eq('approved', true)
    .order('created_at', { ascending: false });

  return {
    props: { race, comments: comments || [] },
    revalidate: 3600,
  };
}

const formatDate = (dateString) => {
  try {
    return format(parseISO(dateString), 'd. MMMM yyyy', { locale: nb });
  } catch {
    return dateString;
  }
};

const truncateAtSentence = (text, maxChars = 400) => {
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

function CommentForm({ raceId, onSuccess }) {
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

    setName('');
    setEmail('');
    setComment('');
    onSuccess?.();
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
        <input
          type="text"
          placeholder="Fornavn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          type="email"
          placeholder="E-post (vises ikke)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <textarea
        placeholder="Del dine erfaringer, tips eller anbefalinger…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={4}
        required
      />

      {formState.status === 'error' && (
        <p className="text-sm text-red-600">{formState.message}</p>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-gray-400">
          E-posten din vises ikke offentlig. Kommentaren godkjennes før den publiseres.
        </p>

        <button
          type="submit"
          disabled={formState.status === 'loading'}
          className="shrink-0 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition disabled:opacity-60"
        >
          {formState.status === 'loading' ? 'Sender…' : 'Send inn'}
        </button>
      </div>
    </form>
  );
}

export default function RacePage({ race, comments }) {
  const [showFullDesc, setShowFullDesc] = useState(false);

  const distances = Array.isArray(race.distance)
    ? race.distance
    : race.distance?.split(',') || [];

  const truncated = race.description
    ? truncateAtSentence(race.description, 400)
    : null;

  const needsTruncation = race.description && truncated !== race.description;

  const jsonLd = buildRaceJsonLd(race);

  const isUpcoming = race.date && new Date(race.date) >= new Date();

  return (
    <>
      <Head>
        <title>{race.name} – Langeløp.no</title>
        <meta
          name="description"
          content={
            race.description?.slice(0, 155) ||
            `${race.name} – ${race.location}, ${formatDate(race.date)}`
          }
        />
        <meta property="og:title" content={race.name} />
        <meta
          property="og:description"
          content={
            race.description?.slice(0, 155) ||
            `${race.location} · ${formatDate(race.date)}`
          }
        />
        {race.image_url && <meta property="og:image" content={race.image_url} />}
        <meta property="og:type" content="website" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      {race.strava_route_id && (
        <Script src="https://strava-embeds.com/embed.js" strategy="lazyOnload" />
      )}

      {/* Hero */}
      <div className="relative w-full h-[46vh] md:h-[42vh] overflow-hidden bg-gray-900">
        {race.image_url ? (
          <img
            src={race.image_url}
            alt={race.name}
            className="absolute inset-0 w-full h-full object-cover opacity-50 scale-105 blur-[1px]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-950" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />

        <div className="absolute top-3 left-3 md:top-6 md:left-8 z-20">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition"
          >
            <ArrowLeft size={15} />
            Alle løp
          </Link>
        </div>

        <div className="absolute bottom-8 md:bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-3xl mx-auto">
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

      <main className="bg-gray-100 px-4 pb-12 min-h-screen">
        <div className="max-w-3xl mx-auto space-y-6 -mt-4 md:mt-10 relative z-10">
          {/* Detalj-kort */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              {distances.map((d, i) => (
                <span
                  key={i}
                  className="bg-blue-50 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full"
                >
                  {String(d).trim().replace(/[[\]"']/g, '')}
                </span>
              ))}
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2.5 text-gray-700">
                <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400 font-medium">
                    Sted
                  </dt>
                  <dd className="font-medium">{race.location || 'Ikke oppgitt'}</dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-gray-700">
                <Flag size={16} className="mt-0.5 shrink-0 text-gray-400" />
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400 font-medium">
                    Fylke
                  </dt>
                  <dd className="font-medium">{race.region || 'Ikke oppgitt'}</dd>
                </div>
              </div>

              {race.elevation_m && (
                <div className="flex items-start gap-2.5 text-gray-700">
                  <Mountain size={16} className="mt-0.5 shrink-0 text-gray-400" />
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-400 font-medium">
                      Høydemeter
                    </dt>
                    <dd className="font-medium">{race.elevation_m} m</dd>
                  </div>
                </div>
              )}

              {race.url && (
                <div className="flex items-start gap-2.5 text-gray-700">
                  <Globe size={16} className="mt-0.5 shrink-0 text-gray-400" />
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-400 font-medium">
                      Nettside
                    </dt>
                    <dd>
                      <a
                        href={race.url.startsWith('http') ? race.url : `https://${race.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-medium break-all"
                      >
                        {race.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {/* Løypekart */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
              Løypekart
            </h2>

            {race.strava_route_id ? (
              <div
                className="strava-embed-placeholder"
                data-embed-type="route"
                data-embed-id={race.strava_route_id}
                data-style="standard"
                data-from-embed="true"
              />
            ) : (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-sm font-medium text-gray-700">
                  Løypekart er ikke lagt inn ennå.
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Har du Strava-, GPX- eller løypelenke? Send den gjerne til oss.
                </p>
              </div>
            )}
          </div>

          {/* Beskrivelse */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Om løpet
            </h2>

            {race.description ? (
              <>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {showFullDesc ? race.description : truncated || race.description}
                </p>

                {needsTruncation && (
                  <button
                    onClick={() => setShowFullDesc((p) => !p)}
                    className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showFullDesc ? (
                      <>
                        <ChevronUp size={15} /> Vis mindre
                      </>
                    ) : (
                      <>
                        <ChevronDown size={15} /> Les mer
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-sm font-medium text-gray-700">
                  Vi mangler fortsatt litt informasjon om dette løpet.
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Har du løpt det, eller kjenner du arrangøren? Tips oss gjerne.
                </p>
              </div>
            )}
          </div>

          {/* Kommentarseksjon */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Erfaringer fra løpere
              </h2>
              <p className="text-xs text-gray-400">
                Har du løpt dette løpet? Del tips og erfaringer med andre.
              </p>
            </div>

            {comments.length === 0 ? (
              <p className="text-gray-400 text-sm">
                Ingen erfaringer delt enda – bli den første!
              </p>
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
              <h3 className="text-sm font-semibold text-gray-800 mb-4">
                Del din erfaring
              </h3>
              <CommentForm raceId={race.id} />
            </div>
          </div>

          {/* Arrangør-oppfordring */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">
                👋 Arrangerer du dette løpet?
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                Ta kontakt så hjelper vi deg å oppdatere informasjonen.
              </p>
            </div>

            <a
              href="mailto:post@langelop.no"
              className="shrink-0 inline-block px-4 py-2 bg-white border border-blue-200 text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-100 transition"
            >
              Ta kontakt
            </a>
          </div>
        </div>
      </main>
    </>
  );
}