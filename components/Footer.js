import { useState } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    const res = await fetch('/api/newsletter-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus(json.error || 'Noe gikk galt. Prøv igjen.');
    } else {
      setStatus('Takk! Du er nå på listen.');
      setEmail('');
    }
  };

  return (
    <footer className="bg-gradient-to-r from-[#0f1c2e] to-[#1b2a41] text-gray-200 px-6 py-14">
      <div className="max-w-7xl mx-auto grid gap-10 md:grid-cols-3">

        {/* Om oss */}
        <div>
          <div className="flex items-center space-x-3 mb-3">
            <img src="/logo2.png" alt="Langeløp logo" className="h-8 w-auto" />
            <span className="text-xl font-bold text-white">langelop.no</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Norges dedikerte side for ultraløp. Vi samler alle løp på ett sted — enkelt å finne, enkelt å melde seg på.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            <a href="mailto:post@langelop.no" className="hover:text-white transition">post@langelop.no</a>
            {' · '}
            <a href="tel:95007434" className="hover:text-white transition">95 00 74 34</a>
          </p>
        </div>

        {/* For arrangører */}
        <div>
          <h3 className="text-base font-bold text-white mb-1">For arrangører</h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            Mangler løpet ditt på listen? Meld det inn gratis — vi legger det til innen kort tid.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/for-arrangorer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 text-sm font-medium px-4 py-2.5 rounded-xl transition w-fit border border-white/10"
            >
              Meld inn et løp →
            </Link>
            <Link
              href="/for-arrangorer#oppdater"
              className="text-sm text-gray-400 hover:text-white transition pl-1"
            >
              Oppdater eksisterende løp →
            </Link>
          </div>
        </div>

        {/* Nyhetsbrev */}
        <div>
          <h3 className="text-base font-bold text-white mb-1">📩 Nyhetsbrev</h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            Inspirasjon, tips og erfaringer fra norske ultraløpere — rett i innboksen én gang i måneden.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              type="email"
              placeholder="Din e-post"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-white text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-100 transition"
            >
              Meld meg på
            </button>
          </form>
          {status && <p className="text-sm mt-2 text-gray-400">{status}</p>}
        </div>

      </div>

      <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
        <span>© {new Date().getFullYear()} langelop.no</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-gray-400 transition">Personvern</a>
          <a href="#" className="hover:text-gray-400 transition">Om oss</a>
        </div>
      </div>
    </footer>
  );
}
