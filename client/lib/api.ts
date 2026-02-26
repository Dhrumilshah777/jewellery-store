const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

type RequestOptions = RequestInit & {
  token?: string | null;
};

// Shared API response types
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type Order = {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  user?: { name: string; email: string };
  createdAt: string;
};

export type OrderDetail = Order & {
  subtotal: number;
  shippingCharge: number;
  items: { name: string; quantity: number; price: number; total: number }[];
  shippingAddress: { fullName: string; phone: string; addressLine1: string; addressLine2?: string; city: string; state: string; pincode: string };
  trackingNumber?: string;
};

export type Product = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number | null;
  category: string;
  goldPurity?: string | null;
  productType: string;
  isActive?: boolean;
  isFeatured?: boolean;
  sku?: string;
  images?: { url: string; alt?: string }[];
  stock?: { quantity: number; trackInventory: boolean };
};

export async function api<T>(
  path: string,
  options: RequestOptions = {}
): Promise<{ data?: T; success: boolean; message?: string; errors?: unknown; pagination?: Pagination }> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, message: json.message || 'Request failed', errors: json.errors };
  }
  return { ...json, success: json.success !== false };
}

// Auth endpoints return { success, user, accessToken?, refreshToken? } at top level (not under data)
export type AuthMeResponse = { success: boolean; user?: unknown; message?: string; errors?: unknown };
export type AuthLoginResponse = { success: boolean; user?: unknown; accessToken?: string; refreshToken?: string; message?: string; errors?: unknown };

export const authApi = {
  register: (body: { email: string; password: string; name: string; phone?: string }) =>
    api('/auth/register', { method: 'POST', body: JSON.stringify(body) }) as Promise<AuthLoginResponse>,
  login: (body: { email: string; password: string }) =>
    api('/auth/login', { method: 'POST', body: JSON.stringify(body) }) as Promise<AuthLoginResponse>,
  refresh: (refreshToken: string) =>
    api('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }) as Promise<AuthLoginResponse>,
  me: (token: string) =>
    api('/auth/me', { method: 'GET', token }) as Promise<AuthMeResponse>,
  logout: (token: string) =>
    api('/auth/logout', { method: 'POST', token }),
};

export const productsApi = {
  list: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return api<Product[]>(`/products${q ? `?${q}` : ''}`);
  },
  bySlug: (slug: string) => api<Product>(`/products/slug/${slug}`),
  byId: (id: string) => api<Product>(`/products/${id}`),
};

// Cart endpoints return { success, cart } at top level (not under data)
export type CartApiResponse = { success: boolean; cart?: unknown; message?: string; errors?: unknown };

export const cartApi = {
  get: (token: string) => api('/cart', { token }) as Promise<CartApiResponse>,
  addItem: (token: string, productId: string, quantity?: number) =>
    api('/cart/items', {
      method: 'POST',
      token,
      body: JSON.stringify({ productId, quantity }),
    }) as Promise<CartApiResponse>,
  updateItem: (token: string, productId: string, quantity: number) =>
    api('/cart/items', {
      method: 'PATCH',
      token,
      body: JSON.stringify({ productId, quantity }),
    }) as Promise<CartApiResponse>,
  removeItem: (token: string, productId: string) =>
    api(`/cart/items/${productId}`, { method: 'DELETE', token }) as Promise<CartApiResponse>,
  clear: (token: string) => api('/cart', { method: 'DELETE', token }),
};

export const ordersApi = {
  create: (token: string, body: { shippingAddress: unknown; paymentMethod?: string; notes?: string }) =>
    api<{ data: unknown }>('/orders', { method: 'POST', token, body: JSON.stringify(body) }),
  createPaymentOrder: (token: string, body: { shippingAddress: unknown; notes?: string }) =>
    api<{
      orderId: string;
      orderNumber: string;
      razorpayOrderId: string;
      amount: number;
      currency: string;
      keyId: string;
    }>('/orders/create-payment-order', { method: 'POST', token, body: JSON.stringify(body) }),
  verifyPayment: (
    token: string,
    body: { orderId: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
  ) =>
    api<{ data: unknown }>('/orders/verify-payment', { method: 'POST', token, body: JSON.stringify(body) }),
  list: (token: string) => api<Order[]>('/orders', { token }),
  get: (token: string, id: string) => api<OrderDetail>(`/orders/${id}`, { token }),
};

export const adminApi = {
  uploadImage: (token: string, file: File, folder?: string) => {
    const form = new FormData();
    form.append('image', file);
    if (folder) form.append('folder', folder);
    return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/admin/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }).then((r) => r.json()) as Promise<{ success: boolean; url?: string; message?: string }>;
  },
  products: {
    list: (token: string, params?: Record<string, string>) => {
      const q = new URLSearchParams(params).toString();
      return api<Product[]>(`/admin/products${q ? `?${q}` : ''}`, { token });
    },
    create: (token: string, body: unknown) =>
      api<{ data: unknown }>('/admin/products', { method: 'POST', token, body: JSON.stringify(body) }),
    update: (token: string, id: string, body: unknown) =>
      api<{ data: unknown }>(`/admin/products/${id}`, { method: 'PATCH', token, body: JSON.stringify(body) }),
    delete: (token: string, id: string) =>
      api<{ data: unknown }>(`/admin/products/${id}`, { method: 'DELETE', token }),
  },
  orders: {
    list: (token: string, params?: Record<string, string>) => {
      const q = new URLSearchParams(params).toString();
      return api<Order[]>(`/admin/orders${q ? `?${q}` : ''}`, { token });
    },
    updateStatus: (token: string, id: string, body: { status?: string; paymentStatus?: string; trackingNumber?: string; trackingUrl?: string }) =>
      api<{ data: unknown }>(`/admin/orders/${id}`, { method: 'PATCH', token, body: JSON.stringify(body) }),
  },
};
