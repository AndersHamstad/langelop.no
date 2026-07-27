import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Ikke autorisert" });
  }
  if (req.method !== "PATCH") return res.status(405).end();

  const { slug, ...fields } = req.body;
  if (!slug) return res.status(400).json({ error: "slug mangler" });

  const allowed = ["name", "date", "description", "image_url", "url", "status_note", "location", "region", "latitude", "longitude"];
  const update = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));

  const { error } = await supabase.from("races").update(update).eq("slug", slug);
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ ok: true });
}
