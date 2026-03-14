import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, sizeInterest } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email mangler" });
  }

  const { error } = await supabase.from("sock_interest").insert([
    {
      email,
      size_interest: sizeInterest || null,
    },
  ]);

  if (error) {
    console.error(error);

    if (error.code === "23505") {
      return res
        .status(400)
        .json({ error: "Denne e-posten er allerede registrert." });
    }

    return res.status(500).json({ error: error.message || "Kunne ikke melde på" });
  }

  return res.status(200).json({ success: true });
}