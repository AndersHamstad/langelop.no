import { createClient } from "@supabase/supabase-js";

// Vercel Hobby defaulter til 10s per funksjon. Selv med 60s er alle løpene
// i ett kall for tregt (hver res.revalidate() kjører en ekte side-regenerering) —
// adminUI-et kaller denne i batcher, se revalidateAllRaces() i admin.js.
export const config = { maxDuration: 60 };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Ikke autorisert" });
  }
  if (req.method !== "POST") return res.status(405).end();

  let slugs = req.body?.slugs;
  if (!Array.isArray(slugs)) {
    // Uten slugs i body: slå opp alle selv (OK for et lite antall løp,
    // men adminUI-et bør alltid sende batcher for å unngå timeout).
    const { data: races, error } = await supabase.from("races").select("slug");
    if (error) return res.status(500).json({ error: error.message });
    slugs = (races || []).map((r) => r.slug);
  }

  let revalidated = 0;
  let failed = 0;
  for (const slug of slugs) {
    try {
      await res.revalidate(`/${slug}`);
      revalidated++;
    } catch (err) {
      failed++;
      console.error(`Revalidate feilet for /${slug}:`, err);
    }
  }

  if (req.body?.revalidateHome) {
    try {
      await res.revalidate("/");
    } catch (err) {
      console.error("Revalidate feilet for /:", err);
    }
  }

  return res.status(200).json({ ok: true, revalidated, failed });
}
