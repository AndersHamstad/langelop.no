import Link from 'next/link';

export default function TopNavPill() {
  return (
    <div
      className="flex items-center gap-2
                 rounded-full bg-black/25 backdrop-blur
                 px-3 py-1.5 md:px-4 md:py-2
                 hover:bg-black/35 transition-colors duration-200"
    >
      <Link
        href="/artikler/liste"
        className="px-1 text-sm md:text-base text-white font-medium hover:text-white"
      >
        Artikler
      </Link>

      <span className="text-white/40 mx-1 text-xs md:text-base">•</span>

      <Link
        href="/shop"
        className="px-1 text-sm md:text-base text-white font-medium hover:text-white"
      >
        Shop
      </Link>
    </div>
  );
}
