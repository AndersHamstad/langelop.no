// pages/for-arrangorer.js
import Head from 'next/head';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { FilePlus2, RefreshCcw, Star, Footprints, ArrowRight, CheckCircle2 } from 'lucide-react';

const REGIONER = [
  'Oslo', 'Viken', 'Innlandet', 'Vestfold og Telemark', 'Agder',
  'Rogaland', 'Vestland', 'Møre og Romsdal', 'Trøndelag',
  'Nordland', 'Troms og Finnmark',
];

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

function ActionCard({ icon: Icon, title, text, onClick, isOpen, href }) {
  const inner = (
    <>
      <Icon size={24} strokeWidth={1.75} className="text-amber-600 mb-5" />
      <h3 className="text-base font-bold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
      <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 mt-5">
        {href ? 'Se tilbudet' : isOpen ? 'Lukk' : 'Åpne skjema'}
        <ArrowRight size={14} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="text-left bg-white rounded-2xl shadow-sm p-7 md:p-8 hover:shadow-md transition block"
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`text-left bg-white rounded-2xl shadow-sm p-7 md:p-8 transition ${
        isOpen ? 'ring-2 ring-amber-300 shadow-md' : 'hover:shadow-md'
      }`}
    >
      {inner}
    </button>
  );
}

export default function ForArrangorerPage() {
  const [open, setOpen] = useState(null); // 'new' | 'update' | 'highlight' | null
  const panelRef = useRef(null);

  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [open]);

  // Footer-lenken peker på /for-arrangorer#oppdater — åpne riktig panel automatisk
  useEffect(() => {
    if (window.location.hash === '#oppdater') setOpen('update');
  }, []);

  function toggle(key) {
    setOpen((prev) => (prev === key ? null : key));
  }

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
      <div className="bg-[#0b1626] text-white py-20 md:py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-4">
            For arrangører
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-5 leading-tight">
            Nå løperne som leter etter akkurat ditt løp
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-xl leading-relaxed">
            Det er gratis å liste løpet ditt. Velg hva du trenger hjelp med under.
          </p>
        </div>
      </div>

      {/* Actionables */}
      <div className="bg-white py-20 md:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ActionCard
              icon={FilePlus2}
              title="Meld inn nytt løp"
              text="Finner du ikke løpet ditt på siden? Legg det til her."
              onClick={() => toggle('new')}
              isOpen={open === 'new'}
            />
            <ActionCard
              icon={RefreshCcw}
              title="Meld endringer"
              text="Feil eller utdatert info på et løp som allerede er listet?"
              onClick={() => toggle('update')}
              isOpen={open === 'update'}
            />
            <ActionCard
              icon={Star}
              title="Fremhev ditt løp"
              text="Vises øverst på forsiden med stort bilde og direkte lenke."
              onClick={() => toggle('highlight')}
              isOpen={open === 'highlight'}
            />
            <ActionCard
              icon={Footprints}
              title="Tilpassede sokker"
              text="Design, innkjøp og levering av sokker med løpets eget logo."
              href="/sokker-til-arrangorer"
            />
          </div>

          {open && (
            <div ref={panelRef} className="mt-12 max-w-2xl mx-auto scroll-mt-6">

              {open === 'new' && (
                <div className="bg-white rounded-2xl shadow-md ring-1 ring-gray-100 p-7 md:p-9">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Meld inn et løp</h2>
                  <p className="text-sm text-gray-500 mb-6">Finner du ikke løpet ditt på siden? Meld det inn her, så legger vi det til.</p>
                  {nyStatus === 'success' ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle2 size={18} className="shrink-0" /> Takk! Vi har mottatt innmeldingen og legger løpet inn innen kort tid.
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
                </div>
              )}

              {open === 'update' && (
                <div className="bg-white rounded-2xl shadow-md ring-1 ring-gray-100 p-7 md:p-9">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Meld endringer</h2>
                  <p className="text-sm text-gray-500 mb-6">Er det noe feil eller utdatert på et eksisterende løp? Gi oss beskjed.</p>
                  {oppdStatus === 'success' ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle2 size={18} className="shrink-0" /> Takk! Vi oppdaterer informasjonen så raskt vi kan.
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
                </div>
              )}

              {open === 'highlight' && (
                <div className="bg-amber-50 rounded-2xl p-7 md:p-9 text-center">
                  <Star size={28} strokeWidth={1.75} className="text-amber-600 mx-auto mb-5" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Vil du fremheve løpet ditt?</h2>
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed max-w-md mx-auto">
                    Fremhevede løp vises øverst på forsiden med stort bilde og direkte lenke til påmelding — synlig for alle som besøker langelop.no.
                  </p>
                  <a href="mailto:post@langelop.no?subject=Fremhevet løp"
                    className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition">
                    Ta kontakt om fremheving <ArrowRight size={16} />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
