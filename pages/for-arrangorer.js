// pages/for-arrangorer.js
import Head from 'next/head';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const REGIONER = [
  'Oslo', 'Viken', 'Innlandet', 'Vestfold og Telemark', 'Agder',
  'Rogaland', 'Vestland', 'Møre og Romsdal', 'Trøndelag',
  'Nordland', 'Troms og Finnmark',
];

const FORDELER = [
  { emoji: '🔍', tittel: 'Synlighet i søk', tekst: 'Løpssidene våre ranker i Google på løpsnavn. Løpere som søker finner deg.' },
  { emoji: '📅', tekst: 'Løpet vises i kalender, kart og filtrerbar oversikt – enkelt å finne for riktig målgruppe.', tittel: 'Kalender og kart' },
  { emoji: '💬', tekst: 'Løpere kan legge igjen erfaringer og anmeldelser, som gir nye deltakere trygghet.', tittel: 'Løperanmeldelser' },
  { emoji: '📬', tekst: 'Løpet kan fremheves i vårt månedlige nyhetsbrev til et voksende fellesskap av norske ultraløpere.', tittel: 'Nyhetsbrev' },
];

function FormSection({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
      <p className="text-sm text-gray-500 mb-6">{subtitle}</p>
      {children}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition";

export default function ForArrangorerPage() {
  // Nytt løp
  const [nyForm, setNyForm] = useState({
    navn: '', dato: '', distanse: '', sted: '', region: '',
    nettside: '', kontakt_navn: '', kontakt_epost: '', beskrivelse: '',
  });
  const [nyStatus, setNyStatus] = useState(null);
  const [nySender, setNySender] = useState(false);

  // Oppdatering
  const [oppdForm, setOppdForm] = useState({ lop_navn: '', endring: '', kontakt_epost: '' });
  const [oppdStatus, setOppdStatus] = useState(null);
  const [oppdSender, setOppdSender] = useState(false);

  async function sendNytt(e) {
    e.preventDefault();
    setNySender(true);
    setNyStatus(null);
    const res = await fetch('/api/race-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'new', ...nyForm }),
    });
    const json = await res.json();
    setNySender(false);
    if (res.ok) {
      setNyStatus('success');
      setNyForm({ navn: '', dato: '', distanse: '', sted: '', region: '', nettside: '', kontakt_navn: '', kontakt_epost: '', beskrivelse: '' });
    } else {
      setNyStatus(json.error || 'Noe gikk galt.');
    }
  }

  async function sendOppdatering(e) {
    e.preventDefault();
    setOppdSender(true);
    setOppdStatus(null);
    const res = await fetch('/api/race-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'update', ...oppdForm }),
    });
    const json = await res.json();
    setOppdSender(false);
    if (res.ok) {
      setOppdStatus('success');
      setOppdForm({ lop_navn: '', endring: '', kontakt_epost: '' });
    } else {
      setOppdStatus(json.error || 'Noe gikk galt.');
    }
  }

  return (
    <>
      <Head>
        <title>For arrangører | Langeløp.no</title>
        <meta name="description" content="Meld inn ditt ultraløp på langelop.no – gratis synlighet, løperanmeldelser og plass i kalenderen." />
      </Head>

      {/* Hero */}
      <div className="bg-gray-900 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            For arrangører
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
            Nå løperne som leter etter akkurat ditt løp
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-xl leading-relaxed">
            Langeløp.no er Norges dedikerte side for ultraløp. Vi hjelper løpere å finne riktig løp — og arrangører å nå riktig målgruppe. Det er gratis å liste løpet ditt.
          </p>
        </div>
      </div>

      {/* Fordeler */}
      <div className="bg-gray-50 py-12 px-4 border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FORDELER.map((f) => (
              <div key={f.tittel} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-3xl mb-3">{f.emoji}</div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{f.tittel}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.tekst}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skjemaer */}
      <div className="bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-8">

          {/* Meld inn nytt løp */}
          <FormSection
            title="Meld inn et løp"
            subtitle="Finner du ikke løpet ditt på siden? Meld det inn her, så legger vi det til."
          >
            {nyStatus === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-700">
                ✓ Takk! Vi har mottatt innmeldingen og legger løpet inn innen kort tid.
              </div>
            ) : (
              <form onSubmit={sendNytt} className="space-y-4">
                <Field label="Løpets navn" required>
                  <input className={inputCls} value={nyForm.navn}
                    onChange={(e) => setNyForm(f => ({ ...f, navn: e.target.value }))} required />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Dato" required>
                    <input type="date" className={inputCls} value={nyForm.dato}
                      onChange={(e) => setNyForm(f => ({ ...f, dato: e.target.value }))} required />
                  </Field>
                  <Field label="Distanse(r)" required>
                    <input className={inputCls} placeholder="f.eks. 50 km, 100 km"
                      value={nyForm.distanse}
                      onChange={(e) => setNyForm(f => ({ ...f, distanse: e.target.value }))} required />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Sted/kommune" required>
                    <input className={inputCls} value={nyForm.sted}
                      onChange={(e) => setNyForm(f => ({ ...f, sted: e.target.value }))} required />
                  </Field>
                  <Field label="Fylke/region" required>
                    <select className={inputCls} value={nyForm.region}
                      onChange={(e) => setNyForm(f => ({ ...f, region: e.target.value }))} required>
                      <option value="">Velg fylke</option>
                      {REGIONER.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Nettside / påmeldingslenke">
                  <input type="url" className={inputCls} placeholder="https://"
                    value={nyForm.nettside}
                    onChange={(e) => setNyForm(f => ({ ...f, nettside: e.target.value }))} />
                </Field>

                <Field label="Kort beskrivelse">
                  <textarea className={inputCls} rows={3} placeholder="Løypebeskrivelse, høydemeter, atmosfære..."
                    value={nyForm.beskrivelse}
                    onChange={(e) => setNyForm(f => ({ ...f, beskrivelse: e.target.value }))} />
                </Field>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400 mb-3">Kontaktinformasjon (vises ikke offentlig)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Ditt navn" required>
                      <input className={inputCls} value={nyForm.kontakt_navn}
                        onChange={(e) => setNyForm(f => ({ ...f, kontakt_navn: e.target.value }))} required />
                    </Field>
                    <Field label="E-post" required>
                      <input type="email" className={inputCls} value={nyForm.kontakt_epost}
                        onChange={(e) => setNyForm(f => ({ ...f, kontakt_epost: e.target.value }))} required />
                    </Field>
                  </div>
                </div>

                {typeof nyStatus === 'string' && nyStatus !== 'success' && (
                  <p className="text-red-500 text-sm">{nyStatus}</p>
                )}

                <button type="submit" disabled={nySender}
                  className="w-full bg-gray-900 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl text-sm transition disabled:opacity-60">
                  {nySender ? 'Sender...' : 'Meld inn løp →'}
                </button>
              </form>
            )}
          </FormSection>

          {/* Foreslå oppdatering */}
          <FormSection
            title="Oppdater informasjon"
            subtitle="Er det noe feil eller utdatert på et eksisterende løp? Gi oss beskjed."
          >
            {oppdStatus === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-700">
                ✓ Takk! Vi oppdaterer informasjonen så raskt vi kan.
              </div>
            ) : (
              <form onSubmit={sendOppdatering} className="space-y-4">
                <Field label="Løpets navn" required>
                  <input className={inputCls} placeholder="Hvilke løp gjelder det?"
                    value={oppdForm.lop_navn}
                    onChange={(e) => setOppdForm(f => ({ ...f, lop_navn: e.target.value }))} required />
                </Field>

                <Field label="Hva skal endres?" required>
                  <textarea className={inputCls} rows={4}
                    placeholder="Beskriv hva som er feil eller mangler – ny dato, distanse, beskrivelse, bilde, lenke..."
                    value={oppdForm.endring}
                    onChange={(e) => setOppdForm(f => ({ ...f, endring: e.target.value }))} required />
                </Field>

                <Field label="Din e-post" required>
                  <input type="email" className={inputCls} placeholder="Vi kontakter deg ved behov"
                    value={oppdForm.kontakt_epost}
                    onChange={(e) => setOppdForm(f => ({ ...f, kontakt_epost: e.target.value }))} required />
                </Field>

                {typeof oppdStatus === 'string' && oppdStatus !== 'success' && (
                  <p className="text-red-500 text-sm">{oppdStatus}</p>
                )}

                <button type="submit" disabled={oppdSender}
                  className="w-full bg-gray-900 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl text-sm transition disabled:opacity-60">
                  {oppdSender ? 'Sender...' : 'Send oppdatering →'}
                </button>
              </form>
            )}
          </FormSection>

          {/* Fremhev løpet */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <div className="text-2xl mb-2">★</div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Vil du fremheve løpet ditt?</h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Fremhevede løp vises øverst på forsiden med stort bilde og direkte lenke til påmelding — synlig for alle som besøker langelop.no.
            </p>
            <a href="mailto:post@langelop.no?subject=Fremhevet løp"
              className="inline-block bg-amber-400 hover:bg-amber-500 text-amber-900 font-semibold px-5 py-2.5 rounded-xl text-sm transition">
              Ta kontakt om fremheving →
            </a>
          </div>

        </div>
      </div>
    </>
  );
}
