'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/lib/api';

export default function NewProductPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: 'gold',
    goldPurity: '',
    productType: 'ready_stock',
    price: '',
    sku: '',
    stock: { quantity: 0, trackInventory: true },
    isActive: true,
    isFeatured: false,
    images: [] as { url: string; alt?: string }[],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      goldPurity: form.goldPurity || undefined,
      images: form.images.length ? form.images : [{ url: '', alt: form.name }],
    };
    if (!payload.images?.[0]?.url) payload.images = [];
    const res = await adminApi.products.create(accessToken!, payload);
    setSubmitting(false);
    if (res.success && res.data && typeof res.data === 'object' && '_id' in res.data) {
      router.push('/admin/products');
    } else {
      setError(res.message || 'Failed to create product');
    }
  }

  return (
    <>
      <Link href="/admin/products" className="text-gold-600 hover:underline text-sm mb-4 inline-block">← Products</Link>
      <h1 className="text-2xl font-bold text-gold-800 mb-6">Add product</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        {error && <p className="text-red-600 bg-red-50 p-2 rounded text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={3} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Short description</label>
          <input type="text" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="gold">Gold</option>
              <option value="american_diamond">American Diamond</option>
              <option value="cz">CZ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gold purity</label>
            <select value={form.goldPurity} onChange={(e) => setForm({ ...form, goldPurity: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">—</option>
              <option value="14KT">14KT</option>
              <option value="18KT">18KT</option>
              <option value="22KT">22KT</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product type *</label>
            <select value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="ready_stock">Ready stock</option>
              <option value="made_to_order">Made to order</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
            <input type="number" required min={0} step={0.01} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
          <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. GD-001" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock quantity</label>
          <input type="number" min={0} value={form.stock.quantity} onChange={(e) => setForm({ ...form, stock: { ...form.stock, quantity: parseInt(e.target.value, 10) || 0 } })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            <span className="text-sm">Active</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
            <span className="text-sm">Featured</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product image</label>
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="text-sm"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !accessToken) return;
                setUploading(true);
                const result = await adminApi.uploadImage(accessToken, file);
                setUploading(false);
                if (result.success && result.url) setForm((f) => ({ ...f, images: [{ url: result.url! }] }));
                else setError(result.message || 'Upload failed');
              }}
            />
            {uploading && <span className="text-sm text-gray-500">Uploading...</span>}
            {form.images[0]?.url && (
              <div className="flex items-center gap-2">
                <img src={form.images[0].url} alt="" className="w-20 h-20 object-cover rounded border" />
                <button type="button" onClick={() => setForm((f) => ({ ...f, images: [] }))} className="text-red-600 text-sm">Remove</button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Or paste URL below</p>
          <input type="url" placeholder="https://..." value={form.images[0]?.url || ''} onChange={(e) => setForm({ ...form, images: e.target.value ? [{ url: e.target.value }] : [] })} className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1" />
        </div>
        <div className="flex gap-4">
          <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-gold-600 text-white rounded-lg hover:bg-gold-700 disabled:opacity-50">
            {submitting ? 'Saving...' : 'Create product'}
          </button>
          <Link href="/admin/products" className="px-4 py-2.5 border border-gray-300 rounded-lg">Cancel</Link>
        </div>
      </form>
    </>
  );
}
