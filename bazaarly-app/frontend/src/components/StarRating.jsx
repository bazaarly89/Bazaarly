import React from 'react';

export default function StarRating({ value = 0, size = 16, showValue = false, count }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex">
        {stars.map((s) => {
          const filled = value >= s;
          const half = !filled && value >= s - 0.5;
          return (
            <svg key={s} width={size} height={size} viewBox="0 0 24 24" className={filled || half ? 'text-amber-400' : 'text-slate-200'} fill="currentColor">
              {half ? (
                <>
                  <defs>
                    <linearGradient id={`half-${s}`}>
                      <stop offset="50%" stopColor="currentColor" />
                      <stop offset="50%" stopColor="#e2e8f0" />
                    </linearGradient>
                  </defs>
                  <path fill={`url(#half-${s})`} d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </>
              ) : (
                <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              )}
            </svg>
          );
        })}
      </span>
      {showValue && <span className="text-xs text-slate-500">{value?.toFixed ? value.toFixed(1) : value}{count != null ? ` (${count})` : ''}</span>}
    </span>
  );
}
