import { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const PRODUKT_ID = "langelop-endurance-crew";

function Stars({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`text-2xl leading-none transition ${
            s <= (hover || value) ? "text-amber-400" : "text-gray-200"
          } ${onChange ? "cursor-pointer" : "cursor-default"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function SokkReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ navn: "", email: "", rating: 0, kommentar: "", image: null });
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase
      .from("produkt_reviews")
      .select("*")
      .eq("produkt_id", PRODUKT_ID)
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setReviews(data || []);
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.rating === 0) return setStatus("Velg en stjerneskår.");
    setSending(true);
    setStatus(null);

    let image_url = null;
    if (form.image) {
      const ext = form.image.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("review-images")
        .upload(path, form.image, { contentType: form.image.type });
      if (uploadError) {
        setSending(false);
        setStatus("Kunne ikke laste opp bildet. Prøv igjen.");
        return;
      }
      const { data } = supabase.storage.from("review-images").getPublicUrl(path);
      image_url = data.publicUrl;
    }

    const res = await fetch("/api/produkt-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        produkt_id: PRODUKT_ID,
        navn: form.navn,
        email: form.email,
        rating: form.rating,
        kommentar: form.kommentar,
        image_url,
      }),
    });
    const json = await res.json().catch(() => ({}));

    setSending(false);
    if (!res.ok) {
      setStatus(json.error || "Noe gikk galt. Prøv igjen.");
    } else {
      setStatus("success");
      setForm({ navn: "", email: "", rating: 0, kommentar: "", image: null });
    }
  }

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="mx-auto max-w-6xl mt-8 rounded-3xl bg-white p-6 md:p-10">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Anmeldelser</h2>

      {avg && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-3xl font-extrabold text-gray-900">{avg}</span>
          <Stars value={Math.round(avg)} />
          <span className="text-sm text-gray-400">({reviews.length} anmeldelse{reviews.length !== 1 ? "r" : ""})</span>
        </div>
      )}

      {/* Eksisterende anmeldelser */}
      {!loading && reviews.length === 0 && (
        <p className="text-sm text-gray-400 mb-6">Ingen anmeldelser enda. Vær den første!</p>
      )}
      {reviews.length > 0 && (
        <div className="space-y-4 mb-8">
          {reviews.map((r) => (
            <div key={r.id} className="border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">{r.navn}</span>
                <Stars value={r.rating} />
              </div>
              {r.kommentar && <p className="text-sm text-gray-600 leading-relaxed">{r.kommentar}</p>}
              {r.image_url && (
                <img
                  src={r.image_url}
                  alt="Anmeldelse"
                  className="mt-3 rounded-xl max-h-48 object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skriv anmeldelse */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Skriv en anmeldelse</h3>
        {status === "success" ? (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
            ✓ Takk! Anmeldelsen din blir publisert etter gjennomgang.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 max-w-lg">
            <div>
              <p className="text-xs text-gray-500 mb-1">Din vurdering *</p>
              <Stars value={form.rating} onChange={(v) => setForm(f => ({ ...f, rating: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition"
                placeholder="Navn *"
                value={form.navn}
                onChange={(e) => setForm(f => ({ ...f, navn: e.target.value }))}
                required
              />
              <input
                type="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition"
                placeholder="E-post *"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition"
              rows={3}
              placeholder="Del gjerne erfaringene dine — distanse, terreng, passform..."
              value={form.kommentar}
              onChange={(e) => setForm(f => ({ ...f, kommentar: e.target.value }))}
            />
            <div>
              <p className="text-xs text-gray-500 mb-1">Legg til bilde (valgfritt)</p>
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <span className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-gray-50 hover:bg-gray-100 transition text-gray-700">
                  {form.image ? form.image.name : "Velg bilde"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setForm(f => ({ ...f, image: e.target.files?.[0] || null }))}
                />
              </label>
            </div>
            {status && status !== "success" && (
              <p className="text-sm text-red-500">{status}</p>
            )}
            <button
              type="submit"
              disabled={sending}
              className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-60"
            >
              {sending ? "Sender..." : "Send anmeldelse →"}
            </button>
            <p className="text-xs text-gray-400">E-posten din vises ikke offentlig. Anmeldelsen publiseres etter gjennomgang.</p>
          </form>
        )}
      </div>
    </div>
  );
}

const SIZES = [
  { value: "S", label: "S (35–40)", soldOut: false, fewLeft: true },
  { value: "M", label: "M (40–45)", soldOut: true, fewLeft: false },
  { value: "L", label: "L (43–48)", soldOut: false, fewLeft: true },
];

function getPricing(qty) {
  if (qty <= 0) return { price: 0, shipping: 0 };
  if (qty === 1) return { price: 249, shipping: 69 };
  if (qty === 2) return { price: 449, shipping: 69 };
  // 3 par og over: 649 + 200 kr per par utover 3, gratis frakt
  return { price: 649 + (qty - 3) * 200, shipping: 0 };
}

const PRODUCT = {
  name: "Langeløp Endurance Crew",
  subtitle:
    "En slitesterk og komfortabel crewsokk utviklet for løpere med lange dager på beina. Forsterket i utsatte soner – laget for å holde gjennom både trening og konkurranse.",
  sizes: SIZES.map((s) => s.soldOut ? `${s.label} (utsolgt)` : s.label).join(" · "),
  batchInfo: "Første limited drop – batch merket «2026-001»",
  images: ["/shop/Sock-5.png", "/shop/Sock-1.png", "/shop/Sock-2.png", "/shop/Sock-3.png"],
  bullets: [
    "Stabil passform som sitter gjennom hele økta",
    "Forsterket slitestyrke i hæl og tå – tåler høy treningsmengde",
    "Bygget for lange konkurranser og mange timer på beina",
  ],
};

function OrderForm({ onSuccess }) {
  const [formState, setFormState] = useState({ status: "idle", message: "" });
  // sizeQty: { S: 0, M: 0, L: 0 }
  const [sizeQty, setSizeQty] = useState(
    Object.fromEntries(SIZES.map((s) => [s.value, 0]))
  );
  const [fields, setFields] = useState({
    name: "",
    email: "",
    address: "",
    postalCode: "",
    city: "",
  });

  const set = (key) => (e) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const changeQty = (size, delta) =>
    setSizeQty((prev) => ({ ...prev, [size]: Math.max(0, prev[size] + delta) }));

  const totalQty = Object.values(sizeQty).reduce((a, b) => a + b, 0);
  const pricing  = getPricing(totalQty);
  const total    = pricing.price + pricing.shipping;

  async function onSubmit(e) {
    e.preventDefault();
    if (totalQty === 0) {
      setFormState({ status: "error", message: "Velg minst ett par." });
      return;
    }

    setFormState({ status: "loading", message: "" });

    try {
      const sizeBreakdown = SIZES
        .filter((s) => sizeQty[s.value] > 0)
        .map((s) => `${s.value}×${sizeQty[s.value]}`)
        .join(", ");

      const r = await fetch("/api/order-sock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          size: sizeBreakdown,
          quantity: totalQty,
        }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Noe gikk galt");

      setFormState({ status: "success", message: "" });
      onSuccess?.();
    } catch (err) {
      setFormState({
        status: "error",
        message: err?.message || "Noe gikk galt",
      });
    }
  }

  if (formState.status === "success") {
    return (
      <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-900">
        <p className="font-semibold text-base">Bestilling mottatt!</p>
        <p className="mt-1 text-sm leading-6">
          Du mottar snart en Vipps-forespørsel på {total} kr. Sjekk e-posten
          din for ordrebekreftelse.
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900";

  // Hva du ville betalt til enkeltpris + frakt, minus faktisk pris + frakt
  const savings = totalQty > 0 ? (totalQty * 249 + 69) - (pricing.price + pricing.shipping) : 0;
  const nextTier = totalQty === 1 ? { qty: 2, save: 2 * 249 - 449 }
                 : totalQty === 2 ? { qty: 3, save: 3 * 249 - 649 }
                 : null;

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-3">

      {/* Pristabell */}
      <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
        {[
          { label: "1 par", perPair: "249 kr", total: null, freeShipping: false, active: totalQty === 1 },
          { label: "2 par", perPair: "225 kr/par", total: null, freeShipping: false, active: totalQty === 2 },
          { label: "3+ par", perPair: "216 kr/par", total: null, freeShipping: true, active: totalQty >= 3 },
        ].map((tier) => (
          <div
            key={tier.label}
            className={`rounded-xl px-2 py-2.5 border transition ${
              tier.active
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            <p className="text-xs font-semibold">{tier.label}</p>
            <p className={`mt-0.5 text-base font-bold ${tier.active ? "text-white" : "text-gray-900"}`}>
              {tier.perPair}
            </p>
            {tier.freeShipping && (
              <p className={`mt-0.5 text-[11px] font-semibold ${tier.active ? "text-green-400" : "text-green-600"}`}>
                ✓ gratis frakt
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Størrelse og antall per størrelse */}
      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {SIZES.map((s) => (
          <div
            key={s.value}
            className={`flex items-center justify-between px-4 py-3 ${s.soldOut ? "bg-gray-50" : "bg-white"}`}
          >
            <span className={`text-sm font-medium ${s.soldOut ? "text-gray-400" : "text-gray-900"}`}>
              {s.label}
              {s.soldOut && <span className="ml-2 text-xs font-normal text-gray-400">utsolgt</span>}
              {!s.soldOut && s.fewLeft && <span className="ml-2 text-xs font-normal text-amber-600">få par igjen</span>}
            </span>

            {s.soldOut ? (
              <span className="text-xs text-gray-400">–</span>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => changeQty(s.value, -1)}
                  disabled={sizeQty[s.value] === 0}
                  className="w-8 h-8 rounded-full border border-gray-300 text-gray-700 flex items-center justify-center text-lg leading-none hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  −
                </button>
                <span className="w-4 text-center text-sm font-semibold text-gray-900">
                  {sizeQty[s.value]}
                </span>
                <button
                  type="button"
                  onClick={() => changeQty(s.value, 1)}
                  className="w-8 h-8 rounded-full border border-gray-300 text-gray-700 flex items-center justify-center text-lg leading-none hover:border-gray-500 transition"
                >
                  +
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hint om neste rabattnivå */}
      {nextTier && totalQty > 0 && (
        <p className="text-xs text-center text-blue-700 bg-blue-50 rounded-xl px-3 py-2">
          Legg til {nextTier.qty - totalQty} par til og spar {nextTier.save} kr ekstra
        </p>
      )}

      {/* Prisoppsummering – kun når noe er valgt */}
      {totalQty > 0 && (
        <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 space-y-1">
          <div className="flex justify-between">
            <span>{totalQty} par</span>
            <span>{pricing.price} kr</span>
          </div>
          {savings > 0 && (
            <div className="flex justify-between text-green-700 font-medium">
              <span>Du sparer</span>
              <span>−{savings} kr</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Frakt</span>
            <span>
              {pricing.shipping === 0 ? (
                <span className="text-green-700 font-medium">Gratis</span>
              ) : (
                `${pricing.shipping} kr`
              )}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1 mt-1">
            <span>Totalt</span>
            <span>{total} kr</span>
          </div>
        </div>
      )}

      {/* Navn og e-post */}
      <input
        type="text"
        required
        placeholder="Fullt navn *"
        value={fields.name}
        onChange={set("name")}
        className={inputCls}
      />
      <input
        type="email"
        required
        placeholder="E-post *"
        value={fields.email}
        onChange={set("email")}
        className={inputCls}
      />

      {/* Adresse */}
      <input
        type="text"
        required
        placeholder="Gateadresse *"
        value={fields.address}
        onChange={set("address")}
        className={inputCls}
      />
      <div className="flex gap-2">
        <input
          type="text"
          required
          placeholder="Postnr *"
          value={fields.postalCode}
          onChange={set("postalCode")}
          className="w-28 shrink-0 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
          maxLength={4}
          inputMode="numeric"
        />
        <input
          type="text"
          required
          placeholder="Sted *"
          value={fields.city}
          onChange={set("city")}
          className="flex-1 min-w-0 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {formState.status === "error" && (
        <p className="text-sm text-red-600">{formState.message}</p>
      )}

      <button
        type="submit"
        disabled={formState.status === "loading" || totalQty === 0}
        className="w-full rounded-2xl bg-gray-900 py-3.5 font-semibold text-white shadow-sm transition hover:scale-[1.02] disabled:opacity-60"
      >
        {formState.status === "loading"
          ? "Sender bestilling…"
          : totalQty === 0
          ? "Velg størrelse for å bestille"
          : `Bestill – betal ${total} kr via Vipps`}
      </button>

      <p className="text-xs leading-5 text-gray-500">
        Du mottar en Vipps-forespørsel etter at bestillingen er registrert.
      </p>
    </form>
  );
}

export default function Shop() {
  const [activeImage, setActiveImage] = useState(0);
  const [mobileCtaOpen, setMobileCtaOpen] = useState(false);

  function showPrevImage() {
    setActiveImage((prev) =>
      prev === 0 ? PRODUCT.images.length - 1 : prev - 1
    );
  }

  function showNextImage() {
    setActiveImage((prev) =>
      prev === PRODUCT.images.length - 1 ? 0 : prev + 1
    );
  }

  function handleMobileSuccess() {
    setTimeout(() => setMobileCtaOpen(false), 2500);
  }

  const seoTitle = "Løpesokker – Langeløp Endurance Crew | langelop.no";
  const seoDesc = "Kjøp Langeløp Endurance Crew – slitesterke, komfortable løpesokker laget for lange dager på beina. Fra 249 kr per par, levering med Vipps.";
  const seoImage = `https://www.langelop.no${PRODUCT.images[0]}`;
  const inStock = SIZES.some((s) => !s.soldOut);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: PRODUCT.name,
    description: PRODUCT.subtitle,
    image: PRODUCT.images.map((img) => `https://www.langelop.no${img}`),
    brand: { "@type": "Brand", name: "Langeløp" },
    offers: {
      "@type": "Offer",
      url: "https://www.langelop.no/shop",
      priceCurrency: "NOK",
      price: "249",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 pt-14 pb-24 md:pb-14">
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href="https://www.langelop.no/shop" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:url" content="https://www.langelop.no/shop" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={seoImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDesc} />
        <meta name="twitter:image" content={seoImage} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      </Head>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-green-700">
            Limited drop
          </p>

          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
                {PRODUCT.name} – løpesokker for lange dager
              </h1>
              <p className="mt-2 max-w-2xl text-gray-600">
                Håndplukkede løpesokker for ultraløpere. Første limited drop
                fra Langeløp – bestill nå og betal enkelt via Vipps.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:items-start">

            {/* Venstre: bilde + produktinfo */}
            <div>
              {/* Bildegalleri */}
              <div className="relative aspect-[1/1] w-full overflow-hidden rounded-3xl bg-[#f1f0ed]">
                <Image
                  src={PRODUCT.images[activeImage]}
                  alt={`Langeløp Endurance Crew sokk ${activeImage + 1}`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />

                {PRODUCT.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPrevImage}
                      className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-sm ring-1 ring-black/5 transition hover:scale-105"
                      aria-label="Forrige bilde"
                    >
                      <ChevronLeft size={18} strokeWidth={2.2} />
                    </button>

                    <button
                      type="button"
                      onClick={showNextImage}
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-sm ring-1 ring-black/5 transition hover:scale-105"
                      aria-label="Neste bilde"
                    >
                      <ChevronRight size={18} strokeWidth={2.2} />
                    </button>
                  </>
                )}
              </div>

              {PRODUCT.images.length > 1 && (
                <div className="mt-6 flex justify-center gap-4">
                  {PRODUCT.images.map((src, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#f1f0ed] transition-all ${
                        activeImage === index
                          ? "scale-105 ring-2 ring-gray-900 shadow-md"
                          : "opacity-70 hover:scale-105 hover:opacity-100"
                      }`}
                      aria-label={`Vis bilde ${index + 1}`}
                    >
                      <Image
                        src={src}
                        alt={`Miniatyrbilde ${index + 1}`}
                        fill
                        loading="lazy"
                        sizes="80px"
                        className="object-contain scale-105"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Produktinfo under bildet */}
              <div className="mt-8 space-y-5">
                <div>
                  <p className="text-base leading-7 text-gray-600">
                    {PRODUCT.subtitle}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">
                    Bygget for lange dager på beina
                  </p>
                  <ul className="space-y-3 text-gray-700">
                    {PRODUCT.bullets.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Størrelser:</span>{" "}
                  {PRODUCT.sizes}
                </div>

                <p className="text-xs text-gray-500">
                  Utviklet og produsert i samarbeid med Sockeloen.
                </p>
              </div>
            </div>

            {/* Høyre: bestillingsskjema (kun desktop) */}
            <aside className="hidden lg:block lg:sticky lg:top-8 lg:self-start">
              <p className="text-sm font-bold uppercase tracking-widest text-gray-900">
                Langeløp Endurance Crew
              </p>

              <p className="mt-2 text-2xl font-extrabold text-gray-900">
                fra 249 kr
              </p>

              <p className="mt-4 text-sm text-gray-500">{PRODUCT.batchInfo}</p>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-600">
                  Du mottar en Vipps-forespørsel etter at bestillingen er registrert.
                </p>
                <OrderForm />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <SokkReviews />

      {/* Mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 md:hidden backdrop-blur-md">
        <div className="mx-auto max-w-md">
          {!mobileCtaOpen ? (
            <div className="p-3">
              <button
                type="button"
                onClick={() => setMobileCtaOpen(true)}
                className="w-full rounded-2xl bg-gray-900 py-4 font-semibold text-white"
              >
                Bestill
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-4 shadow-xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 mb-1">
                <p className="text-sm font-bold uppercase tracking-widest text-gray-900">
                  Bestill
                </p>

                <button
                  type="button"
                  onClick={() => setMobileCtaOpen(false)}
                  className="shrink-0 p-2 text-gray-600 hover:bg-gray-100 transition rounded-full"
                  aria-label="Lukk"
                >
                  <X size={18} />
                </button>
              </div>

              <OrderForm onSuccess={handleMobileSuccess} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Shop.hideFooter = true;
