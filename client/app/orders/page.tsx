'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ordersApi } from '@/lib/api';

type Order = {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
};

export default function MyOrdersPage() {
  const { isAuthenticated, accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    ordersApi
      .list(accessToken)
      .then((res) => {
        if (res.success && res.data) setOrders(res.data as Order[]);
        else setError(res.message || 'Failed to load orders');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, accessToken]);

  if (!isAuthenticated) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gold-800 mb-4">My Orders</h1>
        <p className="text-gray-600 mb-4">Please log in to view your orders.</p>
        <Link href="/login" className="text-gold-600 hover:underline">
          Login
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gold-800 mb-6">My Orders</h1>
        <p className="text-gray-500">Loading orders...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gold-800 mb-4">My Orders</h1>
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gold-800 mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="border border-gray-200 rounded-xl p-8 text-center bg-gray-50">
          <p className="text-gray-600 mb-4">You haven&apos;t placed any orders yet.</p>
          <Link href="/products" className="text-gold-600 hover:underline font-medium">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-gray-700">Order</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-700">Total</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-700">Payment</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-700"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(o.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">₹{o.total.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">
                      {o.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{o.paymentStatus}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/orders/${o._id}`}
                      className="text-gold-600 hover:underline text-sm font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
