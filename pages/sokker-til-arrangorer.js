// pages/sokker-til-arrangorer.js
import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';
import {
  PenLine, Palette, CheckCircle2, PackageCheck,
  Repeat2, Mountain, Ruler, ArrowRight,
} from 'lucide-react';

const STEG = [
  { icon: PenLine, tittel: 'Fortell oss om løpet', tekst: 'Navn, dato og omtrent hvor mange som løper. Tar to minutter å fylle ut.' },
  { icon: Palette, tittel: 'Vi setter opp et forslag', tekst: 'Vi legger logoen deres på sokken og sender et bilde — før noe som helst er bestemt.' },
  { icon: CheckCircle2, tittel: 'Dere sier ja, nei eller juster', tekst: 'Liker dere ikke forslaget, prøver vi igjen. Ingenting trykkes før dere har godkjent design, antall og pris.' },
  { icon: PackageCheck, tittel: 'Levert før løpsdagen', tekst: 'Vi selger egne sokker i nettbutikken, så vi vet hvor lang tid produksjon og frakt faktisk tar.' },
];

const HVORFOR = [
  { icon: Repeat2, tittel: 'Brukt uke etter uke', tekst: 'Capsen og buffen havner i skuffen. Løpesokker er noe folk faktisk har på seg neste gang de trener.' },
  { icon: Mountain, tittel: 'Logoen følger med på hver løpetur', tekst: 'Ikke bare synlig på startlinjen — løpets navn er fysisk med deltakeren hver gang de trener.' },
  { icon: Ruler, tittel: 'Vi justerer etter budsjettet deres', tekst: 'Fra 50 par til et par tusen. Vi finner en løsning som passer løpet deres, ikke en fast pakke.' },
];

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition";

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-blue-600">*</span>}
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
      <div className="relative bg-[#0b1626] overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 15% 20%, #2563eb 0%, transparent 45%),
                              radial-gradient(circle at 85% 70%, #1d4ed8 0%, transparent 40%)`,
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400 mb-4">
                For løpsarrangører
              </p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-[1.1] mb-5">
                T-skjorten ender i skuffen.<br /><span className="text-blue-400">Sokkene blir brukt.</span>
              </h1>
              <p className="text-gray-400 text-base md:text-lg max-w-lg leading-relaxed mb-8">
                Vi lager allerede løpesokker som selges i vår egen nettbutikk til norske
                ultraløpere. Nå kan dere få samme sokk med løpets eget logo på — til
                utdeling i løpsbagen, i målområdet, eller som en takk til de frivillige.
              </p>
              <a href="#skjema"
                className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-6 py-3.5 rounded-xl text-sm hover:bg-gray-100 transition shadow-lg shadow-black/20">
                Spør om pris og design
                <ArrowRight size={16} />
              </a>
            </div>

            <div className="relative aspect-square w-full max-w-sm mx-auto lg:mx-0 rounded-[2rem] overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] ring-1 ring-white/10 p-8">
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#f1f0ed]">
                <Image
                  src="/shop/Sock-5.png"
                  alt="Langeløp Endurance Crew løpesokk"
                  fill
                  priority
                  sizes="(max-width: 1024px) 60vw, 400px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Troverdighet */}
      <div className="bg-white py-5 px-4 border-b border-gray-100">
        <p className="text-center text-sm text-gray-500 max-w-2xl mx-auto">
          Dette er ikke et sideprosjekt — sjekk{' '}
          <a href="/shop" className="text-blue-600 font-medium hover:underline">nettbutikken vår</a>
          {' '}om du vil se sokken vi faktisk produserer og selger.
        </p>
      </div>

      {/* Slik fungerer det */}
      <div className="bg-gray-50 py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Slik fungerer det</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEG.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.tittel} className="relative bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-50 text-blue-600">
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <span className="text-2xl font-extrabold text-gray-200">{i + 1}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1.5">{s.tittel}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.tekst}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hvorfor sokker */}
      <div className="bg-white py-16 md:py-20 px-4 border-y border-gray-100">
        <div className="max-w-5xl mx-auto grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-4">
              Hvorfor sokker, og ikke<br />nok en caps eller buff?
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Det er fort gjort å drukne i goodiebag-produkter ingen egentlig bruker.
              Sokker er annerledes — ikke fordi de er et smartere produkt, men fordi
              de faktisk blir slitt ut.
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {HVORFOR.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.tittel} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{f.tittel}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.tekst}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Skjema */}
      <div id="skjema" className="bg-gray-50 py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-0 bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden">

            {/* Venstre: pitch */}
            <div className="bg-[#0b1626] text-white p-8 md:p-10 flex flex-col justify-center">
              <h2 className="text-2xl font-extrabold mb-3">Fortell oss om løpet</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Pris avhenger av antall og design, så vi sender et konkret forslag
                basert på det dere skriver her. Ta kontakt tidlig — det gir oss
                bedre tid til design og produksjon før løpsdagen.
              </p>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-400 shrink-0" /> Du ser forslaget før noe er bestemt</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-400 shrink-0" /> Pris og antall tilpasses løpet deres</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-400 shrink-0" /> Det er oss du svarer med, ikke et skjema</li>
              </ul>
            </div>

            {/* Høyre: skjema */}
            <div className="p-8 md:p-10">
              {status === 'success' ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-4">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Takk for henvendelsen!</h3>
                  <p className="text-sm text-gray-500">Vi tar kontakt innen kort tid med et forslag.</p>
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
                    <textarea className={inputCls} rows={3}
                      placeholder="Logo, farger, budsjett eller annet dere har i tankene..."
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
                  </Field>

                  {typeof status === 'string' && status !== 'success' && (
                    <p className="text-red-500 text-sm">{status}</p>
                  )}

                  <button type="submit" disabled={sending}
                    className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl text-sm transition disabled:opacity-60">
                    {sending ? 'Sender...' : <>Send henvendelse <ArrowRight size={16} /></>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
