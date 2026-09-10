import React, { useEffect, useState } from 'react';
import { Api } from '../api/client';

const DEFAULT_UPDATED = 'January 2026';

// Fallback sections used until the content loads (or if none were ever set from admin).
const DEFAULT_SECTIONS = [
  { title: 'Acceptance of Terms', body: 'By accessing or using Dostivox, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the site.' },
  { title: 'Account Registration', body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.' },
  { title: 'Orders & Pricing', body: 'All prices are listed in INR and are subject to change without notice. We reserve the right to refuse or cancel any order due to pricing errors, stock unavailability, or suspected fraud.' },
  { title: 'Payments', body: 'Payments are processed via Razorpay for online payments, or collected in cash for Cash on Delivery orders. By placing an order, you authorize us to charge the selected payment method for the order total.' },
  { title: 'Shipping & Delivery', body: 'Delivery timelines are estimates and may vary based on location and carrier delays. Risk of loss transfers to you upon delivery.' },
  { title: 'Returns & Cancellations', body: 'Orders can be cancelled before they are shipped from My Orders. Return eligibility varies by product category and is detailed on each product page.' },
  { title: 'Intellectual Property', body: 'All content on this site — including logos, product photography, and text — is the property of Dostivox or its licensors and may not be reproduced without permission.' },
  { title: 'Limitation of Liability', body: 'Dostivox is not liable for indirect, incidental, or consequential damages arising from use of the site or products purchased through it, to the maximum extent permitted by law.' },
  { title: 'Governing Law', body: 'These terms are governed by the laws of India, without regard to conflict of law principles.' },
];

export default function Terms() {
  const [updated, setUpdated] = useState(DEFAULT_UPDATED);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);

  useEffect(() => {
    Api.siteContent()
      .then(({ content }) => {
        if (content?.terms_updated) setUpdated(content.terms_updated);
        if (content?.terms_sections) {
          try {
            const parsed = JSON.parse(content.terms_sections);
            if (Array.isArray(parsed) && parsed.length) setSections(parsed);
          } catch { /* keep defaults if JSON is malformed */ }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="container-app py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="section-title">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: {updated}</p>
        <div className="mt-8 space-y-6">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="font-semibold text-lg text-slate-800">{s.title}</h2>
              <p className="mt-1 text-slate-600 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
