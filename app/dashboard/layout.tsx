'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

// Icon imports
import { 
  PlusCircle,
  Headphones,
  Settings,
  LogOut
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) return null;

  const menuItems = [
    { name: 'Add New Content', icon: <PlusCircle className="w-5 h-5" />, href: '/dashboard' },
    { name: 'My Podcasts', icon: <Headphones className="w-5 h-5" />, href: '/dashboard/my-podcasts' },
    { name: 'Settings', icon: <Settings className="w-5 h-5" />, href: '/dashboard/settings' },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-gray-100 fixed h-full">
        <div className="p-6">
          <nav className="space-y-4">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-2 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
            
            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-2 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  );
} 