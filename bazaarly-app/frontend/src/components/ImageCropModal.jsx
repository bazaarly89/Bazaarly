import React, { useEffect, useRef, useState } from 'react';

// Instagram-style "move and scale" cropper. Pure canvas + pointer events,
// no extra npm dependency needed.
//
// Props:
//   file        - the raw File the user picked
//   aspect      - target width/height ratio, e.g. 1 for square, 2.4 for a wide banner
//   outputWidth - pixel width of the exported image (height = outputWidth / aspect)
//   onCancel()  - called when the user closes without applying
//   onApply(blob) - called with the cropped image as a JPEG Blob

const BOX_W = 320; // on-screen crop box width in CSS px (scales down on tiny screens via wrapper)

export default function ImageCropModal({ file, aspect = 1, outputWidth = 1200, onCancel, onApply }) {
  const [imgEl, setImgEl] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // top-left of image, in box coordinates
  const dragRef = useRef(null);
  const boxRef = useRef(null);

  const boxH = BOX_W / aspect;

  // Load the picked file into an <img> so we know its natural size.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImgEl(img);
      setZoom(1);
      setPos({ x: 0, y: 0 }); // centered by the effect below once base scale is known
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = imgEl ? Math.max(BOX_W / imgEl.width, boxH / imgEl.height) : 1;
  const effScale = baseScale * zoom;
  const dispW = imgEl ? imgEl.width * effScale : 0;
  const dispH = imgEl ? imgEl.height * effScale : 0;

  // Center the image the first time it loads (or whenever zoom resets).
  useEffect(() => {
    if (!imgEl) return;
    setPos({ x: (BOX_W - dispW) / 2, y: (boxH - dispH) / 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgEl]);

  const clamp = (p, scale) => {
    const w = imgEl.width * scale;
    const h = imgEl.height * scale;
    return {
      x: Math.min(0, Math.max(p.x, BOX_W - w)),
      y: Math.min(0, Math.max(p.y, boxH - h)),
    };
  };

  const onZoomChange = (e) => {
    const newZoom = parseFloat(e.target.value);
    setZoom(newZoom);
    setPos((p) => clamp(p, baseScale * newZoom));
  };

  const startDrag = (clientX, clientY) => {
    dragRef.current = { startX: clientX, startY: clientY, origin: pos };
  };
  const moveDrag = (clientX, clientY) => {
    if (!dragRef.current) return;
    const { startX, startY, origin } = dragRef.current;
    const next = { x: origin.x + (clientX - startX), y: origin.y + (clientY - startY) };
    setPos(clamp(next, effScale));
  };
  const endDrag = () => { dragRef.current = null; };

  const handlePointerDown = (e) => {
    e.preventDefault();
    boxRef.current?.setPointerCapture?.(e.pointerId);
    startDrag(e.clientX, e.clientY);
  };
  const handlePointerMove = (e) => moveDrag(e.clientX, e.clientY);
  const handlePointerUp = () => endDrag();

  const apply = () => {
    if (!imgEl) return;
    const outH = Math.round(outputWidth / aspect);
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    // Map the visible crop-box window back to natural image pixel coordinates.
    const srcX = -pos.x / effScale;
    const srcY = -pos.y / effScale;
    const srcW = BOX_W / effScale;
    const srcH = boxH / effScale;
    ctx.drawImage(imgEl, srcX, srcY, srcW, srcH, 0, 0, outputWidth, outH);
    canvas.toBlob((blob) => { if (blob) onApply(blob); }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4">
        <p className="mb-1 text-sm font-semibold text-slate-700">Position your image</p>
        <p className="mb-3 text-xs text-slate-500">Drag to move, use the slider to zoom — like setting a profile photo.</p>

        <div
          ref={boxRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ width: BOX_W, height: boxH, touchAction: 'none' }}
          className="relative mx-auto overflow-hidden rounded-lg bg-slate-100 select-none"
        >
          {imgEl && (
            <img
              src={imgEl.src}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: dispW,
                height: dispH,
                maxWidth: 'none',
                cursor: 'grab',
              }}
            />
          )}
        </div>

        <input
          type="range"
          min="1"
          max="3"
          step="0.01"
          value={zoom}
          onChange={onZoomChange}
          className="mt-3 w-full"
        />

        <div className="mt-3 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
          <button type="button" onClick={apply} disabled={!imgEl} className="btn-primary">Use this crop</button>
        </div>
      </div>
    </div>
  );
}
