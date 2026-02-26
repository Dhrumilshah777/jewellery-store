'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    if (!isAdmin) {
      router.replace('/');
    }
  }, [loading, isAuthenticated, user?.role, router]);

  if (loading || !isAuthenticated) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  if (!isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex gap-8">
        <aside className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            <Link
              href="/admin"
              className={`block px-3 py-2 rounded-lg ${pathname === '/admin' ? 'bg-gold-100 text-gold-800 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/products"
              className={`block px-3 py-2 rounded-lg ${pathname?.startsWith('/admin/products') ? 'bg-gold-100 text-gold-800 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Products
            </Link>
            <Link
              href="/admin/orders"
              className={`block px-3 py-2 rounded-lg ${pathname?.startsWith('/admin/orders') ? 'bg-gold-100 text-gold-800 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Orders
            </Link>
            <Link href="/" className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">
              ← Store
            </Link>
          </nav>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
