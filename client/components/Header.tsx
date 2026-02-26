'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { user, isAuthenticated, logout, loading } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center h-16">
        <Link href="/" className="text-xl font-semibold text-gold-700">
          Jewellery Store
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/products" className="text-gray-600 hover:text-gold-600">
            Products
          </Link>
          <Link href="/products" className="text-gray-600 hover:text-gold-600" title="Search products">
            Search
          </Link>
          <Link href="/cart" className="text-gray-600 hover:text-gold-600">
            Cart
          </Link>
          {isAuthenticated && (
            <Link href="/orders" className="text-gray-600 hover:text-gold-600">
              My Orders
            </Link>
          )}
          {loading ? (
            <span className="text-gray-400 text-sm">...</span>
          ) : isAuthenticated && user ? (
            <>
              {(user.role === 'admin' || user.role === 'super_admin') && (
                <Link href="/admin" className="text-amber-700 hover:text-amber-800 font-medium">
                  Admin
                </Link>
              )}
              <span className="text-gray-600 text-sm">{user.name}</span>
              <button
                type="button"
                onClick={() => logout()}
                className="text-gray-600 hover:text-gold-600 text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-gold-600">
                Login
              </Link>
              <Link href="/register" className="text-gold-600 hover:text-gold-700 font-medium">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
