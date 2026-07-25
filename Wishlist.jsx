import React from 'react';

export default function About() {
  return (
    <div className="container-app py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="section-title">About Dostivox</h1>
        <p className="mt-4 leading-relaxed text-slate-600">
          Dostivox is a modern e-commerce destination bringing together premium electronics, fashion,
          home essentials, beauty and sports products under one roof. We partner with trusted brands
          and focus on quality, fast delivery, and a shopping experience that feels effortless from
          browse to doorstep.
        </p>
        <p className="mt-4 leading-relaxed text-slate-600">
          Founded with a simple idea — shopping online should feel as good as the products themselves —
          we've built our platform around clean design, transparent pricing, and responsive support.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[['50K+', 'Happy Customers'], ['10K+', 'Products'], ['4.7★', 'Average Rating']].map(([n, l]) => (
            <div key={l} className="card p-6 text-center">
              <p className="font-display text-3xl font-bold text-brand-600">{n}</p>
              <p className="mt-1 text-sm text-slate-500">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
