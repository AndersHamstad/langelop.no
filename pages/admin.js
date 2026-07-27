import { useState, useEffect, useRef } from "react";
import Head from "next/head";

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
      sessionStorage.setItem("adminPw", pw);
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Navn</label>
          <input value={form.name} onChange={set("name")} className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Dato</label>
          <input type="date" value={form.date} onChange={set("date")} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Sted</label>
          <input value={form.location} onChange={set("location")} className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Region/fylke</label>
          <input value={form.region} onChange={set("region")} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
        <div className="flex gap-2 items-start">
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
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch("/api/admin/orders", { headers: { "x-admin-password": adminPw } })
      .then((r) => r.json())
      .then((data) => { setOrders(Array.isArray(data) ? data : []); setLoading(false); });
  }, [adminPw]);

  async function updateStatus(id, status) {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": adminPw },
      body: JSON.stringify({ id, status }),
    });
    setOrders((os) => os.map((o) => o.id === id ? { ...o, status } : o));
  }

  function formatDate(str) {
    if (!str) return "–";
    return new Date(str).toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const totalRevenue = orders.reduce((s, o) => s + getTotal(o.quantity), 0);
  const revenueThisMonth = orders
    .filter((o) => new Date(o.created_at) >= thirtyDaysAgo)
    .reduce((s, o) => s + getTotal(o.quantity), 0);
  const ordersThisMonth = orders.filter((o) => new Date(o.created_at) >= thirtyDaysAgo).length;
  const avgOrder = orders.length ? Math.round(totalRevenue / orders.length) : 0;

  const filtered = orders.filter((o) => filterStatus === "all" || o.status === filterStatus);

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Sokkebestillinger</h2>

      {/* Økonomi-kort */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total inntekt", value: `${totalRevenue.toLocaleString("nb-NO")} kr` },
          { label: "Siste 30 dager", value: `${revenueThisMonth.toLocaleString("nb-NO")} kr` },
          { label: "Bestillinger (30d)", value: ordersThisMonth },
          { label: "Snitt per ordre", value: `${avgOrder.toLocaleString("nb-NO")} kr` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
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
          const total = getTotal(o.quantity);
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
                    <div><span className="text-gray-400">E-post</span><br /><a href={`mailto:${o.email}`} className="text-blue-600 hover:underline">{o.email}</a></div>
                    <div><span className="text-gray-400">Størrelse</span><br />{o.size}</div>
                    <div><span className="text-gray-400">Adresse</span><br />{o.address}, {o.postal_code} {o.city}</div>
                    <div><span className="text-gray-400">Total</span><br className="font-medium text-gray-900" />{total} kr</div>
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
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("sent");

  const STATUS_TABS = [
    { value: "sent", label: "Sendt" },
    { value: "draft", label: "Utkast" },
    { value: "ready", label: "Klar" },
    { value: "outbox", label: "Planlagt" },
  ];

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

  useEffect(() => {
    const stored = sessionStorage.getItem("adminPw");
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
      </Head>
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar */}
        <div className="w-80 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
          <div className="p-4 border-b border-gray-100 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Admin</p>
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {[
                { value: "races", label: "Løp" },
                { value: "newsletters", label: "Brev" },
                { value: "shop", label: "Shop" },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={`flex-1 py-2 text-sm font-medium transition ${tab === t.value ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}
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
                onClick={() => setSelected(race)}
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
              onClick={() => { sessionStorage.removeItem("adminPw"); setAdminPw(null); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              Logg ut
            </button>
          </div>
        </div>

        {/* Hovedinnhold */}
        <div className="flex-1 p-8 overflow-y-auto">
          {tab === "newsletters" && <NewsletterTab adminPw={adminPw} />}
          {tab === "shop" && <ShopTab adminPw={adminPw} />}
          {tab === "races" && selected && (
            <div className="max-w-2xl">
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
