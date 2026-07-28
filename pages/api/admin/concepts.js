import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Ikke autorisert" });
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("sock_concepts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { name, status, supplier, contact, notes } = req.body;
    if (!name) return res.status(400).json({ error: "Navn påkrevd" });
    const { data, error } = await supabase
      .from("sock_concepts")
      .insert([{ name, status: status || "idea", supplier, contact, notes }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "PATCH") {
    const { id, ...fields } = req.body;
    if (!id) return res.status(400).json({ error: "id påkrevd" });
    const allowed = ["name", "status", "supplier", "contact", "notes"];
    const update = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));
    const { data, error } = await supabase
      .from("sock_concepts")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id påkrevd" });
    const { error } = await supabase.from("sock_concepts").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
