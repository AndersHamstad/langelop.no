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
      .select("*, supplier:sock_suppliers(id, name, contact)")
      .order("product_type", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { product_type, supplier_id, price, moq, lead_time, notes } = req.body;
    if (!product_type || !supplier_id) return res.status(400).json({ error: "product_type og supplier_id påkrevd" });
    const { data, error } = await supabase
      .from("supplier_offers")
      .insert([{ product_type, supplier_id, price, moq, lead_time, notes }])
      .select("*, supplier:sock_suppliers(id, name, contact)")
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "PATCH") {
    const { id, ...fields } = req.body;
    if (!id) return res.status(400).json({ error: "id påkrevd" });
    const allowed = ["product_type", "supplier_id", "price", "moq", "lead_time", "notes"];
    const update = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));
    const { data, error } = await supabase
      .from("supplier_offers")
      .update(update)
      .eq("id", id)
      .select("*, supplier:sock_suppliers(id, name, contact)")
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
