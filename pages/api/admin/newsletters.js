export default async function handler(req, res) {
  if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Ikke autorisert" });
  }
  if (req.method !== "GET") return res.status(405).end();

  const { status } = req.query;
  const params = status ? `?filter[status]=${status}&limit=25` : "?limit=50";

  const mlRes = await fetch(`https://connect.mailerlite.com/api/campaigns${params}`, {
    headers: {
      Authorization: `Bearer ${process.env.MAILERLITE_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!mlRes.ok) {
    const err = await mlRes.text();
    return res.status(mlRes.status).json({ error: err });
  }

  const data = await mlRes.json();
  return res.status(200).json(data);
}
