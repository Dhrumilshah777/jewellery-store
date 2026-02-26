'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    router.replace('/');
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await register({
      email,
      password,
      name,
      phone: phone || undefined,
    });
    setSubmitting(false);
    if (result.success) router.replace('/');
    else setError(result.message || 'Registration failed');
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md border border-gray-200 rounded-xl p-8 shadow-sm bg-white">
        <h1 className="text-2xl font-bold text-gold-800 mb-6">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone (optional)
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              placeholder="10-digit mobile"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              placeholder="Min 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition disabled:opacity-50"
          >
            {submitting ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-gold-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
