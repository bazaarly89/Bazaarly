import React from 'react';

// Known merchants get a recognizable brand-colored badge. Anything else
// (admin can type any merchant name) falls back to a neutral badge that
// just shows the name — nothing here is tied to a specific product.
const MERCHANT_STYLES = {
  amazon: { label: 'Amazon', bg: '#232F3E', color: '#FF9900', border: '#232F3E' },
  flipkart: { label: 'Flipkart', bg: '#2874F0', color: '#FFE500', border: '#2874F0' },
};

export const KNOWN_MERCHANTS = [
  { value: 'Amazon', label: 'Amazon' },
  { value: 'Flipkart', label: 'Flipkart' },
  { value: 'Other', label: 'Other / Custom' },
];

export default function MerchantBadge({ merchant, size = 'sm' }) {
  if (!merchant) return null;
  const key = merchant.trim().toLowerCase();
  const style = MERCHANT_STYLES[key];
  const sizeClasses = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-[11px]';

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

  // Unknown / custom merchant name typed by the admin
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 font-semibold text-slate-600 ${sizeClasses}`}
      title={`Sold via ${merchant}`}
    >
      {merchant}
    </span>
  );
}
