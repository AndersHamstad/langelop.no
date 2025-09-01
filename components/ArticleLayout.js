import Image from 'next/image';

export default function ArticleLayout({ frontMatter, children }) {
  const { title, date, author, image, ingress } = frontMatter;

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {image && (
        <div className="relative w-full h-64 mb-6">
          <Image
            src={image}
            alt={title}
            layout="fill"
            objectFit="cover"
            objectPosition="center"
            className="rounded"
          />
        </div>
      )}

      <p className="text-sm text-gray-500 mb-2">
        {date && new Date(date).toLocaleDateString('no-NO', { year: 'numeric', month: 'long', day: 'numeric' })} &middot; Skrevet av {author}
      </p>

      <h1 className="text-3xl font-bold mb-4">{title}</h1>

      {ingress && <p className="text-lg text-gray-700 italic mb-6">{ingress}</p>}

      <div className="prose max-w-none">{children}</div>
    </article>
  );
}
