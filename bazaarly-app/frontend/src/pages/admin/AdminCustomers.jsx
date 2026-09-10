import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => { AdminApi.customers().then((r) => setCustomers(r.customers)); }, []);

  return (
    <div>
      <h1 className="section-title mb-6">Customers</h1>
      <div className="card overflow-x-auto p-6">
        <table className="w-full min-w-[600px] text-sm">
          <thead><tr className="text-left text-slate-400"><th className="pb-2">Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Total Spent</th><th>Joined</th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="py-2">{c.name}</td>
                <td>{c.email}</td>
                <td>{c.phone || '—'}</td>
                <td>{c.order_count}</td>
                <td>₹{c.total_spent.toLocaleString()}</td>
                <td>{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
