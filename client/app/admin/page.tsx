import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <>
      <h1 className="text-2xl font-bold text-gold-800 mb-6">Admin</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/products"
          className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition"
        >
          <h2 className="font-semibold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500 mt-1">Manage product catalog</p>
        </Link>
        <Link
          href="/admin/orders"
          className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition"
        >
          <h2 className="font-semibold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-500 mt-1">View and update orders</p>
        </Link>
      </div>
    </>
  );
}
