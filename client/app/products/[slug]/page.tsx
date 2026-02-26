'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { productsApi, cartApi, type Product } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { isAuthenticated, accessToken } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState('');

  useEffect(() => {
    if (!slug) return;
    productsApi
      .bySlug(slug)
      .then((res) => {
        if (res.success && res.data) setProduct(res.data);
        else setError(res.message || 'Product not found');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleAddToCart() {
    if (!product) return;
    if (!isAuthenticated || !accessToken) {
      router.push('/login?redirect=/cart');
      return;
    }
    setAdding(true);
    setAddMessage('');
    const res = await cartApi.addItem(accessToken, product._id, quantity);
    setAdding(false);
    if (res.success) {
      setAddMessage('Added to cart!');
      setTimeout(() => setAddMessage(''), 3000);
    } else {
      setAddMessage(res.message || 'Failed to add');
    }
  }

  if (loading) return <main className="max-w-7xl mx-auto px-4 py-8"><p className="text-gray-500">Loading...</p></main>;
  if (error || !product) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-red-600">{error || 'Product not found'}</p>
        <Link href="/products" className="text-gold-600 hover:underline mt-2 inline-block">← Back to products</Link>
      </main>
    );
  }

  const imageUrl = product.images?.[0]?.url;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/products" className="text-gold-600 hover:underline text-sm mb-4 inline-block">← Back to products</Link>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
          {imageUrl ? (
            <Image src={imageUrl} alt={product.name} fill className="object-cover" sizes="50vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
          )}
        </div>
        <div>
          <div className="flex gap-2 mb-2">
            {product.goldPurity && (
              <span className="bg-gold-100 text-gold-800 text-sm px-2 py-0.5 rounded">{product.goldPurity}</span>
            )}
            <span className="bg-gray-200 text-gray-700 text-sm px-2 py-0.5 rounded capitalize">
              {product.productType.replace('_', ' ')}
            </span>
            <span className="bg-gray-200 text-gray-700 text-sm px-2 py-0.5 rounded capitalize">
              {product.category.replace('_', ' ')}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gold-800 mb-2">{product.name}</h1>
          <p className="text-2xl font-semibold text-gold-600 mb-4">
            ₹{product.price.toLocaleString('en-IN')}
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-gray-400 text-lg ml-2 line-through">₹{product.compareAtPrice.toLocaleString('en-IN')}</span>
            )}
          </p>
          {product.shortDescription && (
            <p className="text-gray-600 mb-4">{product.shortDescription}</p>
          )}
          <p className="text-gray-700 whitespace-pre-wrap mb-6">{product.description}</p>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Qty:</span>
              <input
                type="number"
                min={1}
                max={product.stock?.trackInventory ? product.stock.quantity : 99}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 border border-gray-300 rounded px-2 py-1"
              />
            </label>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding}
              className="px-6 py-2.5 bg-gold-600 text-white rounded-lg hover:bg-gold-700 disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add to cart'}
            </button>
            {addMessage && <span className="text-green-600 text-sm">{addMessage}</span>}
          </div>
          {!isAuthenticated && (
            <p className="text-gray-500 text-sm mt-2">Login to add to cart.</p>
          )}
          <p className="text-gray-500 text-sm mt-4">Pan India shipping available.</p>
        </div>
      </div>
    </main>
  );
}
