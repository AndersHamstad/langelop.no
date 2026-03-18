// pages/artikler/[slug].js
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Head from 'next/head';
import Link from 'next/link';
import { format, parseISO } from 'date-fns'; // ✅ FIX 1: parseISO importert
import { nb } from 'date-fns/locale';
import { ArrowLeft, Clock } from 'lucide-react';

// ✅ FIX 3: Artikler leses fra content/artikler/ ikke pages/artikler/
const ARTICLES_DIR = path.join(process.cwd(), 'content', 'artikler');

// ✅ FIX 7: Beregn estimert lesetid
function estimateReadTime(content) {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return minutes;
}

// ✅ FIX 1: parseISO for konsistent datoformatering
const formatDate = (dateString) => {
  try {
    return format(parseISO(String(dateString)), 'd. MMMM yyyy', { locale: nb });
  } catch {
    return dateString;
  }
};

export default function Artikkel({ source, frontMatter, readTime }) {
  const { title, author, date, image, ingress, focusArticle } = frontMatter;

  return (
    <>
      <Head>
        <title>{title} | Langeløp.no</title>
        <meta name="description" content={ingress || title} />
        {/* ✅ FIX 5: Fullstendige OG-tags */}
        <meta property="og:title" content={`${title} – Langeløp.no`} />
        <meta property="og:description" content={ingress || title} />
        <meta property="og:type" content="article" />
        {image && <meta property="og:image" content={image} />}
      </Head>

      <main className="bg-gray-100 min-h-screen pb-20">

        {/* === Hero-bilde / header === */}
        <div className="relative w-full overflow-hidden bg-gray-900" style={{ minHeight: '420px' }}>
          {image ? (
            <img
              src={image}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-70"
              style={{ objectPosition: focusArticle || 'center 45%' }}
              loading="eager"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f1f2e] to-[#1a3a5c]" />
          )}

          {/* ✅ FIX 11: Sterkere gradient for polert overgang */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

          {/* ✅ FIX 6: Tilbake-lenke */}
          <div className="absolute top-4 left-4 md:top-8 md:left-8 z-20">
            <Link
              href="/artikler/liste"
              className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition"
            >
              <ArrowLeft size={15} />
              Alle artikler
            </Link>
          </div>

          {/* Tittel og meta over bildet */}
          <div className="relative z-10 flex flex-col justify-end h-full min-h-[420px] max-w-3xl mx-auto px-4 sm:px-6 pb-10 pt-20">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-300 mb-3">
              Langeløp.no
            </p>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              {title}
            </h1>

            {/* Meta-rad */}
            <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-white/60">
              {author && <span>{author}</span>}
              {date && (
                <>
                  <span className="text-white/30">·</span>
                  <span>{formatDate(date)}</span>
                </>
              )}
              {/* ✅ FIX 7: Lesetid */}
              <span className="text-white/30">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={13} />
                {readTime} min lesetid
              </span>
            </div>
          </div>
        </div>

        {/* === Artikkelinnhold === */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

          {/* Ingress */}
          {ingress && (
            <p className="text-lg text-gray-700 font-medium leading-relaxed border-l-4 border-blue-500 pl-5 py-1 mb-8 bg-blue-50 rounded-r-xl">
              {ingress}
            </p>
          )}

          {/* ✅ FIX 8: prose-compact fjernet – kun standard Tailwind prose-klasser */}
          <div className="prose prose-gray prose-lg max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900
            prose-blockquote:border-blue-400 prose-blockquote:text-gray-600
            prose-img:rounded-xl prose-img:shadow-md
            prose-li:text-gray-700
          ">
            <MDXRemote {...source} />
          </div>

          {/* Bunn-navigasjon */}
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
  // ✅ FIX 3: Leser fra content/artikler/ i stedet for pages/artikler/
  let files = [];
  try {
    files = fs.readdirSync(ARTICLES_DIR);
  } catch {
    // Mappen finnes ikke enda – returner tomme paths
    console.warn('content/artikler/ ikke funnet. Opprett mappen og legg til .mdx-filer.');
  }

  const paths = files
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => ({ params: { slug: f.replace('.mdx', '') } }));

  return {
    paths,
    fallback: 'blocking', // ✅ FIX 2: Nye artikler vises uten ny build
  };
}

export async function getStaticProps({ params }) {
  const filePath = path.join(ARTICLES_DIR, `${params.slug}.mdx`);

  // ✅ FIX 4: Feilhåndtering hvis filen mangler
  if (!fs.existsSync(filePath)) {
    return { notFound: true };
  }

  let fileContent;
  try {
    fileContent = fs.readFileSync(filePath, 'utf-8');
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

  // ✅ FIX 7: Beregn lesetid server-side
  const readTime = estimateReadTime(content);

  return {
    props: {
      source: mdxSource,
      frontMatter,
      readTime,
    },
  };
}