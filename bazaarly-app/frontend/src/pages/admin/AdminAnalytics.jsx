import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);

  useEffect(() => { AdminApi.analyticsOverview().then(setData); }, []);
  if (!data) return <p className="text-slate-400">Loading analytics…</p>;

  const conversionRate = data.conversionInputs.totalUsers
    ? ((data.conversionInputs.usersWithOrders / data.conversionInputs.totalUsers) * 100).toFixed(1)
    : 0;
  const maxItems = Math.max(...data.categoryBreakdown.map((c) => c.items_sold || 0), 1);

  return (
    <div>
      <h1 className="section-title mb-6">Analytics</h1>

      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-slate-500">Total Customers</p><p className="font-display text-2xl font-bold">{data.conversionInputs.totalUsers}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Customers Who Ordered</p><p className="font-display text-2xl font-bold">{data.conversionInputs.usersWithOrders}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Conversion Rate</p><p className="font-display text-2xl font-bold text-brand-600">{conversionRate}%</p></div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-semibold">Sales by Category</h2>
        <div className="space-y-3">
          {data.categoryBreakdown.map((c) => (
            <div key={c.name}>
              <div className="flex justify-between text-sm mb-1"><span>{c.name}</span><span className="font-semibold">{c.items_sold} items</span></div>
              <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${(c.items_sold / maxItems) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
