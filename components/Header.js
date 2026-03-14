import Link from 'next/link';
import TopNavPill from './TopNavPill';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#0b1b33]/95 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-3 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <img src="/logo2.png" alt="langeløp.no logo" className="h-10 w-auto" />
        </Link>

        {/* Samme pill-meny som på forsiden */}
        <TopNavPill />
      </div>
    </header>
  );
}
