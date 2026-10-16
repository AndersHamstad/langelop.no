import { createClient } from "@supabase/supabase-js";

// Vercel Hobby defaulter til 10s per funksjon, for kort til å generere
// beskrivelser for flere løp i ett Gemini-kall. Utvider budsjettet.
export const config = { maxDuration: 60 };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PROMPT = `Du skriver korte, saklige beskrivelser av norske ultraløp til en løpskalender-nettside.

Du får en liste med løp som JSON-array, med feltene: slug, name, location, region, distance (array med distanser), type, date.

Svar KUN med gyldig JSON, ingen markdown-fences, ingen forklaringstekst. Bruk nøyaktig denne strukturen:

{
  "descriptions": [
    { "slug": "string", "description": "string — 2-4 setninger på norsk" }
  ]
}

Regler:
- Bruk KUN fakta du får oppgitt (navn, sted, region, distanse, type, dato). IKKE finn opp detaljer om løype, terreng, høydemeter, historie eller vanskelighetsgrad du ikke har grunnlag for — det er bedre å holde det generelt enn å dikte opp noe som kan være feil.
- Skriv naturlig og variert, ikke som en mal som gjentas ordrett for hvert løp.
- Nevn distanse(r) og sted/region. Du kan nevne løpstype (f.eks. backyard ultra-format) generisk hvis det er naturlig, men ikke påstå spesifikke fakta om akkurat dette løpets bane.
- Ikke nevn dato eksplisitt i teksten (det vises allerede andre steder på siden) med mindre det er naturlig (f.eks. årstid).
- Ta med alle løpene fra input i samme rekkefølge.`;

function timeoutFetch(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function callGemini(model, userMessage) {
  const geminiRes = await timeoutFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
    18000
  );
  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    const err = new Error(errText);
    err.status = geminiRes.status;
    throw err;
  }
  return geminiRes.json();
}

const MODELS = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.0-flash"];
const RETRYABLE = [404, 503];

async function generateBatch(races) {
  const userMessage = `Løp:\n${JSON.stringify(
    races.map((r) => ({
      slug: r.slug,
      name: r.name,
      location: r.location,
      region: r.region,
      distance: r.distance,
      type: r.type,
      date: r.date,
    }))
  )}`;

  let lastErr;
  for (let i = 0; i < MODELS.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 800));
    try {
      const json = await callGemini(MODELS[i], userMessage);
      let raw = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      raw = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(raw);
      return parsed.descriptions || [];
    } catch (err) {
      lastErr = err;
      if (!RETRYABLE.includes(err.status)) throw err;
    }
  }
  throw lastErr;
}

export default async function handler(req, res) {
  if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Ikke autorisert" });
  }
  if (req.method !== "POST") return res.status(405).end();

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY mangler i miljøvariabler" });
  }

  const { slugs } = req.body;
  if (!Array.isArray(slugs) || slugs.length === 0) {
    return res.status(400).json({ error: "slugs (array) påkrevd" });
  }
  if (slugs.length > 10) {
    return res.status(400).json({ error: "Maks 10 slugs per kall (batches håndteres av admin-UI-et)" });
  }

  const { data: races, error } = await supabase
    .from("races")
    .select("slug, name, location, region, distance, type, date")
    .in("slug", slugs);
  if (error) return res.status(500).json({ error: error.message });

  try {
    const descriptions = await generateBatch(races);
    return res.status(200).json({ ok: true, descriptions, failedSlugs: [] });
  } catch (err) {
    return res.status(502).json({ error: "Gemini API feilet: " + err.message, failedSlugs: slugs });
  }
}
