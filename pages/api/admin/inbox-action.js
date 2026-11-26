import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Hvitliste over tabeller denne ruta har lov til å røre, og hvilke handlinger
// som gir mening for hver — forhindrer at tabellnavn fra body brukes fritt.
const ACTIONS_BY_TABLE = {
  race_submissions: ["dismiss"],
  race_updates: ["dismiss"],
  sock_inquiries: ["dismiss"],
  comments: ["approve", "reject"],
  produkt_reviews: ["approve", "reject"],
  utstyr_reviews: ["approve", "reject"],
};

export default async function handler(req, res) {
  if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Ikke autorisert" });
  }
  if (req.method !== "POST") return res.status(405).end();

  const { table, id, action } = req.body || {};
  const allowed = ACTIONS_BY_TABLE[table];
  if (!allowed || !id || !allowed.includes(action)) {
    return res.status(400).json({ error: "Ugyldig tabell, id eller handling" });
  }

  if (action === "approve") {
    const { data, error } = await supabase.from(table).update({ approved: true }).eq("id", id).select();
    if (error) return res.status(500).json({ error: error.message });

    // Løpssiden er statisk (ISR, revalidate: 3600s) — uten dette blir en godkjent
    // kommentar ikke synlig før noen besøker siden igjen EN TIME eller mer etter godkjenning.
    if (table === "comments" && data?.[0]?.race_id) {
      const { data: race } = await supabase.from("races").select("slug").eq("id", data[0].race_id).single();
      if (race?.slug) {
        try {
          await res.revalidate(`/${race.slug}`);
        } catch (revalidateError) {
          console.error("Revalidate feilet:", revalidateError);
        }
      }
    }
  } else {
    // dismiss (løp-forslag/endringer/sokkehenvendelser) og reject (anmeldelser/kommentarer)
    // betyr begge "fjern fra køen" — radene har ingen status-kolonne å flagge i stedet.
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true });
}
