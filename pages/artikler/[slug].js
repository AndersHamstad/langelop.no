import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Footer from '../../components/Footer';
import Head from 'next/head';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

export default function Artikkel({ source, frontMatter }) {
  const { title, author, date, image, ingress } = frontMatter;
  const formattedDate = format(new Date(date), 'd. MMMM yyyy', { locale: nb });

  return (
    <>
      <Head>
        <title>{title} | langeløp.no</title>
        <meta name="description" content={ingress} />
        {image && <meta property="og:image" content={image} />}
      </Head>

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="langeløp.no logo" className="h-10 w-auto" />
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="bg-gray-50 min-h-screen px-4 sm:px-6 pt-10 pb-20">
        <article className="max-w-3xl mx-auto bg-white shadow-md rounded-xl overflow-hidden">

          {/* Bilde */}
          {image && (
            <div className="w-full overflow-hidden rounded-t-xl">
              <img
                src={image}
                alt={title}
                className="w-full h-[250px] object-cover rounded-t-xl"
                style={{ objectPosition: 'center 90%' }}
              />
            </div>
          )}

          {/* Innhold */}
          <div className="p-8 sm:p-10 space-y-6">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500">
                Skrevet av {author} • {formattedDate}
              </p>
            </div>

            {/* Ingress */}
            {ingress && (
              <p className="text-lg text-gray-800 font-light leading-relaxed italic bg-green-50 border-l-4 border-green-400 pl-4 py-3 rounded">
                {ingress}
              </p>
            )}

            {/* MDX-innhold */}
<div className="prose prose-gray prose-lg prose-compact max-w-none">
  <MDXRemote {...source} />
</div>

          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}

export async function getStaticPaths() {
  const files = fs.readdirSync(path.join('pages', 'artikler'));
  const paths = files
    .filter((filename) => filename.endsWith('.mdx'))
    .map((filename) => ({
      params: { slug: filename.replace('.mdx', '') },
    }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const filePath = path.join('pages', 'artikler', `${params.slug}.mdx`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const { data, content } = matter(fileContent);

  const frontMatter = {
    ...data,
    date: data.date?.toString() ?? null,
  };

  const mdxSource = await serialize(content);

  return {
    props: {
      source: mdxSource,
      frontMatter,
    },
  };
}
