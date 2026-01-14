import React, { useRef, useState, useEffect, useCallback } from 'react';

import Button from '../UI/Button';
import { Plus, Minus, RefreshCw } from 'lucide-react';

export default function ZoomableMapContainer({ children, minZoom = 1, maxZoom = 3, initialZoom = 1 }) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  // Usiamo un Ref per il dragging per evitare problemi di closure con gli event listeners
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const getPanBounds = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    // Calcolo corretto dei limiti in base allo zoom
    const maxPanX = ((zoom - 1) * w) / 2;
    const maxPanY = ((zoom - 1) * h) / 2;
    return { minX: -maxPanX, maxX: maxPanX, minY: -maxPanY, maxY: maxPanY };
  }, [zoom]);

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current) return;

    // Supporto sia per Mouse che per Touch
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    
    const bounds = getPanBounds();
    let newX = panStart.current.x + dx;
    let newY = panStart.current.y + dy;

    // Applichiamo i limiti
    newX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
    newY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));

    setPan({ x: newX, y: newY });
  }, [getPanBounds]);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('touchmove', onMouseMove);
    window.removeEventListener('touchend', onMouseUp);
  }, [onMouseMove]);

  const onMouseDown = (e) => {
    if (zoom <= 1) return; // Drag disabilitato se non c'è zoom
    
    isDragging.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    dragStart.current = { x: clientX, y: clientY };
    panStart.current = { ...pan };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onMouseMove, { passive: false });
    window.addEventListener('touchend', onMouseUp);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(maxZoom, z + 0.5));
  const handleZoomOut = () => {
    const newZoom = Math.max(minZoom, zoom - 0.5);
    if (newZoom === 1) setPan({ x: 0, y: 0 }); // Reset pan se torniamo a zoom 1
    setZoom(newZoom);
  };
  const handleReset = () => {
    setZoom(initialZoom);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#173C55] select-none touch-none"
    >
      {/* UI Pulsanti Zoom */}
      <div className="absolute top-4 right-4 z-40 flex flex-col gap-2 bg-black/30 rounded-lg p-2 shadow-lg pointer-events-auto">
        <Button
          onClick={handleZoomIn}
          variant={zoom < maxZoom ? 'cyan' : 'gray'}
          size="xs"
          className="!w-8 !h-8 p-0"
          disabled={zoom >= maxZoom}
          aria-label="Zoom in"
        >
          <Plus size={16} />
        </Button>
        <Button
          onClick={handleZoomOut}
          variant={zoom > minZoom ? 'cyan' : 'gray'}
          size="xs"
          className="!w-8 !h-8 p-0"
          disabled={zoom <= minZoom}
          aria-label="Zoom out"
        >
          <Minus size={16} />
        </Button>
        <Button
          onClick={handleReset}
          variant={zoom !== initialZoom || pan.x !== 0 || pan.y !== 0 ? 'cyan' : 'gray'}
          size="xs"
          className="!w-8 !h-8 p-0"
          disabled={zoom === initialZoom && pan.x === 0 && pan.y === 0}
          aria-label="Reset zoom"
        >
          <RefreshCw size={16} />
        </Button>
      </div>

      {/* Container della Mappa */}
      <div 
        className="w-full h-full flex items-center justify-center cursor-move"
        onMouseDown={onMouseDown}
        onTouchStart={onMouseDown}
        style={{
          cursor: zoom > 1 ? (isDragging.current ? 'grabbing' : 'grab') : 'default',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isDragging.current ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}