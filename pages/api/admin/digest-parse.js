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
        { "name": "string", "time": "H:MM:SS", "gender": "M eller K", "position": number eller null }
      ],
      "source_url": "string eller null"
    }
  ],
  "race_updates": [
    {
      "race_name": "string",
      "matched_slug": "string eller null",
      "summary": "kort norsk oppsummering av hva som er endret/nytt, f.eks. 'Distanse korrigert fra 57 til 59 km' eller 'Påmelding åpner 1. september 2026 for 2027-utgaven'",
      "fields": {
        "date": "YYYY-MM-DD — SKAL settes til datoen for utgaven nyheten gjelder (f.eks. 2027-utgaven), selv om nyheten primært handler om noe annet (status, påmelding). Utelat KUN hvis teksten ikke nevner noen dato for løpet i det hele tatt.",
        "status_note": "en av: '', 'Utsolgt', 'Få plasser igjen', 'Avlyst', 'Utsatt' — kun hvis relevant, ellers utelatt",
        "registration_opens_at": "YYYY-MM-DD — sett denne når teksten sier 'påmelding åpner [dato]', ellers utelatt",
        "description": "string, kun for annen fritekst-info (f.eks. ny distanse lagt til) som ikke passer i et annet felt, ellers utelatt"
      },
      "source_url": "string eller null"
    }
  ],
  "new_races": [
    {
      "race_name": "string",
      "matched_slug": "string eller null — sett KUN til null hvis løpet garantert ikke finnes i løpslisten",
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
- VIKTIG om matching: hvert løp i databasen har ÉN rad som gjenbrukes år etter år — datoen oppdateres til neste utgave. Et løp som allerede finnes i løpslisten skal derfor ALLTID havne i "race_updates" (med oppdatert dato/status), ALDRI i "new_races" — selv om teksten omtaler en fremtidig utgave, påmeldingsåpning eller "2027-utgave". "new_races" er UTELUKKENDE for løp som garantert ikke finnes i løpslisten i det hele tatt.
- Sjekk race_name grundig mot samtlige rader i løpslisten — se bort fra små forskjeller i skrivemåte, mellomrom, år eller om distanse er inkludert i navnet. Match på beste skjønn, men sett matched_slug til null hvis du er reelt usikker.
- "Utsolgt etter X dager/påmeldte" -> sett fields.status_note = "Utsolgt". "Påmelding åpner [dato]" -> sett fields.registration_opens_at til datoen, ikke status_note.
- Når en nyhet gjelder en spesifikk fremtidig utgave (f.eks. "2027-utgaven"), skal fields.date ALLTID settes til den utgavens dato — selv om selve nyheten handler om status/påmelding, ikke datoen. Løpet skal ikke få en oppdatert status uten at datoen også følger med til samme utgave.
- VIKTIG om winners.position: dette skal være løperens FAKTISKE totalplassering i løpet (blant alle deltakere, uansett kjønn), IKKE bare "vinner av sin kjønnsklasse". Sett position KUN når teksten eksplisitt oppgir et tall (f.eks. "nr. 6 totalt", "3. plass totalt"), eller når personen eksplisitt er "totalvinner"/vinner av hele løpet (da position = 1). En kvinnelig eller mannlig klassevinner uten eksplisitt totalplassering i teksten er IKKE nødvendigvis nr. 1 eller 2 totalt — sett position til null for dem. Ikke gjett.
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

  async function callGemini(model) {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

  // gemini-2.5-flash er faset ut for nye brukere (Google peker til gemini-3.6-flash),
  // og gemini-flash-latest har vist seg periodevis overbelastet. Prøv flere modeller
  // på rad — både ved 503 (overbelastet) og 404 (modell finnes ikke/er faset ut).
  const MODELS = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.0-flash"];
  const RETRYABLE = [404, 503];

  let aiResponse;
  try {
    let json;
    let lastErr;
    const tried = [];
    for (let i = 0; i < MODELS.length; i++) {
      if (i > 0) await sleep(800);
      tried.push(MODELS[i]);
      try {
        json = await callGemini(MODELS[i]);
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        if (!RETRYABLE.includes(err.status)) break; // fatal feil (f.eks. 400/401/403) hjelper ikke å bytte modell
      }
    }
    if (lastErr) {
      return res.status(502).json({ error: `Gemini API feilet (prøvde ${tried.join(", ")}): ${String(lastErr.message).slice(0, 300)}` });
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

  // Sikkerhetsnett: sjekk selv om "nytt løp" faktisk matcher et eksisterende løp,
  // uavhengig av hva modellen svarte — new_races-skjemaet har historisk manglet
  // matched_slug, og modellen kan uansett bomme på klassifiseringen.
  const normalizeName = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
  const raceByNormName = new Map((races || []).map((r) => [normalizeName(r.name), r.slug]));

  for (const n of aiResponse.new_races || []) {
    const selfMatchedSlug = n.matched_slug || raceByNormName.get(normalizeName(n.race_name)) || null;

    if (selfMatchedSlug) {
      // Finnes allerede i databasen — behandle som oppdatering, ikke nytt løp
      rows.push({
        type: "race_update",
        race_slug: selfMatchedSlug,
        race_name: n.race_name,
        summary: n.summary,
        fields: { date: n.date || undefined },
        source_url: n.source_url || null,
        raw_snippet: text.slice(0, 2000),
      });
      continue;
    }

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
