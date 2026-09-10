import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [edits, setEdits] = useState({});

  const load = () => AdminApi.inventory().then((r) => setItems(r.items));
  useEffect(() => { load(); }, []);

  const save = async (id) => {
    await AdminApi.updateStock(id, Number(edits[id]));
    setEdits((e) => ({ ...e, [id]: undefined }));
    load();
  };

  return (
    <div>
      <h1 className="section-title mb-6">Inventory</h1>
      <div className="card overflow-x-auto p-6">
        <table className="w-full min-w-[600px] text-sm">
          <thead><tr className="text-left text-slate-400"><th className="pb-2">Product</th><th>SKU</th><th>Price</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-slate-100">
                <td className="py-2">{it.title}</td>
                <td>{it.sku}</td>
                <td>₹{it.price}</td>
                <td className={it.stock <= 5 ? 'text-red-500 font-semibold' : ''}>
                  <input type="number" className="input w-24 py-1" defaultValue={it.stock}
                    onChange={(e) => setEdits((ed) => ({ ...ed, [it.id]: e.target.value }))} />
                </td>
                <td>
                  {edits[it.id] !== undefined && (
                    <button onClick={() => save(it.id)} className="text-brand-600 font-semibold hover:underline">Save</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
