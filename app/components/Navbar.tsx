import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <div className="w-full flex justify-center fixed top-4 z-50">
      <nav className="flex justify-between items-center px-6 py-3 bg-white/5 backdrop-blur-md rounded-full mx-4 max-w-5xl w-full shadow-lg">
        <div className="flex items-center gap-2">
          <Image src="/nav-image.svg" alt="snipr" width={32} height={32} />
          <span className="text-xl font-semibold">snipr</span>
        </div>
        <div className="flex gap-6">
          <Link href="/podcasts" className="hover:text-gray-300 transition-colors">Podcasts</Link>
          <Link href="/about" className="hover:text-gray-300 transition-colors">About</Link>
          <Link href="/settings" className="hover:text-gray-300 transition-colors">Settings</Link>
        </div>
      </nav>
    </div>
  );
} 