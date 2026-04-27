import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      name,
      email,
      size,
      quantity,
      address,
      postalCode,
      city,
    } = req.body ?? {};

    if (
      !name ||
      !email ||
      !size ||
      !quantity ||
      !address ||
      !postalCode ||
      !city
    ) {
      return res.status(400).json({ error: "Alle felter må fylles ut." });
    }

    const { error } = await supabase.from("sock_orders").insert([
      {
        name,
        email,
        size,
        quantity,
        address,
        postal_code: postalCode,
        city,
        status: "pending_payment",
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Kunne ikke lagre bestillingen." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Noe gikk galt." });
  }
}