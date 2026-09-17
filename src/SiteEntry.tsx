import { assetUrl } from './assets';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PageReadyContext } from './PageReady';
import './loader.css';

const SESSION_KEY = 'prism-loader-visited';
function skipIntro() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.location.hash) return true;
  try { return sessionStorage.getItem(SESSION_KEY) === 'true'; } catch { return false; }
}

function PrismLoader({ onReveal, onComplete }: { onReveal: () => void; onComplete: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current!;
    const logo = el.querySelector('.site-loader-logo')!;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false, finished = false;
    let timeline: gsap.core.Timeline | undefined;
    const savedOverflow = document.body.style.overflow;
    const savedPadding = document.body.style.paddingRight;
    const scrollbar = innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar}px`;
    document.body.style.overflow = 'hidden';
    const unlock = () => { document.body.style.overflow = savedOverflow; document.body.style.paddingRight = savedPadding; };
    const finish = () => {
      if (disposed || finished) return;
      finished = true;
      timeline?.kill(); unlock(); onReveal(); onComplete();
      ScrollTrigger.refresh();
    };
    const onPreference = () => { if (preference.matches) finish(); };
    const onVisibility = () => { if (document.hidden) finish(); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') finish(); };
    preference.addEventListener('change', onPreference);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('keydown', onKey);
    const safety = window.setTimeout(finish, 6500);
    let fontTimeout: number;
    const fonts = Promise.race([document.fonts.ready, new Promise(resolve => { fontTimeout = window.setTimeout(resolve, 1500); })]);
    void fonts.then(() => {
      window.clearTimeout(fontTimeout);
      if (disposed || finished) return;
      if (preference.matches) { finish(); return; }
      try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch { /* Storage is optional. */ }
      gsap.set(logo, { y: 0, yPercent: -105 });
      timeline = gsap.timeline({ onComplete: finish });
      timeline.to(logo, { yPercent: 0, duration: 1, ease: 'expo.out' }, 0);
      timeline.to(logo, { yPercent: 105, duration: .8, ease: 'expo.in' }, 1.8);
      el.querySelectorAll('.site-loader-row').forEach((row, index) => {
        const reverse = index % 2 === 0;
        timeline!.to(row.children, {
          scaleX: 0, transformOrigin: reverse ? 'left center' : 'right center',
          duration: .8, ease: 'power2.inOut',
          stagger: { from: reverse ? 'end' : 'start', amount: .5 },
        }, 2.5);
      });
      timeline.call(onReveal, [], 2.7);
    }).catch(finish);
    return () => {
      disposed = true; timeline?.kill(); unlock();
      clearTimeout(safety); clearTimeout(fontTimeout);
      preference.removeEventListener('change', onPreference);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('keydown', onKey);
    };
  }, [onReveal, onComplete]);

  return <div ref={root} className="site-loader" role="status" aria-label="Loading Prism Legal OS">
    <div className="site-loader-grid" aria-hidden="true">
      {Array.from({ length: 4 }, (_, row) => <div className="site-loader-row" key={row}>
        {Array.from({ length: 16 }, (_, tile) => <span className="site-loader-tile" key={tile} />)}
      </div>)}
    </div>
    <div className="site-loader-mask" aria-hidden="true">
      <div className="site-loader-logo">
        <div className="site-loader-brand"><img src={assetUrl("hero-imgFrame199.svg")} alt="" width="42" height="42" /><span>Prism Legal OS</span></div>
        <span className="site-loader-credit">By FuturixAI</span>
      </div>
    </div>
  </div>;
}

export function SiteEntry({ children }: { children: ReactNode }) {
  const [skip] = useState(skipIntro);
  const [ready, setReady] = useState(skip);
  const [complete, setComplete] = useState(skip);
  const reveal = useCallback(() => setReady(true), []);
  const finish = useCallback(() => setComplete(true), []);
  return <>
    <PageReadyContext.Provider value={ready}>
      <div className="site-content" inert={!complete} data-ready={ready}>{children}</div>
    </PageReadyContext.Provider>
    {!complete && <PrismLoader onReveal={reveal} onComplete={finish} />}
  </>;
}
