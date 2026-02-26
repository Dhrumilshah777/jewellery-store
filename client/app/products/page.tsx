'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { productsApi } from '@/lib/api';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';

type Product = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  goldPurity?: string | null;
  productType: string;
  images?: { url: string; alt?: string }[];
  shortDescription?: string;
};

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [goldPurity, setGoldPurity] = useState('');
  const [productType, setProductType] = useState('');
  const [search, setSearch] = useState(() => searchParams.get('search') || '');

  useEffect(() => {
    setLoading(true);
    setError('');
    const params: Record<string, string> = {};
    if (category) params.category = category;
    if (goldPurity) params.goldPurity = goldPurity;
    if (productType) params.productType = productType;
    if (search.trim()) params.search = search.trim();
    productsApi
      .list(params)
      .then((res) => {
        if (res.success && res.data) setProducts(res.data as Product[]);
        else setError(res.message || 'Failed to load products');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [category, goldPurity, productType, search]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gold-800 mb-6">All Products</h1>

      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[200px]"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          <option value="gold">Gold</option>
          <option value="american_diamond">American Diamond</option>
          <option value="cz">CZ</option>
        </select>
        <select
          value={goldPurity}
          onChange={(e) => setGoldPurity(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All purity</option>
          <option value="14KT">14KT</option>
          <option value="18KT">18KT</option>
          <option value="22KT">22KT</option>
        </select>
        <select
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="ready_stock">Ready stock</option>
          <option value="made_to_order">Made to order</option>
        </select>
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</p>
      )}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-gray-500">No products found. Add products from Admin.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <Link
              key={p._id}
              href={`/products/${p.slug || p._id}`}
              className="group border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-lg transition"
            >
              <div className="aspect-square bg-gray-100 relative">
                {p.images?.[0]?.url ? (
                  <Image
                    src={p.images[0].url}
                    alt={p.images[0].alt || p.name}
                    fill
                    className="object-cover group-hover:scale-105 transition"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  {p.goldPurity && (
                    <span className="bg-gold-100 text-gold-800 text-xs px-2 py-0.5 rounded">
                      {p.goldPurity}
                    </span>
                  )}
                  <span className="bg-gray-800/80 text-white text-xs px-2 py-0.5 rounded capitalize">
                    {p.productType.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-gray-900 group-hover:text-gold-700 truncate">
                  {p.name}
                </h2>
                <p className="text-gold-600 font-medium mt-1">
                  ₹{p.price.toLocaleString('en-IN')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
