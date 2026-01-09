import React, { useRef, useState } from 'react';

/**
 * Un contenitore professionale per la mappa, con zoom e drag stile Google Maps.
 * - Usa stato locale per zoom e pan.
 * - Blocca la mappa ai bordi.
 * - Overlay con pulsanti +, -, reset.
 * - Responsive e isolato.
 */
export default function ZoomableMapContainer({ children, minZoom = 1, maxZoom = 3, initialZoom = 1 }) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  // Calcola limiti pan in base a zoom e dimensioni contenitore
  const getPanBounds = () => {
    const container = containerRef.current;
    if (!container) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    const maxPanX = ((zoom - 1) * w) / 2;
    const maxPanY = ((zoom - 1) * h) / 2;
    return {
      minX: -maxPanX,
      maxX: maxPanX,
      minY: -maxPanY,
      maxY: maxPanY,
    };
  };

  // Gestione drag
  const onMouseDown = (e) => {
    if (zoom === 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const bounds = getPanBounds();
    let newX = panStart.current.x + dx;
    let newY = panStart.current.y + dy;
    newX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
    newY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));
    setPan({ x: newX, y: newY });
  };
  const onMouseUp = () => {
    setDragging(false);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  // Touch events (mobile)
  const onTouchStart = (e) => {
    if (zoom === 1) return;
    setDragging(true);
    dragStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    panStart.current = { ...pan };
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  };
  const onTouchMove = (e) => {
    if (!dragging) return;
    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;
    const bounds = getPanBounds();
    let newX = panStart.current.x + dx;
    let newY = panStart.current.y + dy;
    newX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
    newY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));
    setPan({ x: newX, y: newY });
  };
  const onTouchEnd = () => {
    setDragging(false);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(maxZoom, z + 0.2));
  const handleZoomOut = () => setZoom(z => Math.max(minZoom, z - 0.2));
  const handleReset = () => {
    setZoom(initialZoom);
    setPan({ x: 0, y: 0 });
  };

  // Wheel zoom (opzionale, solo desktop)
  const onWheel = (e) => {
    if (!e.ctrlKey) return; // Zoom solo con Ctrl+scroll
    e.preventDefault();
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#173C55] select-none"
      onWheel={onWheel}
      style={{ touchAction: 'none' }}
    >
      {/* Overlay pulsanti zoom */}
      <div className="absolute top-4 right-4 z-40 flex flex-col gap-2 bg-black/30 rounded-lg p-2 shadow-lg">
        <button onClick={handleZoomIn} className="w-10 h-10 flex items-center justify-center bg-cyan-500 hover:bg-cyan-400 text-white rounded mb-1 transition disabled:opacity-50" disabled={zoom >= maxZoom} aria-label="Zoom in">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        <button onClick={handleZoomOut} className="w-10 h-10 flex items-center justify-center bg-cyan-500 hover:bg-cyan-400 text-white rounded mb-1 transition disabled:opacity-50" disabled={zoom <= minZoom} aria-label="Zoom out">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        <button onClick={handleReset} className="w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded transition" aria-label="Reset zoom">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
      {/* Mappa SVG con zoom e pan e drag solo su mappa */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
            transition: 'transform 0.2s',
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            cursor: dragging && zoom > 1 ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
          }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
