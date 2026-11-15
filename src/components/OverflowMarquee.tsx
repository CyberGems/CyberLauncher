import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

interface OverflowMarqueeProps {
  children: ReactNode;
  className?: string;
}

type MarqueeStyle = CSSProperties & {
  '--access-name-offset': string;
  '--access-name-duration': string;
};

export function OverflowMarquee({ children, className = '' }: OverflowMarqueeProps) {
  const viewportRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowDistance, setOverflowDistance] = useState(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const text = textRef.current;
    if (!viewport || !text) return;

    const measure = () => {
      const distance = Math.max(0, Math.ceil(text.scrollWidth - viewport.clientWidth));
      setOverflowDistance(previous => previous === distance ? previous : distance);
    };

    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(text);
    return () => observer.disconnect();
  }, [children]);

  const duration = Math.min(4.5, Math.max(1.8, 1.5 + overflowDistance / 140));
  const style: MarqueeStyle = {
    '--access-name-offset': `${-overflowDistance}px`,
    '--access-name-duration': `${duration}s`,
  };

  return (
    <span
      ref={viewportRef}
      className={`access-name-marquee ${className}`}
      data-overflow={overflowDistance > 0 ? 'true' : undefined}
      style={style}
    >
      <span ref={textRef} className="access-name-marquee__text">{children}</span>
    </span>
  );
}
