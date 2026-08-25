import { useState, useEffect, useRef } from "react";
import Head from "next/head";

const DEV_LOG = [
  {
    date: "2026-08-24",
    title: "SEO-opprydding: admin blokkert, manglende lang-attributt",
    items: [
      "Admin-panelet var verken blokkert i robots.txt eller merket noindex — kunne i teorien dukke opp i Google-søk",
      "La til Disallow: /admin og /api/ i robots.txt, og noindex-meta på /admin",
      "Nettstedet manglet pages/_document.js — <html> hadde ingen lang-attributt. La til lang=\"nb\"",
    ],
  },
  {
    date: "2026-08-24",
    title: "SEO på shop-siden",
    items: [
      "Shop-siden hadde ingen egne meta-tagger — arvet forsidens tittel/beskrivelse om ultraløp, ikke sokker",
      "Lagt til egen tittel, meta-beskrivelse, canonical, Open Graph og Twitter-kort for /shop",
      "Lagt til schema.org Product-markup (pris, valuta, lagerstatus) for rikere Google-treff",
      "Justert H1 og ingress til å nevne «løpesokker» naturlig for bedre relevans på søk",
    ],
  },
  {
    date: "2026-08-24",
    title: "Daglig rapport: manglet kommentarer + manuell test-knapp",
    items: [
      "Den daglige rapport-eposten dekket aldri løpskommentarer eller artikkelkommentarer — lagt til som egne seksjoner",
      "Ny «Send testrapport nå»-knapp i Dev-fanen (Systemsjekk) for å trigge rapporten manuelt og se om e-post faktisk sendes",
      "Rapport-endepunktet godtar nå enten CRON_SECRET (Vercel Cron) eller admin-passord (manuell test)",
    ],
  },
  {
    date: "2026-08-24",
    title: "Bildeoptimalisering (Supabase cached egress)",
    items: [
      "Ny SmartImage-komponent: bruker next/image kun for bilder vi selv eier (Supabase-lagring), vanlig <img> for alt annet",
      "Løste Supabase «Cached Egress Exceeded»-varselet — egne bilder ble tidligere lastet i full oppløsning selv som små thumbnails",
      "Løpsbilder hentes fra ~45 ulike arrangør-domener — for mange til å whiteliste enkeltvis, derfor fallback til <img> for eksterne kilder i stedet",
      "Rettet en runde med ødelagte bilder på live-siden (400-feil) som oppsto da alle bilder først ble sendt via next/image uten at eksterne domener var whitelistet",
    ],
  },
  {
    date: "2026-07-28",
    title: "Konsepter-fane og mobilvennlig admin",
    items: [
      "Konsepter-fane: kort for sokkekonsepter med status (idé/prøver/dialog/besluttet), leverandør, kontakt og notater",
      "Bildeopplasting på konsepter (samme opplastingsknapp som løpsbilder)",
      "Oppfølgingspåminnelse på konsepter — rød badge når fristen er i dag/passert",
      "Egen leverandørliste (navn, kontakt, notater) i Konsepter-fanen",
      "Adminpanelet er nå mobilvennlig — sidebar blir en skjul/vis-meny på små skjermer",
      "Fant og fjernet en ekte Supabase service-role-nøkkel som lå committet i .env.local.example",
      "Tilbud-fane: leverandørhenvendelser gruppert per konsept, med egen status (kontaktet/venter/tilbud mottatt/prøve/avslått/valgt) og pris/MOQ/leveringstid",
      "Slo sammen Konsept- og Tilbud-fanen til én, med intern bryter og direkte «Se tilbud →»-lenke fra hvert konsept",
      "Mulig å registrere sokkebestillinger manuelt i Shop-fanen, for salg utenfor nettsiden (f.eks. privat via Vipps)",
    ],
  },
  {
    date: "2026-07-27",
    title: "Admin-panel",
    items: [
      "Bygget /admin med passordbeskyttelse (ADMIN_PASSWORD env var)",
      "Løp-fane: søk, sortering (dato/navn), filtrering (mangler bilde/info/URL/status), mangler-badges",
      "Redigering av løp: navn, dato, sted, region, URL, status, beskrivelse, bildeopplasting",
      "Nyhetsbrev-fane: MailerLite-integrasjon med sendte/utkast/planlagte kampanjer og statistikk",
      "Nyhetsbrev-fane: abonnentstatistikk fra Supabase (totalt, siste 7/30/90 dager, siste påmeldte)",
      "Shop-fane: bestillingsoversikt med bekreftet/ventende inntekt, lagerbeholdning per størrelse, manuelle lageruttak",
      "Dev-fane (denne siden)",
    ],
  },
  {
    date: "2026-07-27",
    title: "Nyhetsbrev-popup",
    items: [
      "Popup vises nå på alle sider (ikke bare forsiden) — unntatt /admin",
      "Tidligere: kun pathname === '/' i _app.js",
    ],
  },
  {
    date: "2026-07-27",
    title: "Sokkebestillinger",
    items: [
      "Historiske bestillinger importert til sock_orders-tabellen i Supabase",
      "Lagt til total_price og notes kolonne i sock_orders",
      "Nye bestillinger lagrer nå total_price automatisk",
      "stock_adjustments-tabell opprettet for manuelle lageruttak",
    ],
  },
  {
    date: "2026-07-08",
    title: "Artikkel: Ernæring under ultraløp",
    items: [
      "Ny MDX-artikkel av Oliver Nilsen",
      "JSON-LD Article schema lagt til på alle artikkelsider",
      "FAQ-seksjon og interne lenker for SEO",
    ],
  },
  {
    date: "2026-07-08",
    title: "Diverse",
    items: [
      "CTA på løpssider endret fra 'Meld deg på' til 'Besøk nettside'",
      "Nyhetsbrev-popup nullstilt til v2 (alle brukere fikk den opp igjen én gang)",
      "Løp uten distance_numeric vises nå i filteret på forsiden",
      "Bildeopplasting for produktanmeldelser",
    ],
  },
];


const PRIORITY_STYLE = {
  high: "bg-red-50 text-red-600 border-red-200",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  low: "bg-gray-50 text-gray-500 border-gray-200",
};
const PRIORITY_LABEL = { high: "Høy", medium: "Medium", low: "Lav" };

