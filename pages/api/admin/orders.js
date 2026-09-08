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
      .from("sock_orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "PATCH") {
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: "id og status påkrevd" });
    const { error } = await supabase
      .from("sock_orders")
      .update({ status })
      .eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  if (req.method === "POST") {
    const { name, email, size, quantity, address, postal_code, city, status, total_price, notes } = req.body;
    if (!name || !size || !quantity) return res.status(400).json({ error: "Navn, størrelse og antall påkrevd" });
    const { data, error } = await supabase
      .from("sock_orders")
      .insert([{
        name,
        email: email || null,
        size,
        quantity,
        address: address || null,
        postal_code: postal_code || null,
        city: city || null,
        status: status || "paid",
        total_price: total_price != null ? total_price : null,
        notes: notes || null,
      }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).end();
}
