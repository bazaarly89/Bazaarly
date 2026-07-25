import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Api } from '../api/client';

const STEPS = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];
const LABELS = { placed: 'Order Placed', confirmed: 'Confirmed', shipped: 'Shipped', out_for_delivery: 'Out for Delivery', delivered: 'Delivered' };

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = () => Api.orderDetails(id).then((r) => setOrder(r.order));
  useEffect(() => { load(); }, [id]);

  if (!order) return <div className="container-app py-20 text-center text-slate-400">Loading order…</div>;

  const currentStep = order.status === 'cancelled' ? -1 : STEPS.indexOf(order.status);

  const cancelOrder = async () => {
    setCancelling(true);
    try { await Api.cancelOrder(id); await load(); } finally { setCancelling(false); }
  };

  return (
    <div className="container-app py-10">
      <h1 className="section-title">Order #{order.id.slice(0, 8)}</h1>
      <p className="mt-1 text-sm text-slate-500">Placed on {new Date(order.created_at).toLocaleString()}</p>

      {order.status === 'cancelled' ? (
        <div className="card mt-6 p-6 text-red-600 font-semibold">This order was cancelled.</div>
      ) : (
        <div className="card mt-6 p-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => (
              <div key={step} className="flex flex-1 flex-col items-center text-center">
                <div className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${i <= currentStep ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {i + 1}
                </div>
                <p className={`mt-2 text-xs font-medium ${i <= currentStep ? 'text-brand-700' : 'text-slate-400'}`}>{LABELS[step]}</p>
                {i < STEPS.length - 1 && <div className={`mt-[-20px] ml-[50%] h-0.5 w-full ${i < currentStep ? 'bg-brand-500' : 'bg-slate-100'}`} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="mb-4 font-semibold text-lg">Items</h2>
          <div className="space-y-3">
            {order.items.map((it) => (
              <div key={it.id} className="card flex gap-4 p-4">
                <img src={it.image} alt={it.title} className="h-16 w-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-medium">{it.title}</p>
                  <p className="text-sm text-slate-500">Qty {it.quantity} × ₹{it.price?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="mb-3 mt-8 font-semibold text-lg">Tracking History</h2>
          <div className="space-y-3">
            {order.tracking.map((t) => (
              <div key={t.id} className="flex gap-3 text-sm">
                <span className="text-slate-400">{new Date(t.created_at).toLocaleString()}</span>
                <span className="font-medium capitalize">{t.status.replace(/_/g, ' ')}</span>
                <span className="text-slate-500">{t.note}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card h-fit p-6">
          <h2 className="mb-3 font-semibold text-lg">Shipping Address</h2>
          {order.address && (
            <p className="text-sm text-slate-600">{order.address.full_name}<br />{order.address.line1}, {order.address.line2}<br />{order.address.city}, {order.address.state} {order.address.pincode}<br />{order.address.phone}</p>
          )}
          <div className="mt-5 space-y-1 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal.toLocaleString()}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount.toLocaleString()}</span></div>}
            <div className="flex justify-between"><span>Shipping</span><span>{order.shipping_fee ? `₹${order.shipping_fee}` : 'Free'}</span></div>
            <div className="flex justify-between font-bold text-base pt-2"><span>Total</span><span>₹{order.total.toLocaleString()}</span></div>
          </div>
          <p className="mt-3 text-xs text-slate-400">Payment: {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid Online'} ({order.payment_status})</p>

          {['placed', 'confirmed'].includes(order.status) && (
            <button onClick={cancelOrder} disabled={cancelling} className="btn-outline mt-5 w-full !border-red-400 !text-red-500 hover:!bg-red-50">
              {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
