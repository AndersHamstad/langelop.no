import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PROMPT = `Du strukturerer oppdateringer om norske ultraløp (resultater, nye løp, påmelding, korrigeringer) fra en fritekst-rapport til strengt JSON.

Du får en liste over eksisterende løp i databasen (slug, navn, dato) som kontekst for matching.

Svar KUN med gyldig JSON, ingen markdown-fences, ingen forklaringstekst. Bruk nøyaktig denne strukturen:

{
  "results": [
    {
      "race_name": "string – navnet slik det står i teksten",
      "matched_slug": "string eller null – slug fra løpslisten hvis du er rimelig sikker på match, ellers null",
      "date": "YYYY-MM-DD",
      "distance_km": number eller null,
      "winners": [
        { "name": "string", "time": "H:MM:SS", "gender": "M eller K", "position": number }
      ],
      "source_url": "string eller null"
    }
  ],
  "race_updates": [
    {
      "race_name": "string",
      "matched_slug": "string eller null",
      "summary": "kort norsk oppsummering av hva som er endret/nytt, f.eks. 'Distanse korrigert fra 57 til 59 km'",
      "fields": { "description": "string" } ,
      "source_url": "string eller null"
    }
  ],
  "new_races": [
    {
      "race_name": "string",
      "date": "YYYY-MM-DD eller null hvis ukjent",
      "location": "string eller null",
      "region": "string eller null",
      "url": "string eller null",
      "summary": "kort norsk oppsummering, f.eks. 'Påmelding åpner 1. september 2026'",
      "source_url": "string eller null"
    }
  ]
}

Regler:
- "results" er kun for løp som allerede er avholdt med et faktisk resultat (vinnertider).
- "race_updates" er korrigeringer/tillegg til løp som allerede finnes i databaselisten (matched_slug skal helst settes).
- "new_races" er løp som IKKE finnes i databaselisten (fremtidige utgaver, påmeldingsåpning for et løp uten treff i listen).
- Vær konservativ med matched_slug — sett null hvis du er usikker, heller enn å gjette feil.
- Tider skal normaliseres til format H:MM:SS (f.eks. "11.33.14" -> "11:33:14").
- Fjern tomme lister hvis ingen elementer av den typen finnes.`;

export default async function handler(req, res) {
  if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Ikke autorisert" });
  }
  if (req.method !== "POST") return res.status(405).end();

  const { text } = req.body;
  if (!text || text.trim().length < 20) {
    return res.status(400).json({ error: "Lim inn tekst fra oppdateringen først" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY mangler i miljøvariabler" });
  }

  const { data: races } = await supabase
    .from("races")
    .select("slug, name, date")
    .order("date", { ascending: false })
    .limit(500);

  const raceList = (races || [])
    .map((r) => `${r.slug} | ${r.name} | ${r.date}`)
    .join("\n");

  const userMessage = `Eksisterende løp i databasen (slug | navn | dato):\n${raceList}\n\n---\n\nOppdateringstekst å strukturere:\n\n${text}`;

  async function callGemini() {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );
    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      const err = new Error(errText);
      err.status = geminiRes.status;
      throw err;
    }
    return geminiRes.json();
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let aiResponse;
  try {
    let json;
    const delays = [0, 1500, 4000]; // 3 forsøk: umiddelbart, så 1.5s, så 4s
    let lastErr;
    for (const delay of delays) {
      if (delay) await sleep(delay);
      try {
        json = await callGemini();
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        if (err.status !== 503) break; // bare retry ved "overbelastet"
      }
    }
    if (lastErr) {
      return res.status(502).json({ error: `Gemini API feilet (etter ${delays.length} forsøk): ${String(lastErr.message).slice(0, 300)}` });
    }

    let raw = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    raw = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    aiResponse = JSON.parse(raw);
  } catch (err) {
    return res.status(500).json({ error: "Klarte ikke tolke svaret fra Gemini: " + err.message });
  }

  const rows = [];

  for (const r of aiResponse.results || []) {
    rows.push({
      type: "result",
      race_slug: r.matched_slug || null,
      race_name: r.race_name,
      summary:
        `Resultat: ${(r.winners || []).map((w) => `${w.name} (${w.time})`).join(", ")}`,
      fields: { date: r.date, distance_km: r.distance_km, winners: r.winners || [] },
      source_url: r.source_url || null,
      raw_snippet: text.slice(0, 2000),
    });
  }

  for (const u of aiResponse.race_updates || []) {
    rows.push({
      type: "race_update",
      race_slug: u.matched_slug || null,
      race_name: u.race_name,
      summary: u.summary,
      fields: u.fields || {},
      source_url: u.source_url || null,
      raw_snippet: text.slice(0, 2000),
    });
  }

  for (const n of aiResponse.new_races || []) {
    rows.push({
      type: "new_race",
      race_slug: null,
      race_name: n.race_name,
      summary: n.summary,
      fields: {
        date: n.date,
        location: n.location,
        region: n.region,
        url: n.url,
      },
      source_url: n.source_url || null,
      raw_snippet: text.slice(0, 2000),
    });
  }

  if (rows.length === 0) {
    return res.status(200).json({ ok: true, count: 0 });
  }

  const { error } = await supabase.from("digest_suggestions").insert(rows);
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ ok: true, count: rows.length });
}
