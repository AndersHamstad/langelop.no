// pages/[slug].js
import { supabase } from '../lib/supabaseClient';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import Footer from '../components/Footer';

export async function getServerSideProps({ params }) {
  const { data: race, error } = await supabase
    .from('races')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!race) return { notFound: true };

  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('race_id', race.id)
    .order('created_at', { ascending: false });

  return { props: { race, comments: comments || [] } };
}

export default function RacePage({ race, comments }) {
  // Kommentar / innsendings‐state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [submittedComments, setSubmittedComments] = useState(comments);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Read more‐state for beskrivelsen
  const [showFullDesc, setShowFullDesc] = useState(false);
  const MAX_DESC_CHARS = 200;

  // Formaterings‐hjelper
  const formatDate = (date) => {
    try {
      return format(new Date(date), "d. MMMM yyyy", { locale: nb });
    } catch {
      return date;
    }
  };

  // Last Strava‐script om nødvendig
  useEffect(() => {
    if (race.strava_route_id) {
      const script = document.createElement('script');
      script.src = 'https://strava-embeds.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [race.strava_route_id]);

  // Innsending av kommentar
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!name || !email || !comment) {
      setErrorMessage('Vennligst fyll ut alle felt.');
      return;
    }

    const { data, error } = await supabase
      .from('comments')
      .insert([{ race_id: race.id, name, email, comment, created_at: new Date().toISOString() }])
      .select();

    if (error) {
      if (error.code === '23505') {
        setErrorMessage('Denne e-posten har allerede kommentert på dette løpet.');
      } else {
        console.error('Supabase insert error:', error);
        setErrorMessage('Noe gikk galt. Prøv igjen.');
      }
    } else {
      setSuccessMessage('Takk! Kommentaren er sendt inn.');
      if (data && data.length > 0) {
        setSubmittedComments([data[0], ...submittedComments]);
      }
      setName('');
      setEmail('');
      setComment('');
    }
  };

  return (
    <>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-3 py-4 flex justify-between items-center">
          <a href="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="langeløp.no logo" className="h-10 w-15" />
          </a>
        </div>
      </header>

      <main className="bg-gray-100 py-10 px-4 min-h-screen">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">{race.name}</h1>
          <p className="text-gray-600">{formatDate(race.date)}</p>

          {race.image_url && (
            <img
              src={race.image_url}
              alt={race.name}
              className="w-full h-60 object-cover rounded-lg shadow border border-gray-400"
            />
          )}

          <div className="space-y-2 text-sm text-gray-800">
            {/* Løpsdetaljer */}
            <p><strong>📍 Sted:</strong> {race.location}</p>
            <p><strong>📌 Fylke:</strong> {race.region}</p>
            <p className="flex flex-wrap gap-2">
              <strong>🏃 Distanser:</strong>{' '}
              {(Array.isArray(race.distance) ? race.distance : race.distance?.split(",") || []).map((d,i)=>(
                <span key={i} className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                  {d.trim().replace(/[[\]"']/g, '')}
                </span>
              ))}
            </p>
            <p><strong>⛰️ Høydemeter:</strong> {race.elevation_m || 'Ukjent'}</p>
            {race.url && (
              <p>
                <strong>🌐 Nettside:</strong>{' '}
                <a href={race.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                  {race.url}
                </a>
              </p>
            )}
          </div>

          {/* Strava-embed hvis tilgjengelig */}
          {race.strava_route_id && (
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-2">Løypekart (Strava)</h3>
              <div
                className="strava-embed-placeholder"
                data-embed-type="route"
                data-embed-id={race.strava_route_id}
                data-style="standard"
                data-from-embed="true"
              />
            </div>
          )}

          {/* Om løpet med Read More-/Read Less */}
          {race.description && (
            <div className="pt-1">
              <h3 className="text-md font-semibold text-gray-900 mb-1">Om løpet</h3>
              <p className="text-sm text-gray-800 whitespace-pre-line">
                {showFullDesc
                  ? race.description
                  : race.description.length > MAX_DESC_CHARS
                    ? `${race.description.slice(0, MAX_DESC_CHARS)}…`
                    : race.description
                }
              </p>
              {race.description.length > MAX_DESC_CHARS && (
                <button
                  onClick={() => setShowFullDesc(prev=>!prev)}
                  className="mt-2 text-blue-600 underline text-sm"
                >
                  {showFullDesc ? 'Vis mindre' : 'Vis mer'}
                </button>
              )}
            </div>
          )}

          {/* Kommentarseksjon */}
          <div className="pt-1 border-t space-y-4"></div>
          <div className="mt-2">
            <h3 className="text-md font-semibold mb-3">Erfaringer fra andre løpere</h3>
            {submittedComments.length === 0 ? (
              <p className="text-gray-500 text-sm">Ingen har skrevet her enda. Bli den første til å dele erfaring!</p>
            ) : (
              <ul className="space-y-4 text-sm">
                {submittedComments.map((c,i)=>(
                  <li key={i} className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-semibold text-gray-800">{c.name}</p>
                    <p className="text-gray-700">{c.comment}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(c.created_at, "d. MMMM yyyy", { locale: nb })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Innsendingsskjema */}
          <div className="pt-6 border-t space-y-4">
            <h2 className="text-md font-semibold">Del din erfaring</h2>
            <p className="italic text-xs text-gray-600">Her kan du dele dine tips, erfaringer eller anbefalinger for andre løpere som vurderer å delta.</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Fornavn" value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-2 border rounded text-sm" required />
              <input type="email" placeholder="E-post" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-2 border rounded text-sm" required />
              <textarea placeholder="Kommentar..." value={comment} onChange={e=>setComment(e.target.value)} className="w-full px-4 py-2 border rounded text-sm" rows={4} required />
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Send inn</button>
              {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}
              {errorMessage && <p className="text-red-600 text-sm">{errorMessage}</p>}
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
