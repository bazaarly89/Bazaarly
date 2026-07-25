import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FAQS = [
  ['How do I track my order?', 'Go to My Orders and click on any order to see its live tracking timeline, from placement to delivery.'],
  ['What payment methods do you accept?', 'We accept all major cards, UPI, and net banking via Razorpay, as well as Cash on Delivery for eligible orders.'],
  ['How do I cancel an order?', 'Orders can be cancelled from the order details page as long as they haven\'t been shipped yet.'],
  ['How do I use a coupon code?', 'Enter your coupon code in the "Coupon code" field at checkout and click Apply — the discount will reflect in your order summary.'],
  ['What is your return policy?', 'Return eligibility varies by product and is listed on the product page. Most items can be returned within 7–15 days of delivery in original condition.'],
  ['How do I reset my password?', 'Click "Forgot password?" on the sign-in page, enter your email, and follow the reset instructions sent to you.'],
];

export default function HelpCenter() {
  const [open, setOpen] = useState(0);

  return (
    <div className="container-app py-14">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="section-title">Help Center</h1>
        <p className="mt-2 text-slate-500">Answers to the most common questions. Still stuck? <Link to="/contact" className="text-brand-600 hover:underline">Contact us</Link>.</p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl space-y-3">
        {FAQS.map(([q, a], i) => (
          <div key={q} className="card overflow-hidden">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between p-5 text-left font-semibold">
              {q}
              <span className={`transition-transform ${open === i ? 'rotate-45' : ''}`}>+</span>
            </button>
            {open === i && <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">{a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
