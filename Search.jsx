import React from 'react';

const SECTIONS = [
  ['Acceptance of Terms', 'By accessing or using Dostivox, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the site.'],
  ['Account Registration', 'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.'],
  ['Orders & Pricing', 'All prices are listed in INR and are subject to change without notice. We reserve the right to refuse or cancel any order due to pricing errors, stock unavailability, or suspected fraud.'],
  ['Payments', 'Payments are processed via Razorpay for online payments, or collected in cash for Cash on Delivery orders. By placing an order, you authorize us to charge the selected payment method for the order total.'],
  ['Shipping & Delivery', 'Delivery timelines are estimates and may vary based on location and carrier delays. Risk of loss transfers to you upon delivery.'],
  ['Returns & Cancellations', 'Orders can be cancelled before they are shipped from My Orders. Return eligibility varies by product category and is detailed on each product page.'],
  ['Intellectual Property', 'All content on this site — including logos, product photography, and text — is the property of Dostivox or its licensors and may not be reproduced without permission.'],
  ['Limitation of Liability', 'Dostivox is not liable for indirect, incidental, or consequential damages arising from use of the site or products purchased through it, to the maximum extent permitted by law.'],
  ['Governing Law', 'These terms are governed by the laws of India, without regard to conflict of law principles.'],
];

export default function Terms() {
  return (
    <div className="container-app py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="section-title">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-400">Last updated: January 2026</p>
        <div className="mt-8 space-y-6">
          {SECTIONS.map(([title, body]) => (
            <div key={title}>
              <h2 className="font-semibold text-lg text-slate-800">{title}</h2>
              <p className="mt-1 text-slate-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
