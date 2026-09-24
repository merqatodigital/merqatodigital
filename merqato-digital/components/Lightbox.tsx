'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export type LightboxItem = { url: string; kind: 'image' | 'video'; caption?: string };

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Full-screen media viewer: clears the page, supports keyboard, mouse wheel,
 * double-click/tap, pinch and drag — on phones, tablets and desktop alike.
 */
export default function Lightbox({
  items,
  index,
  title,
  onClose,
  onIndex,
}: {
  items: LightboxItem[];
  index: number;
  title?: string;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const swipe = useRef<{ x: number; y: number; t: number } | null>(null);

  const item = items[index];
  const many = items.length > 1;

  const reset = useCallback(() => { setZoom(1); setOffset({ x: 0, y: 0 }); }, []);
  const go = useCallback((delta: number) => {
    if (!many) return;
    reset();
    setLoading(true);
    onIndex((index + delta + items.length) % items.length);
  }, [index, items.length, many, onIndex, reset]);

  const zoomTo = useCallback((next: number) => {
    const z = clamp(next, MIN_ZOOM, MAX_ZOOM);
    setZoom(z);
    if (z === 1) setOffset({ x: 0, y: 0 });
  }, []);

  // Keyboard control.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === '+' || e.key === '=') zoomTo(zoom + 0.5);
      else if (e.key === '-' || e.key === '_') zoomTo(zoom - 0.5);
      else if (e.key === '0') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose, reset, zoom, zoomTo]);

  // Lock the page behind the viewer.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Wheel / trackpad zoom, non-passive so it can block page scroll.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomTo(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoom, zoomTo]);

  const pointerDown = (e: React.PointerEvent) => {
    if (zoom > 1) {
      drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } else {
      swipe.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    }
  };

  const pointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const limit = 260 * zoom;
    setOffset({
      x: clamp(drag.current.ox + (e.clientX - drag.current.x), -limit, limit),
      y: clamp(drag.current.oy + (e.clientY - drag.current.y), -limit, limit),
    });
  };

  const pointerUp = (e: React.PointerEvent) => {
    drag.current = null;
    const s = swipe.current;
    swipe.current = null;
    if (!s || zoom > 1) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - s.t < 800) go(dx < 0 ? 1 : -1);
  };

  // Pinch to zoom.
  const touchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinch.current = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), zoom };
    }
  };
  const touchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinch.current) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      zoomTo(pinch.current.zoom * (dist / pinch.current.dist));
    }
  };
  const touchEnd = (e: React.TouchEvent) => { if (e.touches.length < 2) pinch.current = null; };

  if (!item) return null;

  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label={title ? `${title} gallery` : 'Gallery'}>
      <div className="lb-backdrop" onClick={onClose} />

      <header className="lb-bar lb-top">
        <div className="lb-title">
          {title && <strong>{title}</strong>}
          {many && <span className="lb-count">{index + 1} / {items.length}</span>}
        </div>
        <div className="lb-tools">
          <button onClick={() => zoomTo(zoom - 0.5)} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out" title="Zoom out ( − )">−</button>
          <span className="lb-zoom" aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button onClick={() => zoomTo(zoom + 0.5)} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in" title="Zoom in ( + )">+</button>
          <button onClick={reset} disabled={zoom === 1} aria-label="Reset zoom" title="Reset ( 0 )">Reset</button>
          <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label="Open full size" title="Open full size">↗</a>
          <button className="lb-close" onClick={onClose} aria-label="Close gallery" title="Close ( Esc )">✕</button>
        </div>
      </header>

      <div
        className={'lb-stage' + (zoom > 1 ? ' is-zoomed' : '')}
        ref={stage}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onTouchStart={touchStart}
        onTouchMove={touchMove}
        onTouchEnd={touchEnd}
        onDoubleClick={() => zoomTo(zoom > 1 ? 1 : 2.5)}
      >
        {loading && item.kind === 'image' && <span className="lb-spinner" aria-hidden="true" />}
        {item.kind === 'video' ? (
          <video src={item.url} controls autoPlay playsInline className="lb-media" onLoadedData={() => setLoading(false)} />
        ) : (
          <img
            src={item.url}
            alt={item.caption || title || 'Project image'}
            className="lb-media"
            draggable={false}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
          />
        )}
      </div>

      {many && (
        <>
          <button className="lb-nav lb-prev" onClick={() => go(-1)} aria-label="Previous image">‹</button>
          <button className="lb-nav lb-next" onClick={() => go(1)} aria-label="Next image">›</button>
        </>
      )}

      <footer className="lb-bar lb-bottom">
        {item.caption && <p className="lb-caption">{item.caption}</p>}
        {many && (
          <div className="lb-thumbs" role="tablist" aria-label="Choose an image">
            {items.map((m, i) => (
              <button
                key={m.url + i}
                role="tab"
                aria-selected={i === index}
                aria-label={`Image ${i + 1}`}
                className={i === index ? 'is-active' : ''}
                onClick={() => { reset(); setLoading(true); onIndex(i); }}
              >
                {m.kind === 'video' ? <span className="lb-thumb-video">▶</span> : <img src={m.url} alt="" loading="lazy" />}
              </button>
            ))}
          </div>
        )}
        <p className="lb-hint">Drag to pan · double-tap or scroll to zoom · swipe or ← → to browse · Esc to close</p>
      </footer>
    </div>
  );
}
