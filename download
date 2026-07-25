import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Api } from '../api/client';

const STATUS_COLORS = {
  placed: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-amber-100 text-amber-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function MyOrders() {
  const [orders, setOrders] = useState(null);

  useEffect(() => { Api.myOrders().then((r) => setOrders(r.orders)); }, []);

  if (!orders) return <div className="container-app py-20 text-center text-slate-400">Loading orders…</div>;

  if (orders.length === 0) {
    return (
      <div className="container-app py-24 text-center">
        <h1 className="section-title">No orders yet</h1>
        <Link to="/products" className="btn-primary mt-6 inline-flex">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      <h1 className="section-title mb-8">My Orders</h1>
      <div className="space-y-4">
        {orders.map((o) => (
          <Link to={`/orders/${o.id}`} key={o.id} className="card block p-5 transition hover:shadow-cardHover">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">Order #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString()}</p>
                <p className="mt-1 text-sm text-slate-600">{o.items.length} item(s) · ₹{o.total.toLocaleString()}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_COLORS[o.status] || 'bg-slate-100 text-slate-600'}`}>
                {o.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {o.items.slice(0, 5).map((it) => (
                <img key={it.id} src={it.image} alt={it.title} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
