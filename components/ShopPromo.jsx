// components/ShopPromo.jsx
import Link from 'next/link';
import Image from 'next/image';

export default function ShopPromo({ source = 'generic' }) {
  return (
    <Link
      href={`/shop?ref=${source}`}
      className="group flex items-center gap-4 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition p-4 sm:p-5"
    >
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-[#f1f0ed]">
        <Image
          src="/shop/Sock-5.png"
          alt="Langeløp Endurance Crew løpesokk"
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">
          Fra Langeløp
        </p>
        <p className="text-sm font-semibold text-gray-900 leading-snug">
          Langeløp Endurance Crew — sokker vi designet selv for lange dager på beina
        </p>
        <span className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium mt-1 group-hover:gap-1.5 transition-all">
          Se sokkene
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z" clipRule="evenodd" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
