import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RACE_UPDATE_ALLOWED = [
  "name", "date", "description", "image_url", "url", "status_note", "location", "region",
];

function timeToSeconds(t) {
  if (!t) return null;
  const parts = String(t).split(":").map((n) => parseInt(n, 10));
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

export default async function handler(req, res) {
  if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Ikke autorisert" });
  }

  if (req.method === "GET") {
    const status = req.query.status || "pending";
    const { data, error } = await supabase
      .from("digest_suggestions")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "PATCH") {
    const { id, action } = req.body;
    if (!id || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "id og gyldig action påkrevd" });
    }

    const { data: suggestion, error: fetchError } = await supabase
      .from("digest_suggestions")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError || !suggestion) return res.status(404).json({ error: "Fant ikke forslaget" });

    if (action === "reject") {
      const { error } = await supabase.from("digest_suggestions").update({ status: "rejected" }).eq("id", id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // action === "approve"
    if (suggestion.type === "result") {
      if (!suggestion.race_slug) {
        return res.status(400).json({ error: "Ingen matchet løp — kan ikke lagre resultat uten race_slug" });
      }
      const { date, distance_km, winners } = suggestion.fields || {};
      const year = date ? parseInt(date.slice(0, 4), 10) : null;

      // race_results har en unik-constraint på (race_id, year, position). Digest-teksten
      // oppgir nesten aldri faktisk overall-plassering, kun kjønnskategori-vinner — å anta
      // position=1 for begge (eller gjette utifra tid) kolliderer, og kan i tillegg påstå en
      // feil offisiell plassering (kategorivinner ≠ nødvendigvis nr. 2 totalt). Vi setter derfor
      // kun position når teksten eksplisitt oppgir det (f.eks. "nr. 6 totalt") — ellers null,
      // som Postgres tillater flere av under samme unik-constraint.
      const { data: existingRows } = await supabase
        .from("race_results")
        .select("position")
        .eq("race_id", suggestion.race_slug)
        .eq("year", year);
      const usedPositions = new Set((existingRows || []).map((r) => r.position).filter((p) => p != null));

      const claim = (preferred) => {
        let pos = preferred;
        while (usedPositions.has(pos)) pos++;
        usedPositions.add(pos);
        return pos;
      };

      const withTimes = (winners || []).map((w) => ({ ...w, time_seconds: timeToSeconds(w.time) }));

      // Den raskeste av de rapporterte "vinnerne" for løpet ER den faktiske
      // totalvinneren (det er derfor de står i en vinner-liste) — trygt å sette
      // position=1 for denne ene, med mindre noen allerede har eksplisitt position.
      // De øvrige (kategorivinnere) sin faktiske totalplassering er ukjent -> null.
      if (!withTimes.some((w) => w.position)) {
        const fastest = withTimes.reduce((best, w) => {
          if (w.time_seconds == null) return best;
          if (!best || w.time_seconds < best.time_seconds) return w;
          return best;
        }, null);
        if (fastest) fastest.position = 1;
      }

      const insertRows = withTimes.map((w) => ({
        race_id: suggestion.race_slug,
        year,
        distance_km: distance_km || null,
        position: w.position ? claim(w.position) : null,
        name: w.name,
        time_seconds: w.time_seconds,
        gender: w.gender || null,
      }));

      if (insertRows.length > 0) {
        const { error } = await supabase.from("race_results").insert(insertRows);
        if (error) return res.status(500).json({ error: error.message });
        try {
          await res.revalidate(`/${suggestion.race_slug}`);
        } catch (e) {
          console.error("Revalidate feilet:", e);
        }
      }
    }

    if (suggestion.type === "race_update") {
      if (!suggestion.race_slug) {
        return res.status(400).json({ error: "Ingen matchet løp — kan ikke oppdatere uten race_slug" });
      }
      const patch = Object.fromEntries(
        Object.entries(suggestion.fields || {}).filter(([k, v]) => RACE_UPDATE_ALLOWED.includes(k) && v != null)
      );
      if (Object.keys(patch).length > 0) {
        const { error } = await supabase.from("races").update(patch).eq("slug", suggestion.race_slug);
        if (error) return res.status(500).json({ error: error.message });
        try {
          await res.revalidate(`/${suggestion.race_slug}`);
          await res.revalidate("/");
        } catch (e) {
          console.error("Revalidate feilet:", e);
        }
      }
    }

    if (suggestion.type === "new_race") {
      const f = suggestion.fields || {};
      const { error } = await supabase.from("race_submissions").insert([{
        navn: suggestion.race_name,
        dato: f.date || null,
        distanse: "",
        sted: f.location || "",
        region: f.region || "",
        nettside: f.url || null,
        kontakt_navn: "ChatGPT-oppdatering",
        kontakt_epost: process.env.REPORT_EMAIL || "",
        beskrivelse: suggestion.summary || null,
      }]);
      if (error) return res.status(500).json({ error: error.message });
    }

    const { error: updateError } = await supabase
      .from("digest_suggestions")
      .update({ status: "approved" })
      .eq("id", id);
    if (updateError) return res.status(500).json({ error: updateError.message });

    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
