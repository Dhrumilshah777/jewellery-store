'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ordersApi, type OrderDetail } from '@/lib/api';

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { isAuthenticated, accessToken } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !id) {
      setLoading(false);
      return;
    }
    ordersApi.get(accessToken, id).then((res) => {
      if (res.success && res.data) setOrder(res.data);
      else setError(res.message || 'Order not found');
    }).finally(() => setLoading(false));
  }, [isAuthenticated, accessToken, id]);

  if (!isAuthenticated) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-600">Please log in to view orders.</p>
        <Link href="/login" className="text-gold-600 hover:underline">Login</Link>
      </main>
    );
  }
  if (loading) return <main className="max-w-7xl mx-auto px-4 py-8"><p className="text-gray-500">Loading...</p></main>;
  if (error || !order) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-red-600">{error || 'Order not found'}</p>
        <Link href="/" className="text-gold-600 hover:underline">Home</Link>
      </main>
    );
  }

  const addr = order.shippingAddress;
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/cart" className="text-gold-600 hover:underline text-sm mb-4 inline-block">← Back</Link>
      <h1 className="text-2xl font-bold text-gold-800 mb-2">Order {order.orderNumber}</h1>
      <p className="text-gray-500 text-sm mb-6">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
      <div className="flex gap-4 mb-4">
        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm capitalize">{order.status.replace('_', ' ')}</span>
        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">{order.paymentStatus}</span>
      </div>
      <div className="border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-2">Items</h2>
        <ul className="space-y-2">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span>{item.name} × {item.quantity}</span>
              <span>₹{item.total.toLocaleString('en-IN')}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-4 border-t flex justify-between text-sm">
          <span>Subtotal</span><span>₹{order.subtotal.toLocaleString('en-IN')}</span>
        </div>
        {order.shippingCharge > 0 && (
          <div className="flex justify-between text-sm"><span>Shipping</span><span>₹{order.shippingCharge.toLocaleString('en-IN')}</span></div>
        )}
        <div className="flex justify-between font-semibold mt-2">
          <span>Total</span><span>₹{order.total.toLocaleString('en-IN')}</span>
        </div>
      </div>
      <div className="border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-2">Shipping address</h2>
        <p>{addr.fullName}, {addr.phone}</p>
        <p>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
        <p>{addr.city}, {addr.state} - {addr.pincode}</p>
        {order.trackingNumber && (
          <p className="mt-2 text-sm text-gold-600">Tracking: {order.trackingNumber}</p>
        )}
      </div>
    </main>
  );
}
