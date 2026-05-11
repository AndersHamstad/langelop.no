// pages/artikler/[slug].js
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Head from "next/head";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import { ArrowLeft, Clock } from "lucide-react";
import ArticleComments from "../../components/ArticleComments";

const ARTICLES_DIR = path.join(process.cwd(), "content", "artikler");

function estimateReadTime(content) {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
}

const formatDate = (dateString) => {
  try {
    return format(parseISO(String(dateString)), "d. MMMM yyyy", { locale: nb });
  } catch {
    return dateString;
  }
};

export default function Artikkel({ source, frontMatter, readTime, slug }) {
  const { title, author, date, image, ingress, focusArticle } = frontMatter;

  return (
    <>
      <Head>
        <title>{title} | Langeløp.no</title>
        <meta name="description" content={ingress || title} />
        <meta property="og:title" content={`${title} – Langeløp.no`} />
        <meta property="og:description" content={ingress || title} />
        <meta property="og:type" content="article" />
        {image && <meta property="og:image" content={image} />}
      </Head>

      <main className="bg-gray-100 min-h-screen pb-20">
        <div
          className="relative w-full overflow-hidden bg-gray-900"
          style={{ minHeight: "420px" }}
        >
          {image ? (
            <img
              src={image}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-70"
              style={{ objectPosition: focusArticle || "center 45%" }}
              loading="eager"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f1f2e] to-[#1a3a5c]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

          <div className="absolute top-4 left-4 md:top-8 md:left-8 z-20">
            <Link
              href="/artikler/liste"
              className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition"
            >
              <ArrowLeft size={15} />
              Alle artikler
            </Link>
          </div>

          <div className="relative z-10 flex flex-col justify-end h-full min-h-[420px] max-w-3xl mx-auto px-4 sm:px-6 pb-10 pt-20">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-300 mb-3">
              Langeløp.no
            </p>

            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-white/60">
              {author && <span>{author}</span>}

              {date && (
                <>
                  <span className="text-white/30">·</span>
                  <span>{formatDate(date)}</span>
                </>
              )}

              <span className="text-white/30">·</span>

              <span className="inline-flex items-center gap-1">
                <Clock size={13} />
                {readTime} min lesetid
              </span>
            </div>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          {ingress && (
            <p className="text-lg text-gray-700 font-medium leading-relaxed border-l-4 border-blue-500 pl-5 py-1 mb-8 bg-blue-50 rounded-r-xl">
              {ingress}
            </p>
          )}

          <div
            className="prose prose-gray prose-lg max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900
            prose-blockquote:border-blue-400 prose-blockquote:text-gray-600
            prose-img:rounded-xl prose-img:shadow-md
            prose-li:text-gray-700"
          >
            <MDXRemote {...source} />
          </div>

          <ArticleComments slug={slug} />

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/artikler/liste"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition"
            >
              <ArrowLeft size={15} />
              Tilbake til alle artikler
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

export async function getStaticPaths() {
  let files = [];

  try {
    files = fs.readdirSync(ARTICLES_DIR);
  } catch {
    console.warn(
      "content/artikler/ ikke funnet. Opprett mappen og legg til .mdx-filer."
    );
  }

  const paths = files
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => ({
      params: {
        slug: f.replace(".mdx", ""),
      },
    }));

  return {
    paths,
    fallback: "blocking",
  };
}

export async function getStaticProps({ params }) {
  const filePath = path.join(ARTICLES_DIR, `${params.slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return { notFound: true };
  }

  let fileContent;

  try {
    fileContent = fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    console.error(`Kunne ikke lese artikkel: ${params.slug}`, err);
    return { notFound: true };
  }

  const { data, content } = matter(fileContent);

  const frontMatter = {
    ...data,
    date: data.date?.toString() ?? null,
  };

  const mdxSource = await serialize(content);
  const readTime = estimateReadTime(content);

  return {
    props: {
      source: mdxSource,
      frontMatter,
      readTime,
      slug: params.slug,
    },
  };
}