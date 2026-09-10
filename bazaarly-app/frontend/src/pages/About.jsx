import React, { useEffect, useState } from 'react';
import { Api } from '../api/client';

// Fallback text used only until the content loads (or if a key was never set).
const DEFAULT_CONTENT = {
  about_heading: 'About Dostivox',
  about_para1: 'Dostivox is a modern e-commerce destination bringing together premium electronics, fashion, home essentials, beauty and sports products under one roof. We partner with trusted brands and focus on quality, fast delivery, and a shopping experience that feels effortless from browse to doorstep.',
  about_para2: "Founded with a simple idea — shopping online should feel as good as the products themselves — we've built our platform around clean design, transparent pricing, and responsive support.",
  about_stat1_num: '50K+',
  about_stat1_label: 'Happy Customers',
  about_stat2_num: '10K+',
  about_stat2_label: 'Products',
  about_stat3_num: '4.7★',
  about_stat3_label: 'Average Rating',
};

export default function About() {
  const [content, setContent] = useState(DEFAULT_CONTENT);

  useEffect(() => {
    Api.siteContent()
      .then(({ content }) => {
        const cleaned = Object.fromEntries(
          Object.entries(content || {}).filter(([, v]) => v !== '' && v != null)
        );
        setContent((c) => ({ ...c, ...cleaned }));
      })
      .catch(() => {});
  }, []);

  const stats = [
    [content.about_stat1_num, content.about_stat1_label],
    [content.about_stat2_num, content.about_stat2_label],
    [content.about_stat3_num, content.about_stat3_label],
  ];

  return (
    <div className="container-app py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="section-title">{content.about_heading}</h1>
        <p className="mt-4 leading-relaxed text-slate-600">{content.about_para1}</p>
        <p className="mt-4 leading-relaxed text-slate-600">{content.about_para2}</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {stats.map(([n, l]) => (
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
