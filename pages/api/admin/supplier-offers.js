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
      .from("supplier_offers")
      .select("*, supplier:sock_suppliers(id, name, contact), concept:sock_concepts(id, name, status, image_url)")
      .order("created_at", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { concept_id, supplier_id, status, price, moq, lead_time, notes } = req.body;
    if (!concept_id || !supplier_id) return res.status(400).json({ error: "concept_id og supplier_id påkrevd" });
    const { data, error } = await supabase
      .from("supplier_offers")
      .insert([{ concept_id, supplier_id, status: status || "contacted", price, moq, lead_time, notes }])
      .select("*, supplier:sock_suppliers(id, name, contact), concept:sock_concepts(id, name, status, image_url)")
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "PATCH") {
    const { id, ...fields } = req.body;
    if (!id) return res.status(400).json({ error: "id påkrevd" });
    const allowed = ["concept_id", "supplier_id", "status", "price", "moq", "lead_time", "notes"];
    const update = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));
    const { data, error } = await supabase
      .from("supplier_offers")
      .update(update)
      .eq("id", id)
      .select("*, supplier:sock_suppliers(id, name, contact), concept:sock_concepts(id, name, status, image_url)")
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id påkrevd" });
    const { error } = await supabase.from("supplier_offers").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
