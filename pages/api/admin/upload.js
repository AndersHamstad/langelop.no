import { createClient } from "@supabase/supabase-js";
import formidable from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Ikke autorisert" });
  }
  if (req.method !== "POST") return res.status(405).end();

  const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
  const [fields, files] = await form.parse(req);

  const file = files.file?.[0];
  const bucket = fields.bucket?.[0] || "race-images";
  if (!file) return res.status(400).json({ error: "Ingen fil" });

  const ext = file.originalFilename?.split(".").pop() || "bin";
  const path = `${Date.now()}.${ext}`;
  const buffer = fs.readFileSync(file.filepath);

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: file.mimetype || "application/octet-stream",
    upsert: false,
  });

  if (error) return res.status(500).json({ error: error.message });

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return res.status(200).json({ url: data.publicUrl });
}
