import React, { useState, useRef } from 'react';

export default function ImageZoom({ images = [] }) {
  const [active, setActive] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({});
  const [zooming, setZooming] = useState(false);
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
  };

  return (
    <div>
      <div
        ref={containerRef}
        className="relative aspect-square overflow-hidden rounded-xl2 bg-slate-100 cursor-zoom-in"
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={handleMouseMove}
      >
        <img
          src={images[active]}
          alt="Product"
          className="h-full w-full object-cover transition-transform duration-200"
          style={zooming ? { transform: 'scale(2)', ...zoomStyle } : {}}
        />
      </div>
      <div className="mt-4 flex gap-3">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-16 w-16 overflow-hidden rounded-lg border-2 transition ${active === i ? 'border-brand-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
          >
            <img src={img} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
