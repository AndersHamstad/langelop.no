import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email }]);

    if (error) {
      if (error.code === '23505') {
        setStatus('Denne e-posten er allerede registrert.');
      } else {
        setStatus('Noe gikk galt. Prøv igjen.');
      }
    } else {
      setStatus('Takk for at du meldte deg på!');
      setEmail('');
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-200 mt-16 px-6 py-12">
      <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-3">
        {/* Om oss / logo */}
        <div>
  <div className="flex items-center space-x-3 mb-2">
    <img src="/logo2.png" alt="Langeløp logo" className="h-8 w-auto" />
    <h2 className="text-xl font-bold text-white">langelop.no</h2>
  </div>
  <p className="text-sm text-gray-400">
    For deg som elsker å løpe langt i norsk natur. Vi samler informasjonen du trenger om alle ultraløp i Norge – på ett og samme sted.
          </p>
          <p className="text-sm text-gray-400 mt-3">
            Har du spørsmål eller forslag? Kontakt oss på{' '}
            <a href="mailto:post@langelop.no" className="text-blue-400 hover:underline">
              post@langelop.no
            </a>{' '}
            eller 95 00 74 34.
          </p>
        </div>

        {/* Lenker */}
        <div className="md:ml-20 md:text-left">
          <h3 className="text-lg font-semibold text-white mb-2">Undersider</h3>
          <ul className="space-y-1 text-sm">
            <li><a href="#" className="hover:underline text-gray-300">Om oss</a></li>
            <li><a href="#" className="hover:underline text-gray-300">For løpsarrangører</a></li>
            <li><a href="#" className="hover:underline text-gray-300">Release Notes</a></li>
            <li><a href="#" className="hover:underline text-gray-300">Privacy Policy</a></li>
          </ul>
        </div>

        {/* Nyhetsbrev */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">📩 Meld deg på nyhetsbrev</h3>
          <p className="text-sm text-gray-400 mb-3">Inspirasjon, tips og erfaringer fra andre løpere - rett i innboksen.</p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="email"
              placeholder="Din e-post"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 rounded bg-white text-gray-900 text-sm w-full sm:w-auto flex-1"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
            >
              Abonner
            </button>
          </form>
          {status && <p className="text-sm mt-2 text-gray-300">{status}</p>}
        </div>
      </div>

      <div className="mt-10 text-xs text-center text-gray-500">
        © {new Date().getFullYear()} langelop.no. Alle rettigheter reservert.
      </div>
    </footer>
  );
}