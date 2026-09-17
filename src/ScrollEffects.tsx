import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from './Motion';

gsap.registerPlugin(ScrollTrigger);

export function RollingNumber({ value }: { value: string }) {
  const root = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = root.current!;
    if (reduced) return;
    let disposed = false, played = false;
    let observer: IntersectionObserver | undefined;
    let timeline: gsap.core.Timeline | undefined;
    const finish = () => { timeline?.kill(); el.classList.remove('is-rolling'); };
    void document.fonts.ready.then(() => {
      if (disposed) return;
      observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting || played) return;
        played = true;
        observer?.disconnect();
        const strips = el.querySelectorAll<HTMLElement>('.number-strip');
        el.classList.add('is-rolling');
        timeline = gsap.timeline({ onComplete: finish });
        strips.forEach((strip, index) => {
          const count = strip.children.length;
          timeline!.fromTo(strip, { yPercent: 0 }, {
            yPercent: -100 * (count - 1) / count,
            duration: 1.35 + index * .12,
            ease: 'power3.out',
          }, index * .06);
        });
      }, { threshold: .6, rootMargin: '0px 0px -8% 0px' });
      observer.observe(el);
    });
    const onVisibility = () => { if (document.hidden) finish(); };
    window.addEventListener('resize', finish);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      disposed = true; finish(); observer?.disconnect();
      window.removeEventListener('resize', finish);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced, value]);
  return <span ref={root} className="rolling-number">
    <span className="sr-only">{value}</span>
    <span className="number-visual" aria-hidden="true">
      {[...value].map((character, index) => /\d/.test(character)
        ? <span className="number-digit" key={index}>
            <span className="number-final">{character}</span>
            <span className="number-strip">{Array.from({ length: 21 + Number(character) }, (_, digit) => <span key={digit}>{digit % 10}</span>)}</span>
          </span>
        : <span className="number-suffix" key={index}>{character}</span>)}
    </span>
  </span>;
}

export function ExpandingSurface({ children, className }: { children: ReactNode; className: string }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const context = gsap.context(() => {
      gsap.fromTo(root.current, { clipPath: 'inset(0% 6% 0% 6% round 24px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top 90%', end: 'clamp(top 25%)', scrub: true, invalidateOnRefresh: true },
      });
    }, root);
    return () => context.revert();
  }, [reduced]);
  return <div ref={root} className={`expanding-surface ${className}`}>{children}</div>;
}

export function WorkflowConnectors() {
  const svg = useRef<SVGSVGElement>(null);
  const [paths, setPaths] = useState<string[]>([]);
  useLayoutEffect(() => {
    const diagram = svg.current!.parentElement!;
    const update = () => {
      const origin = diagram.getBoundingClientRect();
      const points = ['organize', 'research', 'draft', 'analyze', 'review', 'export', 'approve', 'refine'].map(id => {
        const icon = diagram.querySelector<HTMLElement>(`.step-${id} .step-icon`)!;
        const rect = icon.getBoundingClientRect();
        return { x: rect.left - origin.left + rect.width / 2, y: rect.top - origin.top + rect.height / 2, r: rect.width / 2 + 12 };
      });
      if (window.innerWidth <= 600) {
        // The mobile grid reads left to right, then moves to the next row.
        const icons = [...diagram.querySelectorAll<HTMLElement>('.step-icon')].map(icon => {
          const r = icon.getBoundingClientRect();
          return { x: r.left - origin.left + r.width / 2, y: r.top - origin.top + r.height / 2, r: r.width / 2 + 5 };
        });
        setPaths(icons.slice(0, -1).flatMap((p, i) => i === 3 ? [] : [`M ${p.x + p.r} ${p.y} L ${icons[i + 1].x - icons[i + 1].r} ${icons[i + 1].y}`]));
        return;
      }
      setPaths(points.map((p, i) => {
        const q = points[(i + 1) % points.length];
        if ([1, 2].includes(i)) return `M ${p.x + p.r} ${p.y} L ${q.x - q.r} ${q.y}`;
        if ([5, 6].includes(i)) return `M ${p.x - p.r} ${p.y} L ${q.x + q.r} ${q.y}`;
        if (i === 0) return `M ${p.x} ${p.y - p.r} Q ${p.x} ${q.y} ${q.x - q.r} ${q.y}`;
        if (i === 3) return `M ${p.x + p.r} ${p.y} Q ${q.x} ${p.y} ${q.x} ${q.y - q.r}`;
        if (i === 4) return `M ${p.x} ${p.y + p.r} Q ${p.x} ${q.y} ${q.x + q.r} ${q.y}`;
        return `M ${p.x - p.r} ${p.y} Q ${q.x} ${p.y} ${q.x} ${q.y + q.r}`;
      }));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(diagram);
    return () => observer.disconnect();
  }, []);
  return <svg ref={svg} className="workflow-connectors" aria-hidden="true">
    <defs><marker id="workflow-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 1 1 L 7 4 L 1 7" fill="none" stroke="currentColor" strokeWidth="1" /></marker></defs>
    {paths.map((path, index) => <path key={index} d={path} fill="none" stroke="currentColor" strokeWidth="1.25" markerEnd="url(#workflow-arrow)" />)}
  </svg>;
}
