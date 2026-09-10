import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api } from '../api/client';
import { useCart } from '../context/CartContext';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { items, subtotal, refresh } = useCart();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Home', full_name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' });
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Api.getAddresses().then((r) => {
      setAddresses(r.addresses);
      const def = r.addresses.find((a) => a.is_default) || r.addresses[0];
      if (def) setAddressId(def.id);
      else setShowAddressForm(true);
    });
  }, []);

  const discount = couponResult?.discount || 0;
  const total = Math.max(0, subtotal - discount);

  const saveAddress = async (e) => {
    e.preventDefault();
    const { addresses } = await Api.addAddress({ ...newAddress, is_default: true });
    setAddresses(addresses);
    setAddressId(addresses[0].id);
    setShowAddressForm(false);
  };

  const applyCoupon = async () => {
    setCouponError('');
    try {
      const result = await Api.validateCoupon(couponCode, subtotal);
      setCouponResult(result);
    } catch (e) { setCouponError(e.message); setCouponResult(null); }
  };

  const placeOrder = async () => {
    setError('');
    if (!addressId) return setError('Please select or add a shipping address.');
    setPlacing(true);
    try {
      if (paymentMethod === 'cod') {
        const { order } = await Api.placeCODOrder({ addressId, couponCode: couponResult ? couponCode : undefined });
        await refresh();
        navigate(`/orders/${order.id}`);
        return;
      }

      const ok = await loadRazorpayScript();
      if (!ok) { setError('Unable to load payment gateway. Please try again.'); setPlacing(false); return; }

      const { razorpayOrderId, amount, currency, keyId } = await Api.createRazorpayOrder(couponResult ? couponCode : undefined);
      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'Dostivox',
        description: 'Order Payment',
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            const { order } = await Api.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              addressId,
              couponCode: couponResult ? couponCode : undefined,
            });
            await refresh();
            navigate(`/orders/${order.id}`);
          } catch (e) { setError(e.message); }
        },
        theme: { color: '#4a5cf0' },
      });
      rzp.on('payment.failed', () => setError('Payment failed. Please try again or choose Cash on Delivery.'));
      rzp.open();
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return <div className="container-app py-20 text-center text-slate-400">Your cart is empty. <button onClick={() => navigate('/products')} className="text-brand-600 underline">Go shopping</button></div>;
  }

  return (
    <div className="container-app py-10">
      <h1 className="section-title mb-8">Checkout</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Address */}
          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-lg">Shipping Address</h2>
            <div className="space-y-3">
              {addresses.map((a) => (
                <label key={a.id} className={`block cursor-pointer rounded-xl border-2 p-4 ${addressId === a.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}>
                  <input type="radio" className="mr-2" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                  <span className="font-semibold">{a.label}</span> — {a.full_name}, {a.line1}, {a.city}, {a.state} {a.pincode}
                </label>
              ))}
            </div>
            <button onClick={() => setShowAddressForm((s) => !s)} className="mt-3 text-sm font-semibold text-brand-600 hover:underline">+ Add new address</button>

            {showAddressForm && (
              <form onSubmit={saveAddress} className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
                <input required placeholder="Full Name" className="input col-span-2" value={newAddress.full_name} onChange={(e) => setNewAddress((f) => ({ ...f, full_name: e.target.value }))} />
                <input required placeholder="Phone" className="input col-span-2" value={newAddress.phone} onChange={(e) => setNewAddress((f) => ({ ...f, phone: e.target.value }))} />
                <input required placeholder="Address Line 1" className="input col-span-2" value={newAddress.line1} onChange={(e) => setNewAddress((f) => ({ ...f, line1: e.target.value }))} />
                <input placeholder="Address Line 2 (optional)" className="input col-span-2" value={newAddress.line2} onChange={(e) => setNewAddress((f) => ({ ...f, line2: e.target.value }))} />
                <input required placeholder="City" className="input" value={newAddress.city} onChange={(e) => setNewAddress((f) => ({ ...f, city: e.target.value }))} />
                <input required placeholder="State" className="input" value={newAddress.state} onChange={(e) => setNewAddress((f) => ({ ...f, state: e.target.value }))} />
                <input required placeholder="Pincode" className="input" value={newAddress.pincode} onChange={(e) => setNewAddress((f) => ({ ...f, pincode: e.target.value }))} />
                <select className="input" value={newAddress.label} onChange={(e) => setNewAddress((f) => ({ ...f, label: e.target.value }))}>
                  <option>Home</option><option>Work</option><option>Other</option>
                </select>
                <button className="btn-primary col-span-2">Save Address</button>
              </form>
            )}
          </div>

          {/* Payment method */}
          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-lg">Payment Method</h2>
            <label className={`mb-3 flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer ${paymentMethod === 'razorpay' ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}>
              <input type="radio" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
              <span className="font-semibold">Pay Online</span> — Cards, UPI, Netbanking (Razorpay)
            </label>
            <label className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer ${paymentMethod === 'cod' ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}>
              <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
              <span className="font-semibold">Cash on Delivery</span>
            </label>
          </div>
        </div>

        {/* Order summary */}
        <div className="card h-fit p-6">
          <h2 className="mb-4 font-semibold text-lg">Order Summary</h2>
          <div className="space-y-2 text-sm text-slate-600">
            {items.map((it) => (
              <div key={it.cart_item_id} className="flex justify-between"><span>{it.title} × {it.quantity}</span><span>₹{(it.price * it.quantity).toLocaleString()}</span></div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon code" className="input" />
            <button onClick={applyCoupon} className="btn-outline px-4">Apply</button>
          </div>
          {couponError && <p className="mt-1 text-xs text-red-500">{couponError}</p>}
          {couponResult && <p className="mt-1 text-xs text-green-600">Coupon applied — you saved ₹{couponResult.discount}</p>}

          <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{discount.toLocaleString()}</span></div>}
            <div className="flex justify-between font-bold text-base pt-2"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
          </div>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          <button onClick={placeOrder} disabled={placing} className="btn-primary mt-5 w-full">
            {placing ? 'Placing order…' : paymentMethod === 'cod' ? 'Place Order (COD)' : 'Pay & Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
