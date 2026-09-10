import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

const STATUSES = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const load = () => AdminApi.orders(filter || undefined).then((r) => setOrders(r.orders));
  useEffect(() => { load(); }, [filter]);

  const openOrder = async (id) => setSelected(await AdminApi.orderDetails(id).then((r) => r.order));

  const updateStatus = async (id, status) => {
    await AdminApi.updateOrderStatus(id, status);
    load();
    if (selected?.id === id) openOrder(id);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="section-title">Orders</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input w-auto">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto p-6">
        <table className="w-full min-w-[700px] text-sm">
          <thead><tr className="text-left text-slate-400"><th className="pb-2">Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="py-2">#{o.id.slice(0, 8)}</td>
                <td>{o.customer_name}</td>
                <td>₹{o.total.toLocaleString()}</td>
                <td className="capitalize">{o.payment_method} · {o.payment_status}</td>
                <td>
                  <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="input w-auto py-1 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td><button onClick={() => openOrder(o.id)} className="text-brand-600 hover:underline">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="card max-h-[85vh] w-full max-w-xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 font-semibold text-lg">Order #{selected.id.slice(0, 8)}</h2>
            <p className="text-sm text-slate-500">{selected.customer_name} · {selected.customer_email}</p>
            <div className="mt-4 space-y-2">
              {selected.items.map((it) => (
                <div key={it.id} className="flex justify-between text-sm"><span>{it.title} × {it.quantity}</span><span>₹{(it.price * it.quantity).toLocaleString()}</span></div>
              ))}
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4 text-sm font-bold flex justify-between"><span>Total</span><span>₹{selected.total.toLocaleString()}</span></div>
            <button onClick={() => setSelected(null)} className="btn-ghost mt-4 w-full">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
