const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

type RequestOptions = RequestInit & {
  token?: string | null;
};

export async function api<T>(
  path: string,
  options: RequestOptions = {}
): Promise<{ data?: T; success: boolean; message?: string; errors?: unknown }> {
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

// Auth helpers – use with your auth state (e.g. context or cookie)
export const authApi = {
  register: (body: { email: string; password: string; name: string; phone?: string }) =>
    api<{ user: unknown; accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    api<{ user: unknown; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  refresh: (refreshToken: string) =>
    api<{ user: unknown; accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
  me: (token: string) =>
    api<{ user: unknown }>('/auth/me', { method: 'GET', token }),
  logout: (token: string) =>
    api('/auth/logout', { method: 'POST', token }),
};

export const productsApi = {
  list: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return api<{ data: unknown[]; pagination: unknown }>(`/products${q ? `?${q}` : ''}`);
  },
  bySlug: (slug: string) => api<{ data: unknown }>(`/products/slug/${slug}`),
  byId: (id: string) => api<{ data: unknown }>(`/products/${id}`),
};

export const cartApi = {
  get: (token: string) => api<{ cart: unknown }>('/cart', { token }),
  addItem: (token: string, productId: string, quantity?: number) =>
    api<{ cart: unknown }>('/cart/items', {
      method: 'POST',
      token,
      body: JSON.stringify({ productId, quantity }),
    }),
  updateItem: (token: string, productId: string, quantity: number) =>
    api<{ cart: unknown }>('/cart/items', {
      method: 'PATCH',
      token,
      body: JSON.stringify({ productId, quantity }),
    }),
  removeItem: (token: string, productId: string) =>
    api<{ cart: unknown }>(`/cart/items/${productId}`, { method: 'DELETE', token }),
  clear: (token: string) => api('/cart', { method: 'DELETE', token }),
};

export const ordersApi = {
  create: (token: string, body: { shippingAddress: unknown; paymentMethod?: string; notes?: string }) =>
    api<{ data: unknown }>('/orders', { method: 'POST', token, body: JSON.stringify(body) }),
  createPaymentOrder: (token: string, body: { shippingAddress: unknown; notes?: string }) =>
    api<{
      data: {
        orderId: string;
        orderNumber: string;
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
      };
    }>('/orders/create-payment-order', { method: 'POST', token, body: JSON.stringify(body) }),
  verifyPayment: (
    token: string,
    body: { orderId: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
  ) =>
    api<{ data: unknown }>('/orders/verify-payment', { method: 'POST', token, body: JSON.stringify(body) }),
  list: (token: string) => api<{ data: unknown[] }>('/orders', { token }),
  get: (token: string, id: string) => api<{ data: unknown }>(`/orders/${id}`, { token }),
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
      return api<{ data: unknown[]; pagination: unknown }>(`/admin/products${q ? `?${q}` : ''}`, { token });
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
      return api<{ data: unknown[]; pagination: unknown }>(`/admin/orders${q ? `?${q}` : ''}`, { token });
    },
    updateStatus: (token: string, id: string, body: { status?: string; paymentStatus?: string; trackingNumber?: string; trackingUrl?: string }) =>
      api<{ data: unknown }>(`/admin/orders/${id}`, { method: 'PATCH', token, body: JSON.stringify(body) }),
  },
};
