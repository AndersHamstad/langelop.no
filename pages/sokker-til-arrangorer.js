// pages/sokker-til-arrangorer.js
import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';

const STEG = [
  { emoji: '✍️', tittel: 'Fortell oss om løpet', tekst: 'Fyll ut skjemaet med løpsnavn, dato og omtrent hvor mange deltakere dere forventer.' },
  { emoji: '🎨', tittel: 'Vi designer et forslag', tekst: 'Vi foreslår et sokkedesign med løpets logo og farger — helt uforpliktende.' },
  { emoji: '✅', tittel: 'Dere godkjenner', tekst: 'Ingenting produseres før dere har sagt ja til design, antall og pris.' },
  { emoji: '📦', tittel: 'Levering i tide', tekst: 'Vi produserer og leverer sokkene klare til utdeling på løpsdagen.' },
];

const FORDELER = [
  { emoji: '🧦', tittel: 'Brukes igjen og igjen', tekst: 'I motsetning til en t-skjorte i skuffen, er sokker noe deltakerne faktisk tar i bruk — gang på gang.' },
  { emoji: '🏔️', tittel: 'Løpets merkevare på beina', tekst: 'Hver treningsøkt deltakerne bruker sokkene, blir løpets navn og logo synlig igjen.' },
  { emoji: '📏', tittel: 'Tilpasset deres løp', tekst: 'Antall og pris skaleres etter deltakerantall — fra mindre lokale løp til store arrangementer.' },
];

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition";

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

export default function SokkerTilArrangorer() {
  const [form, setForm] = useState({
    race_name: '', contact_name: '', contact_email: '', contact_phone: '',
    estimated_quantity: '', race_date: '', message: '',
  });
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    const res = await fetch('/api/sock-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json().catch(() => ({}));
    setSending(false);
    if (res.ok) {
      setStatus('success');
      setForm({ race_name: '', contact_name: '', contact_email: '', contact_phone: '', estimated_quantity: '', race_date: '', message: '' });
    } else {
      setStatus(json.error || 'Noe gikk galt. Prøv igjen.');
    }
  }

  return (
    <>
      <Head>
        <title>Tilpassede løpesokker for arrangører | Langeløp.no</title>
        <meta
          name="description"
          content="Gi deltakerne dine tilpassede løpesokker med løpets eget logo — et goodiebag-produkt som varer lenger enn en t-skjorte. Få et uforpliktende tilbud."
        />
        <link rel="canonical" href="https://www.langelop.no/sokker-til-arrangorer" />
        <meta property="og:title" content="Tilpassede løpesokker for arrangører | Langeløp.no" />
        <meta
          property="og:description"
          content="Gi deltakerne dine tilpassede løpesokker med løpets eget logo — et goodiebag-produkt som varer lenger enn en t-skjorte."
        />
        <meta property="og:type" content="website" />
      </Head>

      {/* Hero */}
      <div className="bg-gray-900 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            For løpsarrangører
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
            Gi deltakerne dine noe de faktisk bruker
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-xl leading-relaxed">
            Tilpassede løpesokker med deres eget løp-logo — et goodiebag-produkt
            som varer lenger enn en t-skjorte.
          </p>
          <a href="#skjema"
            className="inline-block mt-6 bg-white text-gray-900 font-semibold px-6 py-3 rounded-xl text-sm hover:bg-gray-100 transition">
            Få et uforpliktende tilbud →
          </a>
        </div>
      </div>

      {/* Troverdighet */}
      <div className="bg-gray-50 py-12 px-4 border-b border-gray-200">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-[#f1f0ed]">
            <Image src="/shop/Sock-5.png" alt="Langeløp Endurance Crew løpesokk" fill sizes="112px" className="object-cover" />
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Langeløp designer og selger allerede egne løpesokker til norske ultraløpere
            via <a href="/shop" className="text-blue-600 hover:underline">vår egen nettbutikk</a>.
            Vi kjenner både produktet og løpermiljøet — og bygger videre på det samme
            når vi lager tilpassede sokker for arrangører.
          </p>
        </div>
      </div>

      {/* Slik fungerer det */}
      <div className="bg-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-8 text-center">Slik fungerer det</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEG.map((s, i) => (
              <div key={s.tittel} className="bg-gray-50 rounded-2xl border border-gray-200 p-5 relative">
                <div className="text-xs font-bold text-gray-300 mb-2">{i + 1}</div>
                <div className="text-3xl mb-3">{s.emoji}</div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{s.tittel}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.tekst}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fordeler */}
      <div className="bg-gray-50 py-14 px-4 border-y border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-8 text-center">Hvorfor sokker</h2>
          <div className="grid gap-5 sm:grid-cols-3">
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

      {/* Skjema */}
      <div id="skjema" className="bg-white py-14 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Få et uforpliktende tilbud</h2>
            <p className="text-sm text-gray-500 mb-6">
              Pris avhenger av antall og design — vi sender et konkret tilbud, helt uten forpliktelser.
            </p>

            {status === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-700">
                ✓ Takk! Vi tar kontakt innen kort tid med et forslag.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Løpets navn" required>
                  <input className={inputCls} value={form.race_name}
                    onChange={(e) => setForm((f) => ({ ...f, race_name: e.target.value }))} required />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Løpsdato">
                    <input type="date" className={inputCls} value={form.race_date}
                      onChange={(e) => setForm((f) => ({ ...f, race_date: e.target.value }))} />
                  </Field>
                  <Field label="Antall deltakere (ca.)">
                    <input className={inputCls} placeholder="f.eks. 150"
                      value={form.estimated_quantity}
                      onChange={(e) => setForm((f) => ({ ...f, estimated_quantity: e.target.value }))} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Kontaktperson" required>
                    <input className={inputCls} value={form.contact_name}
                      onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} required />
                  </Field>
                  <Field label="Telefon">
                    <input className={inputCls} value={form.contact_phone}
                      onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))} />
                  </Field>
                </div>

                <Field label="E-post" required>
                  <input type="email" className={inputCls} value={form.contact_email}
                    onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} required />
                </Field>

                <Field label="Designønsker eller annet">
                  <textarea className={inputCls} rows={4}
                    placeholder="Logo, farger, budsjett eller annet dere har i tankene..."
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
                </Field>

                {typeof status === 'string' && status !== 'success' && (
                  <p className="text-red-500 text-sm">{status}</p>
                )}

                <button type="submit" disabled={sending}
                  className="w-full bg-gray-900 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl text-sm transition disabled:opacity-60">
                  {sending ? 'Sender...' : 'Send henvendelse →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
