import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useReducedMotion } from './Motion';

gsap.registerPlugin(ScrollToPlugin);

// Animate the native scroll position so sticky elements, viewport reveals, and
// the horizontal industry carousel continue to use normal browser geometry.
export function useSmoothScroll() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    let tween: gsap.core.Tween | undefined;
    let target = window.scrollY;

    const stop = () => {
      tween?.kill();
      tween = undefined;
      target = window.scrollY;
    };
    const scrollTo = (position: number, onComplete?: () => void) => {
      tween?.kill();
      target = Math.max(0, Math.min(position, document.documentElement.scrollHeight - window.innerHeight));
      tween = gsap.to(window, {
        scrollTo: { y: target, autoKill: true, onAutoKill: stop },
        duration: .8,
        overwrite: 'auto',
        ease: 'power3.out',
        onComplete: () => { tween = undefined; target = window.scrollY; onComplete?.(); },
      });
    };

    const onWheel = (event: WheelEvent) => {
      if (document.querySelector<HTMLElement>('.site-content')?.inert) return;
      if (event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
      // Let nested scrollable controls consume their own wheel gestures.
      for (const node of event.composedPath()) {
        if (!(node instanceof HTMLElement) || node === document.body || node === document.documentElement) continue;
        const style = getComputedStyle(node);
        if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1) {
          if ((event.deltaY < 0 && node.scrollTop > 0) || (event.deltaY > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 1)) {
            stop(); return;
          }
        }
      }
      event.preventDefault();
      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? window.innerHeight : 1;
      scrollTo((tween ? target : window.scrollY) + event.deltaY * unit);
    };

    const onAnchor = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      let id: string;
      try { id = decodeURIComponent(link.hash.slice(1)); } catch { return; }
      const destination = document.getElementById(id);
      if (!destination) return;
      event.preventDefault();
      const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
      if (location.hash !== link.hash) history.pushState(null, '', link.hash);
      scrollTo(window.scrollY + destination.getBoundingClientRect().top - headerHeight - 16, () => {
        // Preserve anchor/skip-link focus behavior without starting another scroll.
        const previousTabIndex = destination.getAttribute('tabindex');
        destination.setAttribute('tabindex', '-1');
        destination.focus({ preventScroll: true });
        if (previousTabIndex === null) destination.removeAttribute('tabindex');
        else destination.setAttribute('tabindex', previousTabIndex);
      });
    };
    const onKey = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Escape'].includes(event.key)) stop();
    };
    const onVisibility = () => { if (document.hidden) stop(); };

    window.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('click', onAnchor);
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    window.addEventListener('resize', stop);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      window.removeEventListener('wheel', onWheel);
      document.removeEventListener('click', onAnchor);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', stop);
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('resize', stop);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reducedMotion]);
}
