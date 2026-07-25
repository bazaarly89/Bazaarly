import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

const emptyForm = { code: '', type: 'percent', value: '', minOrderValue: '', maxDiscount: '', usageLimit: '' };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const load = () => AdminApi.coupons().then((r) => setCoupons(r.coupons));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await AdminApi.createCoupon({
      ...form,
      value: Number(form.value),
      minOrderValue: Number(form.minOrderValue || 0),
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      usageLimit: Number(form.usageLimit || 0),
    });
    setForm(emptyForm);
    load();
  };

  const toggleActive = async (c) => { await AdminApi.updateCoupon(c.id, { isActive: c.is_active ? 0 : 1 }); load(); };
  const remove = async (id) => { if (!confirm('Delete this coupon?')) return; await AdminApi.deleteCoupon(id); load(); };

  return (
    <div>
      <h1 className="section-title mb-6">Coupons</h1>
      <form onSubmit={submit} className="card mb-6 grid gap-3 p-6 sm:grid-cols-3">
        <input required placeholder="Code (e.g. SAVE20)" className="input" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
        <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
          <option value="percent">Percent Off</option>
          <option value="flat">Flat Amount Off</option>
        </select>
        <input required type="number" placeholder="Value" className="input" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
        <input type="number" placeholder="Min Order Value" className="input" value={form.minOrderValue} onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))} />
        <input type="number" placeholder="Max Discount (optional)" className="input" value={form.maxDiscount} onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))} />
        <input type="number" placeholder="Usage Limit" className="input" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} />
        <button className="btn-primary sm:col-span-3">Create Coupon</button>
      </form>

      <div className="card overflow-x-auto p-6">
        <table className="w-full min-w-[650px] text-sm">
          <thead><tr className="text-left text-slate-400"><th className="pb-2">Code</th><th>Type</th><th>Value</th><th>Used</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="py-2 font-semibold">{c.code}</td>
                <td className="capitalize">{c.type}</td>
                <td>{c.type === 'percent' ? `${c.value}%` : `₹${c.value}`}</td>
                <td>{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</td>
                <td>{c.is_active ? 'Active' : 'Inactive'}</td>
                <td className="space-x-3 text-right">
                  <button onClick={() => toggleActive(c)} className="text-brand-600 hover:underline">{c.is_active ? 'Disable' : 'Enable'}</button>
                  <button onClick={() => remove(c.id)} className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
