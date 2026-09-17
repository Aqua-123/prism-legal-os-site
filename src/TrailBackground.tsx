import { assetUrl } from './assets';
import { useEffect, useRef } from 'react';
import type { CommunityField } from './communityField';

export function TrailBackground({ community = false }: { community?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current!;
    let disposed = false, started = false;
    let field: CommunityField | undefined;
    const start = () => {
      if (started || disposed) return;
      started = true;
      void import('./communityField.js').then(({ createLightHeroBackground }) => {
        if (!disposed) field = createLightHeroBackground(element, { trailColor: [1, 1, 1] });
      }).catch(() => { /* The static field remains visible. */ });
    };
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { start(); observer.disconnect(); }
    });
    observer.observe(element);
    return () => { disposed = true; observer.disconnect(); field?.destroy(); };
  }, []);
  return <>
    <canvas ref={canvas} className={`trail-field${community ? ' community-field' : ''}`} aria-hidden="true" />
    <img className={`trail-fallback${community ? ' community-field-fallback' : ''}`} src={assetUrl("community-field-fallback.svg")} alt="" aria-hidden="true" />
  </>;
}
