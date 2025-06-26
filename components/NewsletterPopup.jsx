// components/NewsletterPopup.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Sjekk om bruker tidligere har lukket eller abonnert
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) {
      // Sjekk om bruker tidligere har lukket eller abonnert
      const dismissed = localStorage.getItem('newsletterPopupDismissed') === 'true';
      if (dismissed) {
        setHasDismissed(true);
        setSubscribed(true);
      }
    }
  }, []);

  // Vis popup når bruker har scrollet >300px, om ikke allerede abonnert eller avvist
  useEffect(() => {
    function onScroll() {
      if (window.scrollY > 300 && !subscribed && !hasDismissed) {
        setVisible(true);
        window.removeEventListener('scroll', onScroll);
      }
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [subscribed, hasDismissed]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!email) {
      setErrorMessage('Vennligst skriv inn en e-postadresse.');
      return;
    }

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email, created_at: new Date().toISOString() }]);

    if (error) {
      console.error('Supabase error:', error);
      setErrorMessage('Noe gikk galt ved påmelding. Prøv igjen.');
    } else {
      localStorage.setItem('newsletterPopupDismissed', 'true');
      setSuccessMessage('Takk for påmeldingen!');
      setSubscribed(true);
      setVisible(false);
    }
  };

  const handleClose = () => {
    localStorage.setItem('newsletterPopupDismissed', 'true');
    setHasDismissed(true);
    setVisible(false);
  };

  if (!visible || subscribed) return null;

  return (
    
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 relative">

        {/* Banner-bilde øverst */}
       <img
        src="/newsletter-hero.jpg"
        alt="Inspirasjon"
        className="w-full h-40 object-cover rounded-t-lg mb-4"
        style={{ objectPosition: 'center 25%' }}
       />

        {/* Lukkeknapp */}
        <button
          aria-label="Lukk"
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-2">Påfyll av inspirasjon?</h2>
        <p className="text-sm mb-4">
          Meld deg på nyhetsbrevet og få tips, erfaringer og kommende løp – rett i innboksen.
        </p>

        {errorMessage && <p className="text-red-600 mb-2 text-sm">{errorMessage}</p>}
        {successMessage && <p className="text-green-600 mb-2 text-sm">{successMessage}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Din e-postadresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Ikke idag...
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Jeg er med!
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
