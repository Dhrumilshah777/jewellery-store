import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold text-gold-800 mb-4">
        Gold & American Diamond Jewellery
      </h1>
      <p className="text-gray-600 text-center max-w-xl mb-8">
        14KT, 18KT, 22KT gold • American diamond (CZ) • Ready stock & made-to-order • Pan India shipping
      </p>
      <Link
        href="/products"
        className="px-6 py-3 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition"
      >
        Shop Now
      </Link>
    </main>
  );
}
