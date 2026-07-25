import React, { useState } from 'react';

export default function Contact() {
  const [sent, setSent] = useState(false);
  const submit = (e) => { e.preventDefault(); setSent(true); };

  return (
    <div className="container-app py-14">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="section-title">Get in Touch</h1>
        <p className="mt-2 text-slate-500">Have a question about an order or product? We'd love to help.</p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-8 md:grid-cols-2">
        <div className="card p-6 space-y-4 text-sm text-slate-600">
          <div><p className="font-semibold text-slate-800">Email</p><p>support@dostivox.com</p></div>
          <div><p className="font-semibold text-slate-800">Phone</p><p>+91 98765 43210</p></div>
          <div><p className="font-semibold text-slate-800">Hours</p><p>Mon–Sat, 9:00 AM – 7:00 PM IST</p></div>
          <div><p className="font-semibold text-slate-800">Address</p><p>Dostivox Commerce Pvt. Ltd., Bengaluru, India</p></div>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          {sent ? (
            <p className="py-10 text-center font-semibold text-green-600">Thanks! We'll get back to you within 24 hours.</p>
          ) : (
            <>
              <input required placeholder="Your Name" className="input" />
              <input required type="email" placeholder="Your Email" className="input" />
              <input placeholder="Order ID (optional)" className="input" />
              <textarea required rows={4} placeholder="How can we help?" className="input" />
              <button className="btn-primary w-full">Send Message</button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