function DevTab({ adminPw }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [reportSending, setReportSending] = useState(false);
  const [reportResult, setReportResult] = useState(null);

  async function sendTestReport() {
    setReportSending(true);
    setReportResult(null);
    try {
      const res = await fetch("/api/cron/daily-report?force=1", {
        headers: { "x-admin-password": adminPw },
      });
      const data = await res.json();
      if (!res.ok) {
        setReportResult({ ok: false, message: data.error || "Ukjent feil" });
      } else {
        setReportResult({ ok: true, message: `Sendt! ${data.total} hendelse(r) siste 24t.` });
      }
    } catch (err) {
      setReportResult({ ok: false, message: err.message });
    }
    setReportSending(false);
  }

  function loadTasks() {
    return fetch("/api/admin/dev-tasks", { headers: { "x-admin-password": adminPw } })
      .then((r) => r.json())
      .then((data) => setTasks(Array.isArray(data) ? data : []));
  }

  useEffect(() => {
    loadTasks().then(() => setLoading(false));
  }, [adminPw]);

  async function addTask(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/dev-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim(), priority: newPriority }),
    });
    const task = await res.json();
    setTasks((ts) => [task, ...ts]);
    setNewTitle("");
    setNewDesc("");
    setNewPriority("medium");
    setShowAdd(false);
    setSaving(false);
  }

  async function toggleComplete(task) {
    const updated = { id: task.id, completed: !task.completed };
    const res = await fetch("/api/admin/dev-tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify(updated),
    });
    const data = await res.json();
    setTasks((ts) => ts.map((t) => t.id === task.id ? data : t));
  }

  async function deleteTask(id) {
    if (!confirm("Slett oppgaven?")) return;
    await fetch("/api/admin/dev-tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({ id }),
    });
    setTasks((ts) => ts.filter((t) => t.id !== id));
  }

  async function saveEdit(id) {
    const res = await fetch("/api/admin/dev-tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({ id, ...editForm }),
    });
    const data = await res.json();
    setTasks((ts) => ts.map((t) => t.id === id ? data : t));
    setEditingId(null);
  }

  const open = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition";

  function TaskCard({ t }) {
    const isEditing = editingId === t.id;
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 p-5 ${t.completed ? "opacity-60" : ""}`}>
        {isEditing ? (
          <div className="space-y-3">
            <input
              value={editForm.title ?? ""}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              className={inputCls}
              placeholder="Tittel"
              autoFocus
            />
            <textarea
              value={editForm.description ?? ""}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              className={inputCls}
              rows={3}
              placeholder="Beskrivelse (valgfritt)"
            />
            <div className="flex gap-2 items-center">
              <select
                value={editForm.priority ?? "medium"}
                onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {["high", "medium", "low"].map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                ))}
              </select>
              <button onClick={() => saveEdit(t.id)} className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition">Lagre</button>
              <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-gray-500 text-sm hover:text-gray-700">Avbryt</button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <button
              onClick={() => toggleComplete(t)}
              className={`shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${t.completed ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-gray-500"}`}
              title={t.completed ? "Marker som åpen" : "Marker som fullført"}
            >
              {t.completed && <span className="text-[10px] font-bold">✓</span>}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`shrink-0 text-xs font-medium border rounded-full px-2.5 py-1 ${PRIORITY_STYLE[t.priority]}`}>
                  {PRIORITY_LABEL[t.priority]}
                </span>
                <p className={`font-semibold text-sm ${t.completed ? "line-through text-gray-400" : "text-gray-900"}`}>{t.title}</p>
              </div>
              {t.description && <p className="text-sm text-gray-500 mt-1">{t.description}</p>}
            </div>
            <div className="shrink-0 flex gap-1">
              <button
                onClick={() => { setEditingId(t.id); setEditForm({ title: t.title, description: t.description || "", priority: t.priority }); }}
                className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-50 transition"
              >Rediger</button>
              <button
                onClick={() => deleteTask(t.id)}
                className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition"
              >Slett</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-10">
      {/* Systemsjekk */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Systemsjekk</h2>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-sm text-gray-900">Daglig rapport (e-post)</p>
            <p className="text-sm text-gray-500 mt-0.5">Trigger rapport-cronen manuelt for å teste at e-post faktisk går gjennom.</p>
          </div>
          <button
            onClick={sendTestReport}
            disabled={reportSending}
            className="shrink-0 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
          >
            {reportSending ? "Sender…" : "Send testrapport nå"}
          </button>
        </div>
        {reportResult && (
          <p className={`text-sm mt-2 ${reportResult.ok ? "text-green-600" : "text-red-600"}`}>
            {reportResult.ok ? "✓ " : "✗ "}{reportResult.message}
          </p>
        )}
      </div>

      {/* TODO */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Åpne oppgaver</h2>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition"
          >
            {showAdd ? "Avbryt" : "+ Ny oppgave"}
          </button>
        </div>

        {showAdd && (
          <form onSubmit={addTask} className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 space-y-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className={inputCls}
              placeholder="Tittel *"
              autoFocus
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className={inputCls}
              rows={3}
              placeholder="Beskrivelse (valgfritt)"
            />
            <div className="flex gap-2 items-center">
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {["high", "medium", "low"].map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={saving || !newTitle.trim()}
                className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
              >
                {saving ? "Lagrer…" : "Legg til"}
              </button>
            </div>
          </form>
        )}

        {loading && <p className="text-sm text-gray-400">Laster oppgaver…</p>}
        {!loading && open.length === 0 && <p className="text-sm text-gray-400">Ingen åpne oppgaver.</p>}

        <div className="space-y-3">
          {open.map((t) => <TaskCard key={t.id} t={t} />)}
        </div>

        {done.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Fullførte</p>
            <div className="space-y-2">
              {done.map((t) => <TaskCard key={t.id} t={t} />)}
            </div>
          </div>
        )}
      </div>

      {/* Endringslogg */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Endringslogg</h2>
        <div className="space-y-4">
          {DEV_LOG.map((entry, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <p className="font-semibold text-gray-900">{entry.title}</p>
                <span className="text-xs text-gray-400">{entry.date}</span>
              </div>
              <ul className="space-y-1.5">
                {entry.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-gray-300 mt-0.5">–</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const CONCEPT_STATUS = [
  { value: "idea", label: "Idé", style: "bg-gray-50 text-gray-500 border-gray-200" },
  { value: "samples", label: "Prøver bestilt", style: "bg-blue-50 text-blue-600 border-blue-200" },
  { value: "dialogue", label: "I dialog", style: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { value: "decided", label: "Besluttet", style: "bg-green-50 text-green-700 border-green-200" },
];
const CONCEPT_STATUS_MAP = Object.fromEntries(CONCEPT_STATUS.map((s) => [s.value, s]));

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function FollowUpBadge({ date }) {
  if (!date) return null;
  const today = todayStr();
  const overdue = date < today;
  const dueToday = date === today;
  const label = new Date(date).toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
  const style = overdue || dueToday
    ? "bg-red-50 text-red-600 border-red-200"
    : "bg-gray-50 text-gray-500 border-gray-200";
  return (
    <span className={`shrink-0 text-xs font-medium border rounded-full px-2.5 py-1 ${style}`}>
      {overdue ? "Følg opp! (var " : dueToday ? "Følg opp i dag" : "Følg opp "}{!dueToday && label}{overdue && ")"}
    </span>
  );
}

function SupplierSection({ adminPw }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetch("/api/admin/suppliers", { headers: { "x-admin-password": adminPw } })
      .then((r) => r.json())
      .then((data) => setSuppliers(Array.isArray(data) ? data : []))
      .then(() => setLoading(false));
  }, [adminPw]);

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition";

  async function addSupplier(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({ name: newName.trim(), contact: newContact.trim(), notes: newNotes.trim() }),
    });
    const supplier = await res.json();
    setSuppliers((ss) => [...ss, supplier].sort((a, b) => a.name.localeCompare(b.name, "nb")));
    setNewName("");
    setNewContact("");
    setNewNotes("");
    setShowAdd(false);
    setSaving(false);
  }

  async function saveEdit(id) {
    const res = await fetch("/api/admin/suppliers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({ id, ...editForm }),
    });
    const data = await res.json();
    setSuppliers((ss) => ss.map((s) => s.id === id ? data : s));
    setEditingId(null);
  }

  async function deleteSupplier(id) {
    if (!confirm("Slette leverandøren?")) return;
    await fetch("/api/admin/suppliers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({ id }),
    });
    setSuppliers((ss) => ss.filter((s) => s.id !== id));
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 mb-6 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <p className="text-sm font-semibold text-gray-900">Leverandører {!loading && `(${suppliers.length})`}</p>
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="text-xs font-medium bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition"
            >
              {showAdd ? "Avbryt" : "+ Ny leverandør"}
            </button>
          </div>

          {showAdd && (
            <form onSubmit={addSupplier} className="bg-gray-50 rounded-xl p-4 mb-3 space-y-2">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className={inputCls} placeholder="Navn *" autoFocus />
              <input value={newContact} onChange={(e) => setNewContact(e.target.value)} className={inputCls} placeholder="Kontakt (e-post/telefon)" />
              <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} className={inputCls} rows={2} placeholder="Notater" />
              <button type="submit" disabled={saving || !newName.trim()} className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50">
                {saving ? "Lagrer…" : "Legg til"}
              </button>
            </form>
          )}

          {loading && <p className="text-sm text-gray-400">Laster…</p>}
          {!loading && suppliers.length === 0 && <p className="text-sm text-gray-400">Ingen leverandører lagt til ennå.</p>}

          <div className="space-y-2">
            {suppliers.map((s) => {
              const isEditing = editingId === s.id;
              return (
                <div key={s.id} className="border border-gray-100 rounded-xl p-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input value={editForm.name ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Navn" autoFocus />
                      <input value={editForm.contact ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, contact: e.target.value }))} className={inputCls} placeholder="Kontakt" />
                      <textarea value={editForm.notes ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} className={inputCls} rows={2} placeholder="Notater" />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(s.id)} className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition">Lagre</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-gray-500 text-xs hover:text-gray-700">Avbryt</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{s.name}</p>
                        {s.contact && <p className="text-xs text-gray-500 mt-0.5">{s.contact}</p>}
                        {s.notes && <p className="text-xs text-gray-500 mt-1">{s.notes}</p>}
                      </div>
                      <div className="shrink-0 flex gap-1">
                        <button
                          onClick={() => { setEditingId(s.id); setEditForm({ name: s.name, contact: s.contact || "", notes: s.notes || "" }); }}
                          className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-50 transition"
                        >Rediger</button>
                        <button onClick={() => deleteSupplier(s.id)} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition">Slett</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ConceptsTab({ adminPw, onViewOffers }) {
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newFollowUp, setNewFollowUp] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadingNew, setUploadingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uploadingEdit, setUploadingEdit] = useState(false);
  const newImageRef = useRef();
  const editImageRef = useRef();

  function loadConcepts() {
    return fetch("/api/admin/concepts", { headers: { "x-admin-password": adminPw } })
      .then((r) => r.json())
      .then((data) => setConcepts(Array.isArray(data) ? data : []));
  }

  useEffect(() => {
    loadConcepts().then(() => setLoading(false));
  }, [adminPw]);

  async function uploadImage(file) {
    const data = new FormData();
    data.append("file", file);
    data.append("bucket", "concept-images");
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { "x-admin-password": adminPw },
      body: data,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json.url;
  }

  async function handleNewImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingNew(true);
    try {
      setNewImageUrl(await uploadImage(file));
    } catch (err) {
      alert("Opplasting feilet: " + err.message);
    } finally {
      setUploadingNew(false);
    }
  }

  async function handleEditImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEdit(true);
    try {
      const url = await uploadImage(file);
      setEditForm((f) => ({ ...f, image_url: url }));
    } catch (err) {
      alert("Opplasting feilet: " + err.message);
    } finally {
      setUploadingEdit(false);
    }
  }

  async function addConcept(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/concepts", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({
        name: newName.trim(),
        supplier: newSupplier.trim(),
        contact: newContact.trim(),
        notes: newNotes.trim(),
        image_url: newImageUrl,
        follow_up_date: newFollowUp || null,
      }),
    });
    const concept = await res.json();
    setConcepts((cs) => [concept, ...cs]);
    setNewName("");
    setNewSupplier("");
    setNewContact("");
    setNewNotes("");
    setNewFollowUp("");
    setNewImageUrl("");
    setShowAdd(false);
    setSaving(false);
  }

  async function updateStatus(concept, status) {
    const res = await fetch("/api/admin/concepts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({ id: concept.id, status }),
    });
    const data = await res.json();
    setConcepts((cs) => cs.map((c) => c.id === concept.id ? data : c));
  }

  async function deleteConcept(id) {
    if (!confirm("Slette konseptet?")) return;
    await fetch("/api/admin/concepts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({ id }),
    });
    setConcepts((cs) => cs.filter((c) => c.id !== id));
  }

  async function saveEdit(id) {
    const res = await fetch("/api/admin/concepts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({ id, ...editForm }),
    });
    const data = await res.json();
    setConcepts((cs) => cs.map((c) => c.id === id ? data : c));
    setEditingId(null);
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition";

  function ConceptCard({ c }) {
    const isEditing = editingId === c.id;
    const status = CONCEPT_STATUS_MAP[c.status] || CONCEPT_STATUS[0];
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        {isEditing ? (
          <div className="space-y-3">
            <input
              value={editForm.name ?? ""}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              className={inputCls}
              placeholder="Konseptnavn"
              autoFocus
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={editForm.supplier ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, supplier: e.target.value }))}
                className={inputCls}
                placeholder="Leverandør"
              />
              <input
                value={editForm.contact ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, contact: e.target.value }))}
                className={inputCls}
                placeholder="Kontakt (e-post/telefon)"
              />
            </div>
            <textarea
              value={editForm.notes ?? ""}
              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
              className={inputCls}
              rows={4}
              placeholder="Notater / logg fra dialog"
            />
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Følg opp innen</label>
              <input
                type="date"
                value={editForm.follow_up_date ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, follow_up_date: e.target.value }))}
                className={`${inputCls} w-auto`}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Bilde</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                <input value={editForm.image_url ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, image_url: e.target.value }))} className={`${inputCls} flex-1`} placeholder="https://..." />
                <button
                  type="button"
                  onClick={() => editImageRef.current?.click()}
                  disabled={uploadingEdit}
                  className="shrink-0 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                >
                  {uploadingEdit ? "Laster opp…" : "Last opp"}
                </button>
                <input ref={editImageRef} type="file" accept="image/*" className="hidden" onChange={handleEditImage} />
              </div>
              {editForm.image_url && <img src={editForm.image_url} alt="" className="mt-2 h-24 rounded-xl object-cover" />}
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <select
                value={editForm.status ?? c.status}
                onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {CONCEPT_STATUS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button onClick={() => saveEdit(c.id)} className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition">Lagre</button>
              <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-gray-500 text-sm hover:text-gray-700">Avbryt</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-3">
              {c.image_url && (
                <img src={c.image_url} alt="" className="shrink-0 w-16 h-16 rounded-xl object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`shrink-0 text-xs font-medium border rounded-full px-2.5 py-1 ${status.style}`}>
                    {status.label}
                  </span>
                  <FollowUpBadge date={c.follow_up_date} />
                  <p className="font-semibold text-sm text-gray-900">{c.name}</p>
                </div>
                {(c.supplier || c.contact) && (
                  <p className="text-sm text-gray-500 mt-1">
                    {c.supplier}
                    {c.supplier && c.contact && " · "}
                    {c.contact}
                  </p>
                )}
                {c.notes && <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{c.notes}</p>}
              </div>
              <div className="shrink-0 flex gap-1">
                <button
                  onClick={() => { setEditingId(c.id); setEditForm({ name: c.name, supplier: c.supplier || "", contact: c.contact || "", notes: c.notes || "", status: c.status, image_url: c.image_url || "", follow_up_date: c.follow_up_date || "" }); }}
                  className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-50 transition"
                >Rediger</button>
                <button
                  onClick={() => deleteConcept(c.id)}
                  className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition"
                >Slett</button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap mt-3">
              <div className="flex gap-1.5 flex-wrap">
                {CONCEPT_STATUS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => updateStatus(c, s.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${c.status === s.value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {onViewOffers && (
                <button
                  onClick={() => onViewOffers(c.id)}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Se tilbud →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <SupplierSection adminPw={adminPw} />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Sokkekonsepter</h2>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition"
        >
          {showAdd ? "Avbryt" : "+ Nytt konsept"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addConcept} className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 space-y-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className={inputCls}
            placeholder="Konseptnavn *"
            autoFocus
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              value={newSupplier}
              onChange={(e) => setNewSupplier(e.target.value)}
              className={inputCls}
              placeholder="Leverandør"
            />
            <input
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              className={inputCls}
              placeholder="Kontakt (e-post/telefon)"
            />
          </div>
          <textarea
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            className={inputCls}
            rows={3}
            placeholder="Notater / status på dialogen"
          />
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Følg opp innen</label>
            <input
              type="date"
              value={newFollowUp}
              onChange={(e) => setNewFollowUp(e.target.value)}
              className={`${inputCls} w-auto`}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Bilde</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
              <input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} className={`${inputCls} flex-1`} placeholder="https://..." />
              <button
                type="button"
                onClick={() => newImageRef.current?.click()}
                disabled={uploadingNew}
                className="shrink-0 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
              >
                {uploadingNew ? "Laster opp…" : "Last opp"}
              </button>
              <input ref={newImageRef} type="file" accept="image/*" className="hidden" onChange={handleNewImage} />
            </div>
            {newImageUrl && <img src={newImageUrl} alt="" className="mt-2 h-24 rounded-xl object-cover" />}
          </div>
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
          >
            {saving ? "Lagrer…" : "Legg til"}
          </button>
        </form>
      )}

      {loading && <p className="text-sm text-gray-400">Laster konsepter…</p>}
      {!loading && concepts.length === 0 && <p className="text-sm text-gray-400">Ingen konsepter lagt til ennå.</p>}

      <div className="space-y-3">
        {concepts.map((c) => <ConceptCard key={c.id} c={c} />)}
      </div>
    </div>
  );
}

const OFFER_STATUS = [
  { value: "contacted", label: "Kontaktet", style: "bg-gray-50 text-gray-500 border-gray-200", edge: "border-l-gray-300" },
  { value: "waiting", label: "Venter svar", style: "bg-yellow-50 text-yellow-700 border-yellow-200", edge: "border-l-yellow-400" },
  { value: "received", label: "Tilbud mottatt", style: "bg-blue-50 text-blue-600 border-blue-200", edge: "border-l-blue-400" },
  { value: "sample", label: "Prøve bestilt", style: "bg-purple-50 text-purple-600 border-purple-200", edge: "border-l-purple-400" },
  { value: "rejected", label: "Avslått", style: "bg-red-50 text-red-500 border-red-200", edge: "border-l-red-400" },
  { value: "chosen", label: "Valgt", style: "bg-green-50 text-green-700 border-green-200", edge: "border-l-green-400" },
];
const OFFER_STATUS_MAP = Object.fromEntries(OFFER_STATUS.map((s) => [s.value, s]));

function ComparisonTab({ adminPw, focusConceptId }) {
  const [offers, setOffers] = useState([]);
  const [concepts, setConcepts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const conceptRefs = useRef({});
  const [conceptId, setConceptId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState("contacted");
  const [price, setPrice] = useState("");
  const [moq, setMoq] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/supplier-offers", { headers: { "x-admin-password": adminPw } })
        .then((r) => r.json())
        .then((data) => setOffers(Array.isArray(data) ? data : [])),
      fetch("/api/admin/concepts", { headers: { "x-admin-password": adminPw } })
        .then((r) => r.json())
        .then((data) => setConcepts(Array.isArray(data) ? data : [])),
      fetch("/api/admin/suppliers", { headers: { "x-admin-password": adminPw } })
        .then((r) => r.json())
        .then((data) => setSuppliers(Array.isArray(data) ? data : [])),
    ]).then(() => setLoading(false));
  }, [adminPw]);

  useEffect(() => {
    if (!loading && focusConceptId && conceptRefs.current[focusConceptId]) {
      conceptRefs.current[focusConceptId].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, focusConceptId]);

  useEffect(() => {
    if (focusConceptId) setConceptId(String(focusConceptId));
  }, [focusConceptId]);

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition";

  async function addOffer(e) {
    e.preventDefault();
    if (!conceptId || !supplierId) return;
    setSaving(true);
    const res = await fetch("/api/admin/supplier-offers", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({
        concept_id: conceptId,
        supplier_id: supplierId,
        status,
        price: price.trim(),
        moq: moq.trim(),
        lead_time: leadTime.trim(),
        notes: notes.trim(),
      }),
    });
    const offer = await res.json();
    setOffers((os) => [...os, offer]);
    setConceptId("");
    setSupplierId("");
    setStatus("contacted");
    setPrice("");
    setMoq("");
    setLeadTime("");
    setNotes("");
    setShowAdd(false);
    setSaving(false);
  }

  async function updateStatus(offer, newStatus) {
    const res = await fetch("/api/admin/supplier-offers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({ id: offer.id, status: newStatus }),
    });
    const data = await res.json();
    setOffers((os) => os.map((o) => o.id === offer.id ? data : o));
  }

  async function saveEdit(id) {
    const res = await fetch("/api/admin/supplier-offers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({ id, ...editForm }),
    });
    const data = await res.json();
    setOffers((os) => os.map((o) => o.id === id ? data : o));
    setEditingId(null);
  }

  async function deleteOffer(id) {
    if (!confirm("Slette henvendelsen?")) return;
    await fetch("/api/admin/supplier-offers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({ id }),
    });
    setOffers((os) => os.filter((o) => o.id !== id));
  }

  const conceptIdsWithOffers = [...new Set(offers.map((o) => o.concept_id))];
  const orderedConceptIds = [
    ...concepts.map((c) => c.id).filter((id) => conceptIdsWithOffers.includes(id)),
    ...conceptIdsWithOffers.filter((id) => !concepts.some((c) => c.id === id)),
  ];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Leverandørtilbud per konsept</h2>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition"
        >
          {showAdd ? "Avbryt" : "+ Ny henvendelse"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addOffer} className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Konsept</label>
            <select value={conceptId} onChange={(e) => setConceptId(e.target.value)} className={inputCls} autoFocus>
              <option value="">Velg konsept…</option>
              {concepts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {concepts.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">Ingen konsepter lagt til ennå — legg til under "Sokkekonsepter" først.</p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Leverandør</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={inputCls}>
              <option value="">Velg leverandør…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {suppliers.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">Ingen leverandører lagt til ennå — legg til i leverandørlisten først.</p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              {OFFER_STATUS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} placeholder="Pris (f.eks. 42-45 kr/par)" />
            <input value={moq} onChange={(e) => setMoq(e.target.value)} className={inputCls} placeholder="MOQ (f.eks. 336 par/str.)" />
            <input value={leadTime} onChange={(e) => setLeadTime(e.target.value)} className={inputCls} placeholder="Leveringstid" />
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} rows={2} placeholder="Notater (kvalitet, filformat, forbehold…)" />
          <button
            type="submit"
            disabled={saving || !conceptId || !supplierId}
            className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
          >
            {saving ? "Lagrer…" : "Legg til"}
          </button>
        </form>
      )}

      {loading && <p className="text-sm text-gray-400">Laster…</p>}
      {!loading && offers.length === 0 && <p className="text-sm text-gray-400">Ingen leverandørhenvendelser registrert ennå.</p>}

      <div className="space-y-8">
        {orderedConceptIds.map((cid) => {
          const concept = concepts.find((c) => c.id === cid);
          const conceptOffers = offers.filter((o) => o.concept_id === cid);
          const isFocused = focusConceptId && String(focusConceptId) === String(cid);
          return (
            <div
              key={cid}
              ref={(el) => { conceptRefs.current[cid] = el; }}
              className={isFocused ? "ring-2 ring-gray-900 ring-offset-4 ring-offset-gray-100 rounded-2xl" : ""}
            >
              <div className="flex items-center gap-3 mb-3">
                {concept?.image_url && (
                  <img src={concept.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                )}
                <h3 className="text-lg font-bold text-gray-900">{concept?.name || "Ukjent konsept"}</h3>
              </div>
              <div className="space-y-2">
                {conceptOffers.map((o) => {
                  const isEditing = editingId === o.id;
                  const st = OFFER_STATUS_MAP[o.status] || OFFER_STATUS[0];
                  return (
                    <div key={o.id} className={`bg-white rounded-2xl border border-gray-200 border-l-4 ${st.edge} p-4`}>
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input value={editForm.price ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} className={inputCls} placeholder="Pris" />
                            <input value={editForm.moq ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, moq: e.target.value }))} className={inputCls} placeholder="MOQ" />
                            <input value={editForm.lead_time ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, lead_time: e.target.value }))} className={inputCls} placeholder="Leveringstid" />
                          </div>
                          <textarea value={editForm.notes ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} className={inputCls} rows={2} placeholder="Notater" />
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(o.id)} className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition">Lagre</button>
                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-gray-500 text-xs hover:text-gray-700">Avbryt</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm text-gray-900">{o.supplier?.name || "Ukjent leverandør"}</p>
                                <select
                                  value={o.status}
                                  onChange={(e) => updateStatus(o, e.target.value)}
                                  className={`shrink-0 text-xs font-medium border rounded-full pl-2.5 pr-5 py-1 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-900 ${st.style}`}
                                >
                                  {OFFER_STATUS.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                  ))}
                                </select>
                              </div>
                              {o.supplier?.contact && (
                                <p className="text-xs text-gray-400 mt-0.5">{o.supplier.contact}</p>
                              )}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 mt-3 text-sm">
                                <div><span className="text-gray-400">Pris</span><br />{o.price || "–"}</div>
                                <div><span className="text-gray-400">MOQ</span><br />{o.moq || "–"}</div>
                                <div><span className="text-gray-400">Leveringstid</span><br />{o.lead_time || "–"}</div>
                              </div>
                              {o.notes && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <p className="text-xs text-gray-400 mb-1">Notater</p>
                                  <p className="text-sm text-gray-600">{o.notes}</p>
                                </div>
                              )}
                            </div>
                            <div className="shrink-0 flex gap-1">
                              <button
                                onClick={() => { setEditingId(o.id); setEditForm({ price: o.price || "", moq: o.moq || "", lead_time: o.lead_time || "", notes: o.notes || "" }); }}
                                className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-50 transition"
                              >Rediger</button>
                              <button onClick={() => deleteOffer(o.id)} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition">Slett</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductDevTab({ adminPw }) {
  const [subTab, setSubTab] = useState("concepts");
  const [focusConceptId, setFocusConceptId] = useState(null);

  function viewOffers(conceptId) {
    setFocusConceptId(conceptId);
    setSubTab("compare");
  }

  return (
    <div>
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { value: "concepts", label: "Konsepter" },
          { value: "compare", label: "Tilbud" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setSubTab(t.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              subTab === t.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {subTab === "concepts" && <ConceptsTab adminPw={adminPw} onViewOffers={viewOffers} />}
      {subTab === "compare" && <ComparisonTab adminPw={adminPw} focusConceptId={focusConceptId} />}
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: "", label: "Ingen" },
  { value: "Utsolgt", label: "Utsolgt" },
  { value: "Få plasser igjen", label: "Få plasser igjen" },
  { value: "Avlyst", label: "Avlyst" },
  { value: "Utsatt", label: "Utsatt" },
];

function PasswordGate({ onAuth }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/update-race", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": pw },
      body: JSON.stringify({ slug: "__ping__" }),
    });
    setLoading(false);
    if (res.status === 401) {
      setError("Feil passord");
    } else {
      localStorage.setItem("adminPw", pw);
      onAuth(pw);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Admin – Langeløp.no</h1>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            placeholder="Passord"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            autoFocus
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold hover:bg-gray-700 transition disabled:opacity-60"
          >
            {loading ? "Logger inn…" : "Logg inn"}
          </button>
        </form>
      </div>
    </div>
  );
}

