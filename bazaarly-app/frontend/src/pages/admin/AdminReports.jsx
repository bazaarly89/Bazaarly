import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

export default function AdminReports() {
  const [sales, setSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    AdminApi.salesReport({}).then((r) => setSales(r.rows));
    AdminApi.topProducts().then((r) => setTopProducts(r.rows));
  }, []);

  const totalRevenue = sales.reduce((s, r) => s + (r.revenue || 0), 0);
  const totalOrders = sales.reduce((s, r) => s + (r.orders || 0), 0);

  return (
    <div>
      <h1 className="section-title mb-6">Reports</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-5"><p className="text-sm text-slate-500">Total Revenue</p><p className="font-display text-2xl font-bold text-brand-600">₹{totalRevenue.toLocaleString()}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Total Orders</p><p className="font-display text-2xl font-bold">{totalOrders}</p></div>
      </div>

      <div className="card mb-6 overflow-x-auto p-6">
        <h2 className="mb-4 font-semibold">Sales by Day</h2>
        <table className="w-full min-w-[400px] text-sm">
          <thead><tr className="text-left text-slate-400"><th className="pb-2">Date</th><th>Orders</th><th>Revenue</th></tr></thead>
          <tbody>
            {sales.map((r) => (
              <tr key={r.day} className="border-t border-slate-100">
                <td className="py-2">{r.day}</td><td>{r.orders}</td><td>₹{r.revenue?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card overflow-x-auto p-6">
        <h2 className="mb-4 font-semibold">Top Selling Products</h2>
        <table className="w-full min-w-[500px] text-sm">
          <thead><tr className="text-left text-slate-400"><th className="pb-2">Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
          <tbody>
            {topProducts.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="py-2">{p.title}</td><td>{p.units_sold}</td><td>₹{p.revenue?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
