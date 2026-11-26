import { createClient } from "@supabase/supabase-js";

// Vercel Hobby defaulter til 10s per funksjon — 123 løp tar lenger enn det.
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

  const { data: races, error } = await supabase.from("races").select("slug");
  if (error) return res.status(500).json({ error: error.message });

  let revalidated = 0;
  let failed = 0;
  for (const r of races || []) {
    try {
      await res.revalidate(`/${r.slug}`);
      revalidated++;
    } catch (err) {
      failed++;
      console.error(`Revalidate feilet for /${r.slug}:`, err);
    }
  }

  try {
    await res.revalidate("/");
  } catch (err) {
    console.error("Revalidate feilet for /:", err);
  }

  return res.status(200).json({ ok: true, revalidated, failed });
}
