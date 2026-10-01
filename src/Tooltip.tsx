import { useState, useEffect, useLayoutEffect, useRef, cloneElement, isValidElement } from 'react';
import type { FC, ReactElement, ReactNode, MouseEvent as ReactMouseEvent, CSSProperties } from 'react';
import { createPortal } from 'react-dom';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  label: ReactNode;
  placement?: Placement;
  children: ReactElement;
  delay?: number;
}

const DEFAULT_DELAY = 400;
const VIEWPORT_MARGIN = 8;
const GAP = 8;

const BORDER = 'rgba(34, 211, 238, 0.18)';
const ACCENT_GLOW = 'rgba(34, 211, 238, 0.08)';
const SURFACE = 'rgba(10, 15, 24, 0.98)';

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.max(min, Math.min(value, max));
}

/** CyberGems-style tooltip (ported from CyberNotes). Clones the child without wrapping layout. */
const Tooltip: FC<TooltipProps> = ({ label, placement = 'bottom', delay = DEFAULT_DELAY, children }) => {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number; arrow: CSSProperties } | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useLayoutEffect(() => {
    if (!anchor || !cardRef.current) {
      setPos(null);
      return;
    }
    const card = cardRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = anchor.left + anchor.width / 2;
    const cy = anchor.top + anchor.height / 2;
    let left = 0;
    let top = 0;
    let arrow: CSSProperties = {};

    if (placement === 'top' || placement === 'bottom') {
      left = clamp(cx - card.width / 2, VIEWPORT_MARGIN, vw - card.width - VIEWPORT_MARGIN);
      top = placement === 'bottom' ? anchor.bottom + GAP : anchor.top - GAP - card.height;
      const ax = clamp(cx - left, 12, card.width - 12);
      arrow = placement === 'bottom'
        ? { top: -4, left: ax, marginLeft: -4, borderTop: `1px solid ${BORDER}`, borderLeft: `1px solid ${BORDER}` }
        : { bottom: -4, left: ax, marginLeft: -4, borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` };
    } else {
      top = clamp(cy - card.height / 2, VIEWPORT_MARGIN, vh - card.height - VIEWPORT_MARGIN);
      left = placement === 'right' ? anchor.right + GAP : anchor.left - GAP - card.width;
      const ay = clamp(cy - top, 12, card.height - 12);
      arrow = placement === 'right'
        ? { left: -4, top: ay, marginTop: -4, borderBottom: `1px solid ${BORDER}`, borderLeft: `1px solid ${BORDER}` }
        : { right: -4, top: ay, marginTop: -4, borderTop: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` };
    }
    setPos({ left, top, arrow });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor, placement]);

  useEffect(() => {
    const hide = () => {
      clearTimer();
      setAnchor(null);
    };
    window.addEventListener('scroll', hide, true);
    window.addEventListener('wheel', hide, true);
    window.addEventListener('contextmenu', hide, true);
    window.addEventListener('pointerdown', hide, true);
    window.addEventListener('mousedown', hide, true);
    window.addEventListener('cyber-hide-tooltips', hide, true);
    return () => {
      clearTimer();
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('wheel', hide, true);
      window.removeEventListener('contextmenu', hide, true);
      window.removeEventListener('pointerdown', hide, true);
      window.removeEventListener('mousedown', hide, true);
      window.removeEventListener('cyber-hide-tooltips', hide, true);
    };
  }, []);

  useEffect(() => {
    if (!label) {
      clearTimer();
      setAnchor(null);
    }
  }, [label]);

  if (!isValidElement(children)) return children;
  const child = children as ReactElement<any>;

  const show = (e: ReactMouseEvent<HTMLElement>) => {
    child.props.onMouseEnter?.(e);
    clearTimer();
    if (e.buttons !== 0) {
      setAnchor(null);
      return;
    }
    if (document.body.getAttribute('data-tooltips-enabled') === 'false') {
      return;
    }
    if (document.body.getAttribute('data-context-menu-active') === 'true' || !label) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    if (delay <= 0) {
      setAnchor(rect);
    } else {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setAnchor(rect);
      }, delay);
    }
  };

  const mouseMoveShow = (e: ReactMouseEvent<HTMLElement>) => {
    child.props.onMouseMove?.(e);
    if (e.buttons !== 0) {
      clearTimer();
      setAnchor(null);
      return;
    }
    if (document.body.getAttribute('data-tooltips-enabled') === 'false') {
      return;
    }
    if (document.body.getAttribute('data-context-menu-active') === 'true' || !label) {
      return;
    }
    if (!anchor && !timerRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      if (delay <= 0) {
        setAnchor(rect);
      } else {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          setAnchor(rect);
        }, delay);
      }
    }
  };

  const hide = (e: ReactMouseEvent<HTMLElement>) => {
    child.props.onMouseLeave?.(e);
    clearTimer();
    setAnchor(null);
  };
  const downHide = (e: ReactMouseEvent<HTMLElement>) => {
    child.props.onMouseDown?.(e);
    child.props.onPointerDown?.(e);
    clearTimer();
    setAnchor(null);
  };
  const clickHide = (e: ReactMouseEvent<HTMLElement>) => {
    child.props.onClick?.(e);
    clearTimer();
    setAnchor(null);
  };
  const contextMenuHide = (e: ReactMouseEvent<HTMLElement>) => {
    child.props.onContextMenu?.(e);
    clearTimer();
    setAnchor(null);
  };

  const cloned = cloneElement(child, {
    onMouseEnter: show,
    onMouseMove: mouseMoveShow,
    onMouseLeave: hide,
    onMouseDown: downHide,
    onPointerDown: downHide,
    onClick: clickHide,
    onContextMenu: contextMenuHide,
  });

  return (
    <>
      {cloned}
      {anchor && label && createPortal(
        <div style={{
          position: 'fixed',
          left: pos ? pos.left : -9999,
          top: pos ? pos.top : -9999,
          zIndex: 90,
          pointerEvents: 'none',
          visibility: pos ? 'visible' : 'hidden',
        }}>
          <div
            ref={cardRef}
            style={{
              position: 'relative',
              background: SURFACE,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${BORDER}`,
              boxShadow: `0 8px 24px rgba(0, 0, 0, 0.6), 0 0 4px ${ACCENT_GLOW}`,
              borderRadius: 8,
              padding: '6px 10px',
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
              whiteSpace: 'nowrap',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              animation: 'tooltipPop 0.14s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {label}
            <div style={{
              position: 'absolute',
              width: 8,
              height: 8,
              background: SURFACE,
              transform: 'rotate(45deg)',
              ...(pos?.arrow || {}),
            }} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;
