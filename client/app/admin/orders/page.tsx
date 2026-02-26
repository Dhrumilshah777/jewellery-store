'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/lib/api';

type Order = {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  user?: { name: string; email: string };
  createdAt: string;
};

export default function AdminOrdersPage() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    const params = statusFilter ? { status: statusFilter } : undefined;
    adminApi.orders
      .list(accessToken, params)
      .then((res) => {
        if (res.success && res.data) setOrders(res.data as Order[]);
        else setError(res.message || 'Failed to load');
      })
      .finally(() => setLoading(false));
  }, [accessToken, statusFilter]);

  async function updateStatus(orderId: string, status: string, trackingNumber?: string) {
    if (!accessToken) return;
    setUpdating(orderId);
    await adminApi.orders.updateStatus(accessToken, orderId, { status, trackingNumber });
    const res = await adminApi.orders.list(accessToken, statusFilter ? { status: statusFilter } : undefined);
    if (res.success && res.data) setOrders(res.data as Order[]);
    setUpdating(null);
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gold-800">Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Order</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Customer</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Total</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Payment</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">{o.orderNumber}</td>
                <td className="px-4 py-3 text-sm">
                  {o.user ? `${(o.user as { name?: string }).name} / ${(o.user as { email?: string }).email}` : '—'}
                </td>
                <td className="px-4 py-3 text-sm">₹{o.total.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">{o.status.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-3 text-sm">{o.paymentStatus}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o._id, e.target.value)}
                    disabled={updating === o._id}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="out_for_delivery">Out for delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p className="px-4 py-8 text-center text-gray-500">No orders yet.</p>
        )}
      </div>
    </>
  );
}
