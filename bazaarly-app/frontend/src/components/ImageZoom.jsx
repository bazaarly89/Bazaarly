import React, { useRef, useState } from 'react';

const SIZE_CLASSES = {
  small: 'max-w-[280px]',
  medium: 'max-w-[420px]',
  large: 'max-w-[560px]',
  xl: 'max-w-[700px]',
};

export default function ImageZoom({ images = [], size = 'medium' }) {
  const [active, setActive] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({});
  const [zooming, setZooming] = useState(false);
  const containerRef = useRef(null);

  // --- swipe state ---
  const trackRef = useRef(null);
  const dragRef = useRef(null); // { startX, width }
  const [dragPx, setDragPx] = useState(0); // live offset while dragging, in px
  const [isDragging, setIsDragging] = useState(false);

  const count = images.length;

  const handleMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
  };

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.medium;

  const goTo = (i) => setActive(Math.max(0, Math.min(count - 1, i)));

  const onPointerDown = (e) => {
    if (count <= 1) return;
    setZooming(false);
    dragRef.current = { startX: e.clientX, containerWidth: containerRef.current.getBoundingClientRect().width };
    setIsDragging(true);
    trackRef.current.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    setDragPx(e.clientX - dragRef.current.startX);
  };
  const onPointerUp = () => {
    if (!dragRef.current) return;
    const { containerWidth } = dragRef.current;
    const threshold = containerWidth * 0.18;
    if (dragPx <= -threshold && active < count - 1) goTo(active + 1);
    else if (dragPx >= threshold && active > 0) goTo(active - 1);
    dragRef.current = null;
    setDragPx(0);
    setIsDragging(false);
  };

  const baseOffsetPct = -active * 100;
  // dragPx is in screen pixels for one slide's width; express it as a
  // percentage of the *track's* total width (count slides wide) since
  // that's what translateX% is relative to.
  const dragOffsetPct = dragRef.current ? (dragPx / (dragRef.current.containerWidth * count)) * 100 : 0;

  return (
    <div className="select-none">
      <div
        ref={containerRef}
        className={`relative aspect-square w-full ${sizeClass} touch-pan-y overflow-hidden rounded-2xl bg-slate-50 shadow-card`}
        onMouseEnter={() => !isDragging && setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={handleMouseMove}
      >
        <div
          ref={trackRef}
          className="flex h-full cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{
            width: `${count * 100}%`,
            transform: `translateX(calc(${baseOffsetPct / count}% + ${dragOffsetPct}%))`,
            transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {images.map((img, i) => (
            <div key={i} className="flex h-full items-center justify-center" style={{ width: `${100 / count}%` }}>
              <img
                src={img}
                alt="Product"
                draggable={false}
                className="h-full w-full object-contain transition-transform duration-200 cursor-zoom-in"
                style={zooming && i === active ? { transform: 'scale(2)', ...zoomStyle } : {}}
              />
            </div>
          ))}
        </div>

        {/* mobile swipe-position dots */}
        {count > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:hidden">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === active ? 'w-4 bg-brand-500' : 'w-1.5 bg-white/80 shadow'}`}
              />
            ))}
          </div>
        )}
      </div>

      {count > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${active === i ? 'border-brand-500 shadow-card' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
