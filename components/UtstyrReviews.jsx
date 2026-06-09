// components/UtstyrReviews.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

function Stars({ value, onClick, interactive = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type={interactive ? 'button' : undefined}
          onClick={interactive ? () => onClick(n) : undefined}
          onMouseEnter={interactive ? () => setHovered(n) : undefined}
          onMouseLeave={interactive ? () => setHovered(0) : undefined}
          className={`text-xl leading-none transition ${
            interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          } ${n <= (hovered || value) ? 'text-amber-400' : 'text-gray-200'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className="w-4 text-right">{label}</span>
      <span className="text-amber-400 text-sm">★</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-right text-gray-400">{count}</span>
    </div>
  );
}

export default function UtstyrReviews({ produktId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    navn: '', email: '', stjerner: 0, kommentar: '',
  });

  useEffect(() => {
    async function fetchReviews() {
      const { data } = await supabase
        .from('utstyr_reviews')
        .select('id, navn, stjerner, kommentar, created_at')
        .eq('produkt_id', produktId)
        .eq('approved', true)
        .order('created_at', { ascending: false });
      setReviews(data || []);
      setLoading(false);
    }
    fetchReviews();
  }, [produktId]);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.stjerner, 0) / reviews.length).toFixed(1)
    : null;

  const distribution = [5, 4, 3, 2, 1].map((n) => ({
    label: n,
    count: reviews.filter((r) => r.stjerner === n).length,
  }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.stjerner === 0) return setError('Velg et antall stjerner.');
    setSubmitting(true);

    const res = await fetch('/api/utstyr-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produkt_id: produktId, ...form }),
    });

    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) return setError(json.error);
    setSubmitted(true);
    setShowForm(false);
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-5">

      {/* Aggregate rating */}
      {!loading && reviews.length > 0 && (
        <div className="flex gap-6 mb-5">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 leading-none">{avgRating}</div>
            <Stars value={Math.round(parseFloat(avgRating))} />
            <div className="text-xs text-gray-400 mt-1">{reviews.length} {reviews.length === 1 ? 'anmeldelse' : 'anmeldelser'}</div>
          </div>
          <div className="flex-1 space-y-1 py-1">
            {distribution.map((d) => (
              <RatingBar key={d.label} label={d.label} count={d.count} total={reviews.length} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews list */}
      {!loading && reviews.length > 0 && (
        <div className="space-y-4 mb-5">
          {reviews.map((r) => (
            <div key={r.id} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-gray-800">{r.navn}</span>
                <Stars value={r.stjerner} />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{r.kommentar}</p>
              <p className="text-[11px] text-gray-400 mt-2">
                {new Date(r.created_at).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <p className="text-sm text-gray-400 mb-4">Ingen anmeldelser enda. Vær den første!</p>
      )}

      {/* Skriv anmeldelse */}
      {submitted ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          ✓ Takk! Anmeldelsen din er sendt til godkjenning.
        </div>
      ) : !showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          + Skriv en anmeldelse
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-bold text-gray-900">Skriv en anmeldelse</h4>

          {/* Stjerner */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Din vurdering</label>
            <Stars
              value={form.stjerner}
              onClick={(n) => setForm((f) => ({ ...f, stjerner: n }))}
              interactive
            />
          </div>

          {/* Navn */}
          <input
            type="text"
            placeholder="Navn"
            value={form.navn}
            onChange={(e) => setForm((f) => ({ ...f, navn: e.target.value }))}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* E-post */}
          <input
            type="email"
            placeholder="E-post (vises ikke)"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Kommentar */}
          <textarea
            placeholder="Del erfaringen din med produktet..."
            value={form.kommentar}
            onChange={(e) => setForm((f) => ({ ...f, kommentar: e.target.value }))}
            required
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-60"
            >
              {submitting ? 'Sender...' : 'Send anmeldelse'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Avbryt
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
