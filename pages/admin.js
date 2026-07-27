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

export default function AdminPage() {
  const [adminPw, setAdminPw] = useState(null);
  const [races, setRaces] = useState([]);
  const [search, setSearch] = useState("");
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

  const filtered = races.filter((r) =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.location?.toLowerCase().includes(search.toLowerCase()) ||
    r.region?.toLowerCase().includes(search.toLowerCase())
  );

  if (!adminPw) return <PasswordGate onAuth={handleAuth} />;

  return (
    <>
      <Head>
        <title>Admin – Langeløp.no</title>
      </Head>
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar */}
        <div className="w-80 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Admin</p>
            <input
              type="text"
              placeholder="Søk på løp, sted eller fylke…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {loading && <p className="text-xs text-gray-400 p-4">Laster løp…</p>}
            {filtered.map((race) => (
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

        {/* Editor */}
        <div className="flex-1 p-8 overflow-y-auto">
          {selected ? (
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
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p className="text-sm">Velg et løp fra listen til venstre</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
