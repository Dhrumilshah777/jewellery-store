'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { adminApi, productsApi, type Product } from '@/lib/api';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { accessToken } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Partial<Omit<Product, 'price'>> & { price?: string }>({});

  useEffect(() => {
    if (!accessToken || !id) return;
    productsApi.byId(id).then((res) => {
      if (res.success && res.data) {
        const p = res.data;
        setProduct(p);
        setForm({
          name: p.name,
          description: p.description,
          shortDescription: p.shortDescription,
          price: String(p.price),
          category: p.category,
          goldPurity: p.goldPurity ?? '',
          productType: p.productType,
          sku: p.sku,
          stock: p.stock ?? { quantity: 0, trackInventory: true },
          isActive: p.isActive,
          isFeatured: p.isFeatured,
          images: p.images?.length ? p.images : [],
        });
      }
    }).finally(() => setLoading(false));
  }, [accessToken, id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !id) return;
    setError('');
    setSubmitting(true);
    const payload = {
      ...form,
      price: parseFloat(form.price as string) || 0,
      goldPurity: form.goldPurity || undefined,
    };
    delete (payload as Record<string, unknown>).price;
    const res = await adminApi.products.update(accessToken, id, { ...payload, price: parseFloat(form.price as string) || 0 });
    setSubmitting(false);
    if (res.success) router.push('/admin/products');
    else setError(res.message || 'Failed to update');
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!product) return <p className="text-red-600">Product not found</p>;

  return (
    <>
      <Link href="/admin/products" className="text-gold-600 hover:underline text-sm mb-4 inline-block">← Products</Link>
      <h1 className="text-2xl font-bold text-gold-800 mb-6">Edit product</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        {error && <p className="text-red-600 bg-red-50 p-2 rounded text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input type="text" required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea required value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={3} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
          <input type="number" required min={0} step={0.01} value={form.price ?? ''} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="gold">Gold</option>
              <option value="american_diamond">American Diamond</option>
              <option value="cz">CZ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gold purity</label>
            <select value={form.goldPurity || ''} onChange={(e) => setForm({ ...form, goldPurity: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">—</option>
              <option value="14KT">14KT</option>
              <option value="18KT">18KT</option>
              <option value="22KT">22KT</option>
            </select>
          </div>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            <span className="text-sm">Active</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isFeatured ?? false} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
            <span className="text-sm">Featured</span>
          </label>
        </div>
        <div className="flex gap-4">
          <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-gold-600 text-white rounded-lg hover:bg-gold-700 disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save'}
          </button>
          <Link href="/admin/products" className="px-4 py-2.5 border border-gray-300 rounded-lg">Cancel</Link>
        </div>
      </form>
    </>
  );
}
