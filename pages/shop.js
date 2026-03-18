import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

// ✅ FIX 3: Én SIZES-array brukt overalt
const SIZES = [
  { value: "S", label: "S (35–40)" },
  { value: "M", label: "M (40–45)" },
  { value: "L", label: "L (43–48)" },
];

const PRODUCT = {
  name: "Langeløp Endurance Crew",
  subtitle:
    "En slitesterk og komfortabel crewsokk utviklet for løpere med lange dager på beina. Forsterket i utsatte soner – laget for å holde gjennom både trening og konkurranse.",
  // ✅ FIX 3: Generert fra SIZES-array, ikke hardkodet streng
  sizes: SIZES.map((s) => s.label).join(" · "),
  statusChips: ["Under produksjon", "Tidlig april 2026"],
  batchInfo: "Første limited drop – batch merket «2026-001»",
  images: ["/shop/Sock-1.png", "/shop/Sock-2.png", "/shop/Sock-3.png"],
  bullets: [
    "Stabil passform som sitter gjennom hele økta",
    "Forsterket slitestyrke i hæl og tå – tåler høy treningsmengde",
    "Bygget for lange konkurranser og mange timer på beina",
  ],
};

// ✅ FIX 1: Skjema trukket ut som egen komponent – fjerner all duplisering
function NotifyForm({ onSuccess }) {
  // ✅ FIX 2: status og message samlet i ett state-objekt
  const [formState, setFormState] = useState({ status: "idle", message: "" });
  const [email, setEmail] = useState("");
  const [sizeInterest, setSizeInterest] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setFormState({ status: "loading", message: "" });

    try {
      const r = await fetch("/api/subscribe-sock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, sizeInterest: sizeInterest || null }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Noe gikk galt");

      setFormState({ status: "success", message: "" });
      setEmail("");
      setSizeInterest("");
      onSuccess?.(); // ✅ FIX 5: Varsler parent om suksess (f.eks. for å lukke mobil-drawer)
    } catch (err) {
      setFormState({
        status: "error",
        message: err?.message || "Noe gikk galt",
      });
    }
  }

  if (formState.status === "success") {
    return (
      <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-900">
        <p className="font-semibold">Du er på lista.</p>
        <p className="mt-1 text-sm">Vi sender deg beskjed når sokken slippes.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-post"
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
      />

      {/* ✅ FIX 3: Options generert fra SIZES-array */}
      <select
        value={sizeInterest}
        onChange={(e) => setSizeInterest(e.target.value)}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"
      >
        <option value="">Ønsket størrelse (valgfritt)</option>
        {SIZES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {formState.status === "error" && (
        <p className="text-sm text-red-600">{formState.message}</p>
      )}

      <button
        type="submit"
        disabled={formState.status === "loading"}
        className="w-full rounded-2xl bg-gray-900 py-3.5 font-semibold text-white shadow-sm transition hover:scale-[1.02] disabled:opacity-60"
      >
        {formState.status === "loading" ? "Registrerer…" : "Bli varslet"}
      </button>

      <p className="text-xs leading-5 text-gray-500">
        Ved påmelding godtar du å motta e-post fra Langeløp.no. Du kan melde
        deg av når som helst.
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

  // ✅ FIX 5: Lukker mobil-drawer automatisk ved suksess
  function handleMobileSuccess() {
    setTimeout(() => setMobileCtaOpen(false), 1800);
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 pt-14 pb-20 md:pb-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-green-700">
            Limited drop
          </p>

          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
                {PRODUCT.name}
              </h1>
              <p className="mt-2 max-w-2xl text-gray-600">
                Første limited drop fra Langeløp. Meld deg på ventelisten og få
                tidlig tilgang når salget åpner.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.8fr] lg:gap-10">
            {/* Image gallery */}
            <section>
              <div className="mt-4">
                <div className="relative aspect-[1/1] w-full overflow-hidden rounded-3xl bg-[#f1f0ed]">
                  <Image
                    src={PRODUCT.images[activeImage]}
                    alt={`Langeløp Endurance Crew sokk ${activeImage + 1}`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
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

                {/* ✅ FIX 8: key={index} i stedet for key={src} */}
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
                          loading="lazy" // ✅ FIX 10: Eksplisitt lazy loading
                          sizes="80px"
                          className="object-contain scale-105"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Product info + desktop form */}
            <aside className="lg:sticky lg:top-24">
              {/* ✅ FIX 7: text-s → text-sm (ugyldig Tailwind-klasse) */}
              <p className="text-sm font-bold uppercase tracking-widest text-gray-900">
                Langeløp Endurance Crew
              </p>

              <p className="mt-3 text-base leading-7 text-gray-600">
                {PRODUCT.subtitle}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {PRODUCT.statusChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                  >
                    {chip}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-sm text-gray-500">{PRODUCT.batchInfo}</p>

              <p className="mt-6 text-xs font-bold uppercase tracking-widest text-gray-600">
                Bygget for lange dager på beina
              </p>

              <ul className="mt-4 space-y-3 text-gray-700">
                {PRODUCT.bullets.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 text-sm text-gray-600">
                <span className="font-semibold text-gray-900">Størrelser:</span>{" "}
                {PRODUCT.sizes}
              </div>

              <p className="mt-5 text-xs text-gray-500">
                Utviklet og produsert i samarbeid med Sockeloen.
              </p>

              <div className="mt-10 hidden border-t border-gray-900 pt-8 md:block">
                {/* ✅ FIX 7: text-s → text-sm */}
                <p className="text-sm font-bold uppercase tracking-widest text-gray-900">
                  Sikre deg tidlig tilgang
                </p>

                <p className="mt-2 text-gray-600">
                  Ventelisten får beskjed først når sokken slippes. Begrenset
                  antall i første batch.
                </p>

                <p className="mt-3 text-sm font-medium text-gray-900">
                  Første batch fylles opp – rundt 40 % er allerede reservert.
                </p>

                {/* ✅ FIX 1: Delt NotifyForm-komponent */}
                <NotifyForm />
              </div>
            </aside>
          </div>
        </div>
      </div>

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
                Bli varslet
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-4 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-900">
                    Sikre deg tidlig tilgang
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    Første batch fylles opp – rundt 40 % er allerede reservert.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileCtaOpen(false)}
                  className="shrink-0 p-2 text-gray-600 hover:bg-gray-100 transition rounded-full"
                  aria-label="Lukk"
                >
                  <X size={18} />
                </button>
              </div>

              {/* ✅ FIX 1 + 5: Delt komponent, lukker drawer ved suksess */}
              <NotifyForm onSuccess={handleMobileSuccess} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Shop.hideFooter = true;