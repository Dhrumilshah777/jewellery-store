'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext';
import { cartApi, ordersApi } from '@/lib/api';

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      order_id: string;
      name: string;
      description?: string;
      handler: (res: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
      prefill?: { name?: string; email?: string; contact?: string };
      modal?: { ondismiss: () => void };
    }) => { open: () => void };
  }
}

type CartItem = {
  product: string | { _id: string; name?: string };
  quantity: number;
  price: number;
  name?: string;
  image?: string | null;
  sku?: string;
  productType?: string;
  goldPurity?: string;
};

type Cart = {
  _id: string;
  items: CartItem[];
  itemCount?: number;
  subtotal?: number;
};

export default function CartPage() {
  const { isAuthenticated, accessToken } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address' | 'done'>('cart');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderError, setOrderError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }
    cartApi
      .get(accessToken)
      .then((res) => {
        if (res.success && res.cart) setCart(res.cart as Cart);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, accessToken]);

  async function updateQty(productId: string, quantity: number) {
    if (!accessToken) return;
    setUpdating(productId);
    const res = await cartApi.updateItem(accessToken, productId, quantity);
    if (res.success && res.cart) setCart(res.cart as Cart);
    setUpdating(null);
  }

  async function removeItem(productId: string) {
    if (!accessToken) return;
    setUpdating(productId);
    const res = await cartApi.removeItem(accessToken, productId);
    if (res.success && res.cart) setCart(res.cart as Cart);
    setUpdating(null);
  }

  const addressPayload = useCallback(
    () => ({
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
    }),
    [fullName, phone, addressLine1, addressLine2, city, state, pincode]
  );

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setOrderError('');
    setPlacing(true);

    if (paymentMethod === 'cod') {
      const res = await ordersApi.create(accessToken, {
        shippingAddress: addressPayload(),
        paymentMethod: 'cod',
        notes: notes.trim() || undefined,
      });
      setPlacing(false);
      if (res.success && res.data && typeof res.data === 'object' && '_id' in res.data) {
        const order = res.data as { _id: string; orderNumber?: string };
        setOrderId(order._id);
        setOrderNumber(order.orderNumber || null);
        setCart(null);
        setCheckoutStep('done');
      } else {
        setOrderError(res.message || 'Failed to place order');
      }
      return;
    }

    // Pay online: create payment order then open Razorpay
    const createRes = await ordersApi.createPaymentOrder(accessToken, {
      shippingAddress: addressPayload(),
      notes: notes.trim() || undefined,
    });
    if (!createRes.success || !createRes.data) {
      setPlacing(false);
      setOrderError(createRes.message || 'Could not create payment order');
      return;
    }
    const { orderId: oId, orderNumber: oNum, razorpayOrderId, amount, currency, keyId } = createRes.data;
    if (!window.Razorpay) {
      setPlacing(false);
      setOrderError('Payment gateway is loading. Please try again.');
      return;
    }
    const rz = new window.Razorpay({
      key: keyId,
      amount,
      currency,
      order_id: razorpayOrderId,
      name: 'Jewellery Store',
      description: `Order ${oNum}`,
      prefill: { name: fullName.trim(), contact: phone.trim() },
      handler: async (response) => {
        const verifyRes = await ordersApi.verifyPayment(accessToken, {
          orderId: oId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
        setPlacing(false);
        if (verifyRes.success && verifyRes.data && typeof verifyRes.data === 'object' && '_id' in verifyRes.data) {
          const order = verifyRes.data as { _id: string; orderNumber?: string };
          setOrderId(order._id);
          setOrderNumber(order.orderNumber || null);
          setCart(null);
          setCheckoutStep('done');
        } else {
          setOrderError(verifyRes.message || 'Payment verification failed');
        }
      },
      modal: {
        ondismiss: () => setPlacing(false),
      },
    });
    rz.open();
  }

  if (!isAuthenticated) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gold-800 mb-4">Your Cart</h1>
        <p className="text-gray-600 mb-4">Please log in to view and manage your cart.</p>
        <Link href="/login" className="text-gold-600 hover:underline">Login</Link>
      </main>
    );
  }

  if (loading) {
    return <main className="max-w-7xl mx-auto px-4 py-8"><p className="text-gray-500">Loading cart...</p></main>;
  }

  if (checkoutStep === 'done' && orderId) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-md mx-auto border border-gray-200 rounded-xl p-8 bg-white">
          <h1 className="text-2xl font-bold text-gold-800 mb-2">Order placed</h1>
          {orderNumber && <p className="text-gray-700 font-medium mb-1">Order #{orderNumber}</p>}
          <p className="text-gray-600 mb-4">Thank you. Your order has been placed. Pan India delivery.</p>
          <Link href={`/orders/${orderId}`} className="text-gold-600 hover:underline">View order</Link>
          <span className="mx-2">|</span>
          <Link href="/products" className="text-gold-600 hover:underline">Continue shopping</Link>
        </div>
      </main>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (checkoutStep === 'address') {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gold-800 mb-6">Shipping address</h1>
        <form onSubmit={placeOrder} className="max-w-lg space-y-4">
          {orderError && <p className="text-red-600 bg-red-50 p-2 rounded">{orderError}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="10-digit" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address line 1 *</label>
            <input type="text" required value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address line 2</label>
            <input type="text" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <input type="text" required value={state} onChange={(e) => setState(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
            <input type="text" required value={pincode} onChange={(e) => setPincode(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="6 digits" maxLength={6} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment method</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                <span>Cash on delivery (COD)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="payment" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} />
                <span>Pay online (Card / UPI)</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={2} />
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={() => setCheckoutStep('cart')} className="px-4 py-2 border border-gray-300 rounded-lg">Back</button>
            <button type="submit" disabled={placing} className="px-6 py-2.5 bg-gold-600 text-white rounded-lg hover:bg-gold-700 disabled:opacity-50">
              {placing ? 'Processing...' : paymentMethod === 'online' ? `Pay ₹${subtotal.toLocaleString('en-IN')}` : `Place order · ₹${subtotal.toLocaleString('en-IN')}`}
            </button>
          </div>
        </form>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gold-800 mb-4">Your Cart</h1>
        <p className="text-gray-600 mb-4">Your cart is empty.</p>
        <Link href="/products" className="text-gold-600 hover:underline">Continue shopping</Link>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <h1 className="text-2xl font-bold text-gold-800 mb-6">Your Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const id = typeof item.product === 'string' ? item.product : item.product?._id;
            const name = item.name || (typeof item.product === 'object' && item.product?.name) || 'Product';
            const img = item.image;
            return (
              <div key={id} className="flex gap-4 border border-gray-200 rounded-xl p-4 bg-white">
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0">
                  {img ? (
                    <Image src={img} alt={name} fill className="object-cover" sizes="96px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{name}</p>
                  <p className="text-gold-600">₹{item.price.toLocaleString('en-IN')} × {item.quantity}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateQty(id, Math.max(1, parseInt(e.target.value, 10) || 1))}
                      disabled={updating === id}
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(id)}
                      disabled={updating === id}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="font-medium text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
              </div>
            );
          })}
        </div>
        <div>
          <div className="border border-gray-200 rounded-xl p-6 bg-white sticky top-24">
            <p className="text-gray-600">Subtotal</p>
            <p className="text-2xl font-bold text-gold-800">₹{subtotal.toLocaleString('en-IN')}</p>
            <p className="text-sm text-gray-500 mt-1">Shipping calculated at checkout (Pan India)</p>
            <button
              type="button"
              onClick={() => setCheckoutStep('address')}
              className="w-full mt-4 py-2.5 bg-gold-600 text-white rounded-lg hover:bg-gold-700"
            >
              Proceed to checkout
            </button>
            <Link href="/products" className="block text-center text-gold-600 hover:underline mt-3 text-sm">Continue shopping</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
