import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

function StatCard({ label, value, accent }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${accent || 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => { AdminApi.dashboard().then(setData); }, []);

  if (!data) return <p className="text-slate-400">Loading dashboard…</p>;
  const maxSales = Math.max(...data.salesByDay.map((d) => d.amount || 0), 1);

  return (
    <div>
      <h1 className="section-title mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Sales" value={`₹${data.totalSales.toLocaleString()}`} accent="text-brand-600" />
        <StatCard label="Total Orders" value={data.totalOrders} />
        <StatCard label="Customers" value={data.totalCustomers} />
        <StatCard label="Products" value={data.totalProducts} />
        <StatCard label="Pending Orders" value={data.pendingOrders} accent="text-amber-600" />
        <StatCard label="Low Stock" value={data.lowStock} accent="text-red-500" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="card p-6">
          <h2 className="mb-4 font-semibold">Sales (Last 14 Days)</h2>
          <div className="flex h-48 items-end gap-2">
            {data.salesByDay.map((d) => (
              <div key={d.day} className="flex-1 group relative">
                <div className="rounded-t-md bg-brand-400 transition group-hover:bg-brand-500" style={{ height: `${Math.max(4, (d.amount / maxSales) * 100)}%` }} />
                <p className="mt-1 text-center text-[10px] text-slate-400">{d.day?.slice(5)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold">Top Products</h2>
          <div className="space-y-3">
            {data.topProducts.map((p) => (
              <div key={p.title} className="flex justify-between text-sm">
                <span className="text-slate-600">{p.title}</span>
                <span className="font-semibold">{p.sold} sold</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-6 overflow-x-auto p-6">
        <h2 className="mb-4 font-semibold">Recent Orders</h2>
        <table className="w-full min-w-[600px] text-sm">
          <thead><tr className="text-left text-slate-400"><th className="pb-2">Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {data.recentOrders.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="py-2">#{o.id.slice(0, 8)}</td>
                <td>{o.customer_name}</td>
                <td>₹{o.total.toLocaleString()}</td>
                <td className="capitalize">{o.status.replace(/_/g, ' ')}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
