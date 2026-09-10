import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Api } from '../api/client';

const DEFAULT_HEADING = 'Help Center';
const DEFAULT_SUBTITLE = 'Answers to the most common questions.';

// Fallback FAQs used until the content loads (or if none were ever set from admin).
const DEFAULT_FAQS = [
  { q: 'How do I track my order?', a: 'Go to My Orders and click on any order to see its live tracking timeline, from placement to delivery.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major cards, UPI, and net banking via Razorpay, as well as Cash on Delivery for eligible orders.' },
  { q: 'How do I cancel an order?', a: 'Orders can be cancelled from the order details page as long as they haven\'t been shipped yet.' },
  { q: 'How do I use a coupon code?', a: 'Enter your coupon code in the "Coupon code" field at checkout and click Apply — the discount will reflect in your order summary.' },
  { q: 'What is your return policy?', a: 'Return eligibility varies by product and is listed on the product page. Most items can be returned within 7–15 days of delivery in original condition.' },
  { q: 'How do I reset my password?', a: 'Click "Forgot password?" on the sign-in page, enter your email, and follow the reset instructions sent to you.' },
];

export default function HelpCenter() {
  const [open, setOpen] = useState(0);
  const [heading, setHeading] = useState(DEFAULT_HEADING);
  const [subtitle, setSubtitle] = useState(DEFAULT_SUBTITLE);
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);

  useEffect(() => {
    Api.siteContent()
      .then(({ content }) => {
        if (content?.help_heading) setHeading(content.help_heading);
        if (content?.help_subtitle) setSubtitle(content.help_subtitle);
        if (content?.help_faqs) {
          try {
            const parsed = JSON.parse(content.help_faqs);
            if (Array.isArray(parsed) && parsed.length) setFaqs(parsed);
          } catch { /* keep defaults if JSON is malformed */ }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="container-app py-14">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="section-title">{heading}</h1>
        <p className="mt-2 text-slate-500">{subtitle} Still stuck? <Link to="/contact" className="text-brand-600 hover:underline">Contact us</Link>.</p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="card overflow-hidden">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between p-5 text-left font-semibold">
              {f.q}
              <span className={`transition-transform ${open === i ? 'rotate-45' : ''}`}>+</span>
            </button>
            {open === i && <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">{f.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
