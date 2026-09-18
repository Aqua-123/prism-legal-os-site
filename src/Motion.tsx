import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { motion, useInView } from 'motion/react';
import type { ReactNode } from 'react';
import './motion.css';
import { usePageReady } from './PageReady';

const preference = () => window.matchMedia('(prefers-reduced-motion: reduce)');
const subscribe = (notify: () => void) => {
  const query = preference();
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => preference().matches, () => false);
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));

export function HeadingReveal({ as: Tag = 'h2', id, children }: {
  as?: 'h1' | 'h2'; id: string; children: ReactNode;
}) {
  const box = useRef<HTMLSpanElement>(null);
  const source = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const pageReady = usePageReady();
  const inView = useInView(box, { once: true, margin: '0px 0px -10% 0px' });
  const [lines, setLines] = useState<{ top: number; height: number }[]>([]);
  const [complete, setComplete] = useState(false);
  const started = useRef(false);
  const visible = pageReady && inView && lines.length > 0;

  useEffect(() => {
    if (visible) started.current = true;
  }, [visible]);

  useEffect(() => {
    if (reduced) { setComplete(true); return; }
    let disposed = false, fontsReady = false;
    const measure = () => {
      if (disposed || !fontsReady) return;
      const text = source.current!;
      const bounds = text.getBoundingClientRect();
      const lineHeight = parseFloat(getComputedStyle(text).lineHeight);
      const tops: number[] = [];
      const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(walker.currentNode);
        for (const rect of range.getClientRects()) {
          if (rect.width && !tops.some(top => Math.abs(top - rect.top) < 2)) tops.push(rect.top);
        }
      }
      tops.sort((a, b) => a - b);
      if (!tops.length || !lineHeight) { setComplete(true); return; }
      // Measure the existing wrapped lines without changing the heading's typography.
      setLines(tops.map((top, i) => {
        const y = Math.round((top - tops[0]) / lineHeight) * lineHeight;
        const bottom = i === tops.length - 1 ? bounds.height + parseFloat(getComputedStyle(box.current!).paddingBottom) : y + lineHeight;
        return { top: y, height: bottom - y };
      }));
    };
    void document.fonts.ready.then(() => {
      if (disposed) return;
      fontsReady = true;
      measure();
    }).catch(() => { if (!disposed) setComplete(true); });
    const onResize = () => {
      if (started.current) setComplete(true);
      else measure();
    };
    const onVisibility = () => { if (document.hidden && started.current) setComplete(true); };
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced]);

  const animating = !reduced && !complete;
  return (
    <Tag id={id} className="heading-reveal">
      <span ref={box} className="heading-box">
        <span ref={source} className="heading-source" style={{ opacity: animating ? 0 : 1 }}>{children}</span>
        {animating && <span className="heading-overlay" aria-hidden="true" inert>
          {lines.map((line, index) => (
            <span className="heading-mask" key={index} style={{ top: line.top, height: line.height }}>
              <motion.span
                className="heading-line"
                initial={{ y: '100%', opacity: 0 }}
                animate={visible ? { y: '0%', opacity: 1 } : { y: '100%', opacity: 0 }}
                transition={{ duration: 1, delay: index * .1, ease: [.23, 1, .32, 1] }}
                onAnimationComplete={() => { if (visible && index === lines.length - 1) setComplete(true); }}
              >
                <span className="heading-copy" style={{ top: -line.top }}>{children}</span>
              </motion.span>
            </span>
          ))}
        </span>}
      </span>
    </Tag>
  );
}

