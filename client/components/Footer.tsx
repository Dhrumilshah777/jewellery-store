import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-gray-600 text-sm">
            © {new Date().getFullYear()} Jewellery Store. Pan India delivery.
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/" className="text-gray-600 hover:text-gold-600">
              Home
            </Link>
            <Link href="/products" className="text-gray-600 hover:text-gold-600">
              Products
            </Link>
            <Link href="/cart" className="text-gray-600 hover:text-gold-600">
              Cart
            </Link>
            <Link href="/orders" className="text-gray-600 hover:text-gold-600">
              My Orders
            </Link>
          </nav>
        </div>
        <p className="text-center text-gray-500 text-xs mt-4">
          14KT, 18KT, 22KT gold • American diamond (CZ) • Ready stock & made-to-order
        </p>
      </div>
    </footer>
  );
}