function RaceEditor({ race, adminPw, onSaved }) {
  const [form, setForm] = useState({
    name: race.name || "",
    date: race.date || "",
    location: race.location || "",
    region: race.region || "",
    url: race.url || "",
    status_note: race.status_note || "",
    description: race.description || "",
    image_url: race.image_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGpx, setUploadingGpx] = useState(false);
  const imageRef = useRef();
  const gpxRef = useRef();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function uploadFile(file, bucket) {
    const data = new FormData();
    data.append("file", file);
    data.append("bucket", bucket);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { "x-admin-password": adminPw },
      body: data,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json.url;
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadFile(file, "race-images");
      setForm((f) => ({ ...f, image_url: url }));
    } catch (err) {
      alert("Opplasting feilet: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleGpxUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGpx(true);
    try {
      const url = await uploadFile(file, "gpx-files");
      setForm((f) => ({ ...f, gpx_url: url }));
    } catch (err) {
      alert("Opplasting feilet: " + err.message);
    } finally {
      setUploadingGpx(false);
    }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/admin/update-race", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({ slug: race.slug, ...form }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      onSaved({ ...race, ...form });
      setTimeout(() => setSaved(false), 3000);
    } else {
      const j = await res.json();
      alert("Feil: " + j.error);
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Navn</label>
          <input value={form.name} onChange={set("name")} className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Dato</label>
          <input type="date" value={form.date} onChange={set("date")} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Sted</label>
          <input value={form.location} onChange={set("location")} className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Region/fylke</label>
          <input value={form.region} onChange={set("region")} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Nettside (URL)</label>
          <input value={form.url} onChange={set("url")} className={inputCls} placeholder="https://..." />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Status</label>
          <select value={form.status_note} onChange={set("status_note")} className={inputCls}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Beskrivelse</label>
        <textarea value={form.description} onChange={set("description")} rows={4} className={inputCls} />
      </div>

      {/* Bilde */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Bilde</label>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
          <input value={form.image_url} onChange={set("image_url")} className={`${inputCls} flex-1`} placeholder="https://..." />
          <button
            type="button"
            onClick={() => imageRef.current?.click()}
            disabled={uploadingImage}
            className="shrink-0 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
          >
            {uploadingImage ? "Laster opp…" : "Last opp"}
          </button>
          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>
        {form.image_url && (
          <img src={form.image_url} alt="" className="mt-2 h-24 rounded-xl object-cover" />
        )}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold hover:bg-gray-700 transition disabled:opacity-60"
      >
        {saving ? "Lagrer…" : saved ? "✓ Lagret!" : "Lagre endringer"}
      </button>
    </div>
  );
}

function getPricing(qty) {
  if (qty <= 0) return { price: 0, shipping: 0 };
  if (qty === 1) return { price: 249, shipping: 69 };
  if (qty === 2) return { price: 449, shipping: 69 };
  return { price: 649 + (qty - 3) * 200, shipping: 0 };
}

function getTotal(qty) {
  const { price, shipping } = getPricing(qty);
  return price + shipping;
}

const ORDER_STATUSES = [
  { value: "pending_payment", label: "Venter Vipps", color: "bg-yellow-50 text-yellow-700" },
  { value: "paid", label: "Betalt", color: "bg-blue-50 text-blue-700" },
  { value: "shipped", label: "Sendt", color: "bg-green-50 text-green-700" },
  { value: "cancelled", label: "Avbrutt", color: "bg-red-50 text-red-600" },
];

function StatusBadge({ status }) {
  const s = ORDER_STATUSES.find((o) => o.value === status) || ORDER_STATUSES[0];
  return (
    <span className={`inline-block text-xs font-medium rounded-full px-2.5 py-1 ${s.color}`}>
      {s.label}
    </span>
  );
}

function ShopTab({ adminPw }) {
  const [orders, setOrders] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [adjSize, setAdjSize] = useState("S");
  const [adjQty, setAdjQty] = useState("");
  const [adjNote, setAdjNote] = useState("");
  const [adjSaving, setAdjSaving] = useState(false);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({ name: "", email: "", size: "S", quantity: 1, address: "", postal_code: "", city: "", status: "paid", total_price: "", notes: "" });
  const [orderSaving, setOrderSaving] = useState(false);

  function loadAdjustments() {
    return fetch("/api/admin/stock-adjustments", { headers: { "x-admin-password": adminPw } })
      .then((r) => r.json())
      .then((data) => setAdjustments(Array.isArray(data) ? data : []));
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/orders", { headers: { "x-admin-password": adminPw } })
        .then((r) => r.json())
        .then((data) => setOrders(Array.isArray(data) ? data : [])),
      loadAdjustments(),
    ]).then(() => setLoading(false));
  }, [adminPw]);

  async function addAdjustment(e) {
    e.preventDefault();
    if (!adjQty || parseInt(adjQty) <= 0) return;
    setAdjSaving(true);
    await fetch("/api/admin/stock-adjustments", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({ size: adjSize, quantity: parseInt(adjQty), note: adjNote }),
    });
    await loadAdjustments();
    setAdjQty("");
    setAdjNote("");
    setAdjSaving(false);
  }

  async function updateStatus(id, status) {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({ id, status }),
    });
    setOrders((os) => os.map((o) => o.id === id ? { ...o, status } : o));
  }

  async function addOrder(e) {
    e.preventDefault();
    if (!newOrder.name.trim() || !newOrder.quantity) return;
    setOrderSaving(true);
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({
        name: newOrder.name.trim(),
        email: newOrder.email.trim(),
        size: newOrder.size,
        quantity: parseInt(newOrder.quantity),
        address: newOrder.address.trim(),
        postal_code: newOrder.postal_code.trim(),
        city: newOrder.city.trim(),
        status: newOrder.status,
        total_price: newOrder.total_price ? parseInt(newOrder.total_price) : getTotal(parseInt(newOrder.quantity)),
        notes: newOrder.notes.trim(),
      }),
    });
    const order = await res.json();
    setOrders((os) => [order, ...os]);
    setNewOrder({ name: "", email: "", size: "S", quantity: 1, address: "", postal_code: "", city: "", status: "paid", total_price: "", notes: "" });
    setShowAddOrder(false);
    setOrderSaving(false);
  }

  function formatDate(str) {
    if (!str) return "–";
    return new Date(str).toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const orderTotal = (o) => o.total_price ?? getTotal(o.quantity);

  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  const confirmedOrders = activeOrders.filter((o) => o.status === "paid" || o.status === "shipped");
  const pendingOrders = activeOrders.filter((o) => o.status === "pending_payment");

  const totalRevenue = confirmedOrders.reduce((s, o) => s + orderTotal(o), 0);
  const pendingRevenue = pendingOrders.reduce((s, o) => s + orderTotal(o), 0);
  const revenueThisMonth = confirmedOrders
    .filter((o) => new Date(o.created_at) >= thirtyDaysAgo)
    .reduce((s, o) => s + orderTotal(o), 0);
  const ordersThisMonth = confirmedOrders.filter((o) => new Date(o.created_at) >= thirtyDaysAgo).length;
  const avgOrder = confirmedOrders.length ? Math.round(totalRevenue / confirmedOrders.length) : 0;

  const INITIAL_STOCK = { S: 30, M: 50, L: 20 };
  const soldBySize = activeOrders.reduce((acc, o) => {
    acc[o.size] = (acc[o.size] || 0) + o.quantity;
    return acc;
  }, {});
  const adjustedBySize = adjustments.reduce((acc, a) => {
    acc[a.size] = (acc[a.size] || 0) + Math.abs(a.quantity);
    return acc;
  }, {});
  const stock = Object.fromEntries(
    Object.entries(INITIAL_STOCK).map(([size, initial]) => {
      const sold = soldBySize[size] || 0;
      const adj = adjustedBySize[size] || 0;
      return [size, { initial, sold, adjusted: adj, remaining: initial - sold - adj }];
    })
  );

  const filtered = orders.filter((o) => filterStatus === "all" || o.status === filterStatus);
  const ordInputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Sokkebestillinger</h2>
        <button
          onClick={() => setShowAddOrder((v) => !v)}
          className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition"
        >
          {showAddOrder ? "Avbryt" : "+ Legg til bestilling"}
        </button>
      </div>

      {showAddOrder && (
        <form onSubmit={addOrder} className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 space-y-3">
          <p className="text-xs text-gray-400">For salg utenfor nettsiden, f.eks. privat via Vipps.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input value={newOrder.name} onChange={(e) => setNewOrder((f) => ({ ...f, name: e.target.value }))} className={ordInputCls} placeholder="Navn *" />
            <input value={newOrder.email} onChange={(e) => setNewOrder((f) => ({ ...f, email: e.target.value }))} className={ordInputCls} placeholder="E-post (valgfritt)" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <select value={newOrder.size} onChange={(e) => setNewOrder((f) => ({ ...f, size: e.target.value }))} className={ordInputCls}>
              {["S", "M", "L"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <input type="number" min="1" value={newOrder.quantity} onChange={(e) => setNewOrder((f) => ({ ...f, quantity: e.target.value }))} className={ordInputCls} placeholder="Antall par" />
            <select value={newOrder.status} onChange={(e) => setNewOrder((f) => ({ ...f, status: e.target.value }))} className={`${ordInputCls} col-span-2 sm:col-span-1`}>
              {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input value={newOrder.address} onChange={(e) => setNewOrder((f) => ({ ...f, address: e.target.value }))} className={`${ordInputCls} sm:col-span-1`} placeholder="Adresse (valgfritt)" />
            <input value={newOrder.postal_code} onChange={(e) => setNewOrder((f) => ({ ...f, postal_code: e.target.value }))} className={ordInputCls} placeholder="Postnr" />
            <input value={newOrder.city} onChange={(e) => setNewOrder((f) => ({ ...f, city: e.target.value }))} className={ordInputCls} placeholder="Sted" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Totalpris (kr) — la stå tomt for standardpris ({getTotal(parseInt(newOrder.quantity) || 1)} kr for {newOrder.quantity || 1} par)</label>
            <input type="number" min="0" value={newOrder.total_price} onChange={(e) => setNewOrder((f) => ({ ...f, total_price: e.target.value }))} className={ordInputCls} placeholder="Standardpris brukes hvis tomt" />
          </div>
          <textarea value={newOrder.notes} onChange={(e) => setNewOrder((f) => ({ ...f, notes: e.target.value }))} className={ordInputCls} rows={2} placeholder="Notater (f.eks. «Solgt privat via Vipps»)" />
          <button
            type="submit"
            disabled={orderSaving || !newOrder.name.trim() || !newOrder.quantity}
            className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
          >
            {orderSaving ? "Lagrer…" : "Legg til"}
          </button>
        </form>
      )}

      {/* Økonomi-kort */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Bekreftet inntekt", value: `${totalRevenue.toLocaleString("nb-NO")} kr`, sub: "betalt + sendt" },
          { label: "Siste 30 dager", value: `${revenueThisMonth.toLocaleString("nb-NO")} kr`, sub: "bekreftet" },
          { label: "Bestillinger (30d)", value: ordersThisMonth },
          { label: "Snitt per ordre", value: `${avgOrder.toLocaleString("nb-NO")} kr` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            {s.sub && <p className="text-xs text-gray-300 mt-0.5">{s.sub}</p>}
          </div>
        ))}
        {pendingRevenue > 0 && (
          <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-4">
            <p className="text-2xl font-bold text-yellow-700">{pendingRevenue.toLocaleString("nb-NO")} kr</p>
            <p className="text-xs text-yellow-600 mt-0.5">Ventende inntekt</p>
            <p className="text-xs text-yellow-400 mt-0.5">{pendingOrders.length} ordre venter Vipps</p>
          </div>
        )}
      </div>

      {/* Lager */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
        <p className="text-sm font-semibold text-gray-700 mb-4">Lagerbeholdning</p>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {Object.entries(stock).map(([size, { initial, sold, adjusted, remaining }]) => (
            <div key={size} className="text-center">
              <p className="text-xs text-gray-400 mb-1">Størrelse {size}</p>
              <p className={`text-2xl font-bold ${remaining <= 3 ? "text-red-500" : remaining <= 8 ? "text-orange-500" : "text-gray-900"}`}>
                {remaining}
              </p>
              <p className="text-xs text-gray-400 mt-1">igjen av {initial}</p>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${remaining <= 3 ? "bg-red-400" : remaining <= 8 ? "bg-orange-400" : "bg-green-400"}`}
                  style={{ width: `${Math.max(0, Math.round((remaining / initial) * 100))}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{sold} solgt{adjusted > 0 ? `, ${adjusted} annet` : ""}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Registrer uttak</p>
          <form onSubmit={addAdjustment} className="flex gap-2 flex-wrap items-end">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Størrelse</label>
              <select value={adjSize} onChange={(e) => setAdjSize(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900">
                {["S","M","L"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Antall</label>
              <input type="number" min="1" value={adjQty} onChange={(e) => setAdjQty(e.target.value)}
                placeholder="0" className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="flex-1 min-w-32">
              <label className="text-xs text-gray-400 block mb-1">Grunn (valgfritt)</label>
              <input type="text" value={adjNote} onChange={(e) => setAdjNote(e.target.value)}
                placeholder="Egen bruk, gave…" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <button type="submit" disabled={adjSaving || !adjQty}
              className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50">
              {adjSaving ? "…" : "Legg til"}
            </button>
          </form>

          {adjustments.length > 0 && (
            <div className="mt-3 space-y-1">
              {adjustments.map((a) => (
                <p key={a.id} className="text-xs text-gray-400">
                  − {Math.abs(a.quantity)} {a.size}{a.note ? ` · ${a.note}` : ""} <span className="text-gray-300">· {new Date(a.created_at).toLocaleDateString("nb-NO")}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterStatus === "all" ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          Alle ({orders.length})
        </button>
        {ORDER_STATUSES.map((s) => {
          const count = orders.filter((o) => o.status === s.value).length;
          return (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterStatus === s.value ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {loading && <p className="text-sm text-gray-400">Laster bestillinger…</p>}
      {!loading && filtered.length === 0 && <p className="text-sm text-gray-400">Ingen bestillinger.</p>}

      <div className="space-y-2">
        {filtered.map((o) => {
          const total = orderTotal(o);
          const isOpen = expanded === o.id;
          return (
            <div key={o.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <button
                className="w-full text-left px-5 py-4 flex items-center gap-4"
                onClick={() => setExpanded(isOpen ? null : o.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{o.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {o.quantity} par · str. {o.size} · {total} kr · {formatDate(o.created_at)}
                  </p>
                </div>
                <StatusBadge status={o.status} />
                <span className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-gray-400">E-post</span><br />{o.email ? <a href={`mailto:${o.email}`} className="text-blue-600 hover:underline">{o.email}</a> : <span className="text-gray-400">–</span>}</div>
                    <div><span className="text-gray-400">Størrelse</span><br />{o.size}</div>
                    <div><span className="text-gray-400">Adresse</span><br />{o.address ? `${o.address}, ${o.postal_code} ${o.city}` : <span className="text-gray-400">–</span>}</div>
                    <div><span className="text-gray-400">Total</span><br /><span className="font-medium text-gray-900">{total} kr</span></div>
                    {o.notes && <div className="col-span-2"><span className="text-gray-400">Notat</span><br />{o.notes}</div>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Oppdater status</p>
                    <div className="flex gap-2 flex-wrap">
                      {ORDER_STATUSES.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => updateStatus(o.id, s.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${o.status === s.value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const SORT_OPTIONS = [
  { value: "date-asc", label: "Dato (tidligst først)" },
  { value: "date-desc", label: "Dato (senest først)" },
  { value: "name-asc", label: "Navn (A–Å)" },
];

const FILTER_OPTIONS = [
  { value: "all", label: "Alle" },
  { value: "no-image", label: "Mangler bilde" },
  { value: "no-description", label: "Mangler info" },
  { value: "no-url", label: "Mangler URL" },
  { value: "has-status", label: "Har status" },
];

function Missing({ label }) {
  return (
    <span className="inline-block text-[10px] font-medium bg-red-50 text-red-500 rounded px-1.5 py-0.5 mr-1">
      {label}
    </span>
  );
}

function NewsletterTab({ adminPw }) {
  const [campaigns, setCampaigns] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("sent");

  const STATUS_TABS = [
    { value: "sent", label: "Sendt" },
    { value: "draft", label: "Utkast" },
    { value: "ready", label: "Klar" },
    { value: "outbox", label: "Planlagt" },
  ];

  useEffect(() => {
    fetch("/api/admin/subscribers", { headers: { "x-admin-password": adminPw } })
      .then((r) => r.json())
      .then((data) => setSubscribers(Array.isArray(data) ? data : []));
  }, [adminPw]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/newsletters?status=${activeStatus}`, {
      headers: { "x-admin-password": adminPw },
    })
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(data?.data || []);
        setLoading(false);
      });
  }, [adminPw, activeStatus]);

  function formatDate(str) {
    if (!str) return "–";
    return new Date(str).toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" });
  }

  function pct(n, total) {
    if (!total) return "–";
    return `${Math.round((n / total) * 100)} %`;
  }

  const now = new Date();
  const ago = (days) => new Date(now - days * 24 * 60 * 60 * 1000);
  const since = (days) => subscribers.filter((s) => new Date(s.created_at) >= ago(days)).length;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Nyhetsbrev</h2>
        <a
          href="https://app.mailerlite.com/campaigns"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          Åpne MailerLite →
        </a>
      </div>

      {/* Abonnenter */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Totalt", value: subscribers.length },
          { label: "Siste 7 dager", value: since(7) },
          { label: "Siste 30 dager", value: since(30) },
          { label: "Siste 90 dager", value: since(90) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Siste påmeldte */}
      {subscribers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
          <p className="text-sm font-semibold text-gray-700 mb-3">Siste påmeldte</p>
          <div className="space-y-2">
            {subscribers.slice(0, 10).map((s) => (
              <div key={s.email} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{s.email}</span>
                <span className="text-xs text-gray-400">
                  {new Date(s.created_at).toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            ))}
          </div>
          {subscribers.length > 10 && (
            <p className="text-xs text-gray-400 mt-3">{subscribers.length - 10} til ikke vist</p>
          )}
        </div>
      )}

      {/* Status-tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveStatus(t.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeStatus === t.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-400">Laster kampanjer…</p>}

      {!loading && campaigns.length === 0 && (
        <p className="text-sm text-gray-400">Ingen kampanjer her.</p>
      )}

      <div className="space-y-3">
        {campaigns.map((c) => {
          const stats = c.stats || {};
          const sent = stats.sent || 0;
          const opens = stats.opens_count || 0;
          const clicks = stats.clicks_count || 0;

          return (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 leading-snug">{c.name}</p>
                  {c.emails?.[0]?.subject && (
                    <p className="text-sm text-gray-500 mt-0.5">{c.emails[0].subject}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {activeStatus === "sent"
                      ? `Sendt ${formatDate(c.sent_at || c.scheduled_for)}`
                      : activeStatus === "outbox"
                      ? `Planlagt ${formatDate(c.scheduled_for)}`
                      : `Opprettet ${formatDate(c.created_at)}`}
                  </p>
                </div>
                <a
                  href={`https://app.mailerlite.com/campaigns/${c.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition"
                >
                  Åpne
                </a>
              </div>

              {activeStatus === "sent" && sent > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-gray-900">{sent.toLocaleString("nb-NO")}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Mottakere</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-gray-900">{pct(opens, sent)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Åpnet</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-gray-900">{pct(clicks, sent)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Klikket</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [adminPw, setAdminPw] = useState(null);
  const [tab, setTab] = useState("races");
  const [races, setRaces] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date-asc");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("adminPw");
    if (stored) setAdminPw(stored);
  }, []);

  useEffect(() => {
    if (!adminPw) return;
    setLoading(true);
    fetch("/api/admin/races", { headers: { "x-admin-password": adminPw } })
      .then((r) => r.json())
      .then((data) => {
        setRaces(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [adminPw]);

  function handleAuth(pw) {
    setAdminPw(pw);
  }

  const filtered = races
    .filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        r.name?.toLowerCase().includes(q) ||
        r.location?.toLowerCase().includes(q) ||
        r.region?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (filter === "no-image") return !r.image_url;
      if (filter === "no-description") return !r.description;
      if (filter === "no-url") return !r.url;
      if (filter === "has-status") return !!r.status_note;
      return true;
    })
    .sort((a, b) => {
      if (sort === "date-asc") return (a.date || "").localeCompare(b.date || "");
      if (sort === "date-desc") return (b.date || "").localeCompare(a.date || "");
      if (sort === "name-asc") return (a.name || "").localeCompare(b.name || "", "nb");
      return 0;
    });

  if (!adminPw) return <PasswordGate onAuth={handleAuth} />;

  return (
    <>
      <Head>
        <title>Admin – Langeløp.no</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -ml-2 text-gray-600"
          aria-label="Åpne meny"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <p className="text-sm font-semibold text-gray-900">Admin – Langeløp.no</p>
        <div className="w-6" />
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar */}
        <div
          className={`fixed md:static inset-y-0 left-0 z-40 w-80 max-w-[85vw] shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen md:sticky md:top-0 transform transition-transform duration-200 md:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 border-b border-gray-100 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Admin</p>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden p-1 text-gray-400 hover:text-gray-600"
                aria-label="Lukk meny"
              >
                ✕
              </button>
            </div>
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {[
                { value: "races", label: "Løp" },
                { value: "newsletters", label: "Brev" },
                { value: "shop", label: "Shop" },
                { value: "concepts", label: "Konsepter" },
                { value: "dev", label: "Dev" },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setTab(t.value); if (t.value !== "races") setMobileMenuOpen(false); }}
                  className={`flex-1 py-2 px-1 text-sm font-medium border-r border-gray-200 last:border-r-0 transition ${tab === t.value ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}
                >
                  {t.label}
                </button>
              ))}</div>
          </div>

          {tab === "races" && (
          <div className="p-4 border-b border-gray-100 space-y-2">
            <input
              type="text"
              placeholder="Søk på løp, sted eller fylke…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <p className="text-xs text-gray-400">{filtered.length} løp</p>
          </div>
          )}

          <div className="overflow-y-auto flex-1">
              {tab === "races" && loading && <p className="text-xs text-gray-400 p-4">Laster løp…</p>}
            {tab === "races" && filtered.map((race) => (
              <button
                key={race.slug}
                onClick={() => { setSelected(race); setMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${selected?.slug === race.slug ? "bg-gray-50 border-l-2 border-l-gray-900" : ""}`}
              >
                <p className="text-sm font-medium text-gray-900 leading-snug">{race.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {race.date} · {race.location}
                  {race.status_note && <span className="ml-1 text-orange-500">· {race.status_note}</span>}
                </p>
                <div className="mt-1">
                  {!race.image_url && <Missing label="bilde" />}
                  {!race.description && <Missing label="info" />}
                  {!race.url && <Missing label="URL" />}
                </div>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => { localStorage.removeItem("adminPw"); setAdminPw(null); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              Logg ut
            </button>
          </div>
        </div>

        {/* Hovedinnhold */}
        <div className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto">
          {tab === "newsletters" && <NewsletterTab adminPw={adminPw} />}
          {tab === "shop" && <ShopTab adminPw={adminPw} />}
          {tab === "concepts" && <ProductDevTab adminPw={adminPw} />}
          {tab === "dev" && <DevTab adminPw={adminPw} />}
          {tab === "races" && selected && (
            <div className="max-w-2xl">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden mb-4 text-sm text-blue-600 hover:underline"
              >
                ← Tilbake til løpsliste
              </button>
              <div className="mb-6">
                <a href={`/${selected.slug}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                  Se løpsside →
                </a>
                <h2 className="text-xl font-bold text-gray-900 mt-1">{selected.name}</h2>
                <p className="text-sm text-gray-400">{selected.slug}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <RaceEditor
                  key={selected.slug}
                  race={selected}
                  adminPw={adminPw}
                  onSaved={(updated) => {
                    setRaces((rs) => rs.map((r) => r.slug === updated.slug ? updated : r));
                    setSelected(updated);
                  }}
                />
              </div>
            </div>
          )}
          {tab === "races" && !selected && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p className="text-sm">Velg et løp fra listen til venstre</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
