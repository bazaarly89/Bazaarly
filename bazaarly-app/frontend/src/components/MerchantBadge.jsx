import React from 'react';

// If the admin has uploaded a real logo for this merchant (via Admin → Merchants,
// or a one-off upload on the offer itself), we show that image. Otherwise we
// fall back to a neutral text badge — nothing here is a bundled/hard-coded asset.
const FALLBACK_STYLES = {
  amazon: { label: 'Amazon', bg: '#232F3E', color: '#FF9900', border: '#232F3E' },
  flipkart: { label: 'Flipkart', bg: '#2874F0', color: '#FFE500', border: '#2874F0' },
};

export default function MerchantBadge({ merchant, logo, size = 'sm' }) {
  if (!merchant) return null;
  const sizeClasses = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-[11px]';

  if (logo) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white ${size === 'lg' ? 'h-8 px-2' : 'h-5 px-1.5'}`}
        title={`Sold via ${merchant}`}
      >
        <img src={logo} alt={merchant} className="h-full w-auto max-w-[90px] object-contain" />
      </span>
    );
  }

  const key = merchant.trim().toLowerCase();
  const style = FALLBACK_STYLES[key];

  if (style) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md font-bold ${sizeClasses}`}
        style={{ backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}` }}
        title={`Sold via ${style.label}`}
      >
        {style.label}
      </span>
    );
  }

  // Unknown / custom merchant name with no logo uploaded yet
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 font-semibold text-slate-600 ${sizeClasses}`}
      title={`Sold via ${merchant}`}
    >
      {merchant}
    </span>
  );
}
