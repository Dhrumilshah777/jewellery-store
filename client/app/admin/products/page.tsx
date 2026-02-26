'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { adminApi, type Product } from '@/lib/api';

export default function AdminProductsPage() {
  const { accessToken } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    adminApi.products
      .list(accessToken)
      .then((res) => {
        if (res.success && res.data) setProducts(res.data);
        else setError(res.message || 'Failed to load');
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  async function handleDelete(id: string) {
    if (!accessToken || !confirm('Deactivate this product?')) return;
    const res = await adminApi.products.delete(accessToken, id);
    if (res.success) setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, isActive: false } : p)));
    else setError(res.message || 'Failed');
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gold-800">Products</h1>
        <Link href="/admin/products/new" className="px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700">
          Add product
        </Link>
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Image</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Name</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Category</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Price</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-b border-gray-100">
                <td className="px-4 py-3">
                  {p.images?.[0]?.url ? (
                    <div className="w-12 h-12 relative rounded overflow-hidden bg-gray-100">
                      <Image src={p.images[0].url} alt="" fill className="object-cover" sizes="48px" />
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{p.category.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-sm">₹{p.price.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${p._id}`} className="text-gold-600 hover:underline text-sm mr-2">Edit</Link>
                  {p.isActive && (
                    <button type="button" onClick={() => handleDelete(p._id)} className="text-red-600 hover:underline text-sm">Deactivate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="px-4 py-8 text-center text-gray-500">No products. Add one to get started.</p>
        )}
      </div>
    </>
  );
}