export function LineReveal({ children, className }: { children: ReactNode; className: string }) {
  const root = useRef<HTMLParagraphElement>(null);
  const source = useRef<HTMLSpanElement>(null);
  const overlay = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const pageReady = usePageReady();
  useEffect(() => {
    const el = root.current!, text = source.current!, layer = overlay.current!;
    if (reduced || !pageReady || !el.animate) return;
    let disposed = false, played = false;
    let animations: Animation[] = [];
    let observer: IntersectionObserver | undefined;
    const finish = () => {
      animations.forEach(animation => animation.cancel()); animations = [];
      text.style.opacity = ''; layer.replaceChildren();
    };
    const play = () => {
      if (disposed || played || document.hidden) return;
      played = true;
      const bounds = text.getBoundingClientRect();
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      const tops: number[] = [];
      const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const range = document.createRange(); range.selectNodeContents(walker.currentNode);
        for (const rect of range.getClientRects()) {
          if (rect.width && !tops.some(top => Math.abs(top - rect.top) < 2)) tops.push(rect.top);
        }
      }
      tops.sort((a, b) => a - b);
      if (!tops.length || !lineHeight) return;
      text.style.opacity = '0';
      // Clip copies of the original markup, preserving exact wrapping and semantics.
      tops.forEach((top, i) => {
        const y = i === 0 ? 0 : (top + tops[i - 1]) / 2 - bounds.top + lineHeight / 2;
        const bottom = i === tops.length - 1 ? bounds.height + 4 : (top + tops[i + 1]) / 2 - bounds.top + lineHeight / 2;
        const mask = document.createElement('span');
        mask.className = 'line-mask'; mask.style.top = `${y}px`; mask.style.height = `${bottom - y}px`;
        const copy = text.cloneNode(true) as HTMLSpanElement;
        copy.style.opacity = '1'; copy.style.position = 'relative'; copy.style.top = `${-y}px`;
        const mover = document.createElement('span');
        mover.className = 'line-mover';
        mover.append(copy); mask.append(mover); layer.append(mask);
        animations.push(mover.animate([{ transform: `translateY(${lineHeight * 1.5}px)` }, { transform: 'translateY(0)' }], {
          duration: 800, delay: 200 + i * 200, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both',
        }));
      });
      void Promise.all(animations.map(animation => animation.finished)).then(finish).catch(() => {});
    };
    void document.fonts.ready.then(() => {
      if (disposed) return;
      if (!('IntersectionObserver' in window)) { play(); return; }
      observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) play(); }, { threshold: .35, rootMargin: '0px 0px -8% 0px' });
      observer.observe(el);
    });
    window.addEventListener('resize', finish);
    document.addEventListener('visibilitychange', finish);
    return () => { disposed = true; finish(); observer?.disconnect(); window.removeEventListener('resize', finish); document.removeEventListener('visibilitychange', finish); };
  }, [reduced, pageReady]);
  return <p ref={root} className={`${className} line-reveal`}><span ref={source} className="line-source">{children}</span><span ref={overlay} className="line-overlay" aria-hidden="true" /></p>;
}

// One event-driven scheduler; read untransformed wrappers before writing visuals.
const scenes = new Set<() => () => void>();
let scrollFrame = 0;
function updateScenes() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    const writes = [...scenes].map(read => read());
    writes.forEach(write => write());
  });
}
export function ScrollScene({ children, className = '', start = .08, end = .45, scale = .96, rise = 40 }: {
  children: ReactNode; className?: string; start?: number; end?: number; scale?: number; rise?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = root.current!, target = visual.current!;
    if (reduced) return;
    const read = () => {
      const box = el.getBoundingClientRect();
      const progress = clamp(((window.innerHeight - box.top) / (window.innerHeight + box.height) - start) / (end - start));
      return () => { target.style.transform = progress === 1 ? '' : `translateY(${rise * (1 - progress)}px) scale(${scale + (1 - scale) * progress})`; };
    };
    if (!scenes.size) { window.addEventListener('scroll', updateScenes, { passive: true }); window.addEventListener('resize', updateScenes); }
    scenes.add(read); updateScenes();
    const resize = new ResizeObserver(updateScenes); resize.observe(el);
    return () => {
      scenes.delete(read); resize.disconnect(); target.style.transform = '';
      if (!scenes.size) { window.removeEventListener('scroll', updateScenes); window.removeEventListener('resize', updateScenes); cancelAnimationFrame(scrollFrame); scrollFrame = 0; }
    };
  }, [reduced, start, end, scale, rise]);
  return <div ref={root} className={`scroll-scene ${className}`}><div ref={visual} className="scroll-visual">{children}</div></div>;
}

export function useWorkflowEntrance() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const root = ref.current!;
    if (reduced || !('IntersectionObserver' in window) || !root.animate) return;
    let animations: Animation[] = [];
    const finish = () => { animations.forEach(a => a.cancel()); animations = []; };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      root.querySelectorAll('.workflow-step').forEach((step, i) => {
        animations.push(step.animate([{ opacity: 0, translate: '0 18px' }, { opacity: 1, translate: '0 0' }], {
          duration: 700, delay: i * 75, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards',
        }));
      });
    }, { threshold: .15 });
    observer.observe(root);
    root.addEventListener('focusin', finish);
    document.addEventListener('visibilitychange', finish);
    return () => { finish(); observer.disconnect(); root.removeEventListener('focusin', finish); document.removeEventListener('visibilitychange', finish); };
  }, [reduced]);
  return ref;
}
