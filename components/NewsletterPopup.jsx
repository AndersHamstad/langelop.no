// components/NewsletterPopup.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) {
      const dismissed = localStorage.getItem('newsletterPopupDismissed') === 'true';
      if (dismissed) {
        setHasDismissed(true);
        setSubscribed(true);
      }
    }
  }, []);

  useEffect(() => {
    let timer = null;
    function onScroll() {
      if (subscribed || hasDismissed) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (scrolled / total > 0.6) {
        timer = setTimeout(() => setVisible(true), 1000);
        window.removeEventListener('scroll', onScroll);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, [subscribed, hasDismissed]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: sbError } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email, created_at: new Date().toISOString() }]);

    setLoading(false);

    if (sbError) {
      if (sbError.code === '23505') {
        setError('Denne e-posten er allerede registrert.');
      } else {
        setError('Noe gikk galt. Prøv igjen.');
      }
    } else {
      localStorage.setItem('newsletterPopupDismissed', 'true');
      setDone(true);
      setTimeout(() => {
        setSubscribed(true);
        setVisible(false);
      }, 2500);
    }
  };

  const handleClose = () => {
    localStorage.setItem('newsletterPopupDismissed', 'true');
    setHasDismissed(true);
    setVisible(false);
  };

  if (!visible || subscribed) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

        {done ? (
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-3">🏔️</div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Velkommen!</h2>
            <p className="text-sm text-gray-500">Du hører fra oss snart.</p>
          </div>
        ) : (
          <div className="px-6 pt-7 pb-6">
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 text-xl leading-none"
              aria-label="Lukk"
            >
              ×
            </button>

            {/* Heading */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 leading-snug">
                Påfyll av inspirasjon?
              </h2>
              <p className="text-sm text-gray-500 mt-1.5">
                Meld deg på det månedlige nyhetsbrevet for å få:
              </p>
            </div>

            {/* What you get */}
            <ul className="space-y-1.5 mb-5">
              {[
                '🏔️ Erfaringer og historier fra ultraløpere',
                '📝 Race reviews - ærlige og personlige',
                '🎒 Utstyrsguider og pakkelister',
                '📅 Løp du bør ha på radaren',
                '🎁 Tidlig tilgang til nye produkter',
              ].map((item) => (
                <li key={item} className="text-xs text-gray-600 flex items-start gap-2">
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-gray-400 -mt-2 mb-4">— rett i innboksen ☕️</p>

            {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <input
                type="email"
                placeholder="din@epost.no"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl text-sm transition disabled:opacity-60"
              >
                {loading ? 'Melder på...' : 'Ja, jeg vil være med →'}
              </button>
            </form>

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs font-semibold text-gray-700">
                +150 løpere er allerede med
              </p>
              <button
                onClick={handleClose}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Ikke nå
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
