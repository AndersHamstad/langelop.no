import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ArticleComments({ slug }) {
  const [comments, setComments] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (slug) {
      fetchComments();
    }
  }, [slug]);

  async function fetchComments() {
    const { data, error } = await supabase
      .from("article_comments")
      .select("*")
      .eq("article_slug", slug)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      return;
    }

    setComments(data || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!slug) {
      setStatus("Mangler artikkel-ID. Prøv å laste siden på nytt.");
      return;
    }

    setStatus("Sender...");

    const { error } = await supabase.from("article_comments").insert([
      {
        article_slug: slug,
        name,
        email,
        comment,
      },
    ]);

    console.error("Supabase insert error:", error);

    if (error) {
      if (error.code === "23505") {
        setStatus("Du har allerede kommentert denne artikkelen.");
      } else {
        setStatus("Noe gikk galt. Sjekk console for feilmelding.");
      }

      return;
    }

    setStatus("Kommentaren er sendt!");

    setName("");
    setEmail("");
    setComment("");

    fetchComments();
  }

  return (
    <div className="mt-20">
      <h2 className="text-2xl font-bold mb-3">👋 Del din erfaring</h2>

      <form onSubmit={handleSubmit} className="space-y-4 mb-12">
        <input
          type="text"
          placeholder="Navn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border rounded-xl px-4 py-3"
        />

        <input
          type="email"
          placeholder="E-post"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border rounded-xl px-4 py-3"
        />

        <textarea
          placeholder="Kommentar"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          rows={5}
          className="w-full border rounded-xl px-4 py-3"
        />

        <button
          type="submit"
          className="bg-black text-white px-6 py-3 rounded-xl"
        >
          Send kommentar
        </button>

        {status && <p className="text-sm text-gray-600">{status}</p>}
      </form>

      <div className="space-y-6">
        {comments.map((c) => (
          <div key={c.id} className="border rounded-2xl p-5">
            <div className="font-semibold mb-2">{c.name}</div>

            <div className="text-gray-700 whitespace-pre-wrap">
              {c.comment}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}