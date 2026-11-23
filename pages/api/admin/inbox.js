import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Ikke autorisert" });
  }
  if (req.method !== "GET") return res.status(405).end();

  const [submissions, updates, sockInquiries, comments, produktReviews, utstyrReviews, articleComments] =
    await Promise.all([
      supabase.from("race_submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("race_updates").select("*").order("created_at", { ascending: false }),
      supabase.from("sock_inquiries").select("*").order("created_at", { ascending: false }),
      supabase.from("comments").select("*").eq("approved", false).order("created_at", { ascending: false }),
      supabase.from("produkt_reviews").select("*").eq("approved", false).order("created_at", { ascending: false }),
      supabase.from("utstyr_reviews").select("*").eq("approved", false).order("created_at", { ascending: false }),
      supabase.from("article_comments").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

  const firstError = [submissions, updates, sockInquiries, comments, produktReviews, utstyrReviews, articleComments]
    .map((r) => r.error)
    .find(Boolean);
  if (firstError) return res.status(500).json({ error: firstError.message });

  // comments-tabellen har kun race_id — slå opp løpsnavn/slug for visning
  const raceIds = [...new Set((comments.data || []).map((c) => c.race_id))];
  let raceById = {};
  if (raceIds.length > 0) {
    const { data: raceRows } = await supabase.from("races").select("id, name, slug").in("id", raceIds);
    (raceRows || []).forEach((r) => { raceById[r.id] = r; });
  }
  const commentsWithRace = (comments.data || []).map((c) => ({ ...c, race: raceById[c.race_id] || null }));

  return res.status(200).json({
    raceSubmissions: submissions.data || [],
    raceUpdates: updates.data || [],
    sockInquiries: sockInquiries.data || [],
    comments: commentsWithRace,
    produktReviews: produktReviews.data || [],
    utstyrReviews: utstyrReviews.data || [],
    articleComments: articleComments.data || [],
  });
}
