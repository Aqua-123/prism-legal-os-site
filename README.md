# Prism landing page

React + TypeScript + Vite implementation of Section 8 in the supplied ZeroCRM Figma file.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` creates a deployable static site in `dist/`.

The hero has three accessible tabs: Workspace, Prism AI, and Contract Intelligence. They cycle every four seconds; manual selection resets the timer. Click a tab or use Left/Right, Home, and End while the tab list is focused. The workspace is selected initially. The “Open source. Run your way.” section follows the hero preview and presents self-hosting and managed deployment with responsive cards and links to GitHub and the team. The lifecycle section follows, with accessible detail tooltips added to each step.

The product screens are marketing preview images exported directly from Figma, not a working legal application. Page headings, navigation, buttons, tabs, and the lifecycle are HTML. GitHub links open the Prism repository; contact links open FuturixAI’s contact page. This page does not call an AI service or submit user data.

Design images and SVGs are stored locally under `public/assets` so the site does not rely on expiring Figma URLs. The three product previews are native SVG exports, with text rendered as vector outlines and no embedded raster images, so they scale cleanly across display sizes and pixel densities. DM Sans is bundled locally. Previews preserve the content in the source design.

## Checks

```sh
npm run build
npx playwright install chromium
npm test
```

The browser checks cover tab switching, keyboard navigation, external destinations, narrow-screen layout, the feature accordion, heading reveals, scroll-linked movement, and reduced motion.

## Remaining landing sections

`src/sections.css` styles the industry carousel, results, Why Prism, security, open-source community, closing CTA, and footer from Section 8. On laptops and desktops, GSAP ScrollTrigger pins the industry section below the header while vertical scrolling advances the cards horizontally. The original color photos gradually saturate as each industry becomes active, with the ruler following progress. The active card gets a single subtle lift and settle when selection changes; it does not keep bouncing as scrolling continues within the same industry. Previous/next buttons and Left/Right/Home/End keys remain available. Touch screens and reduced-motion users get a native horizontal carousel. Industry cards and contact CTAs open https://www.futurixai.com/contact.

The open-source community section sits before the closing CTA so the footer remains last. Dark surfaces expand from a 6% inset to full viewport width between 90% and 25% viewport entry, with the final panel completing at the page bottom. Reduced motion removes the expansion. The footer reuses the header logo and sizing in white. The lifecycle uses pale yellow connectors and a 16px CTA. Result values roll through digit reels once on viewport entry, preserving their final accessible text and stable width. Reduced motion displays final values immediately and disables card bumps. Two leftover template paragraphs were adapted to Prism. The result numbers and security badges are reproduced from the supplied design, not independently verified product claims. The security frame’s shader is fully covered by its opaque background in Figma; the page renders that visible background without an unused WebGPU layer. Complete Why Prism and community artwork is exported from Figma as SVG, preserving the source raster fills; photography retains the resolution available in the source design.

## Motion

`src/SiteEntry.tsx` adapts `output/zetta-loader-single.html` with the Prism logo, Prism Legal OS name, and FuturixAI credit on the site's #BCCADE blue. The logo entrance and alternating four-row tile reveal play once per browser-tab session, with hero motion starting as the tiles open. Reduced motion and direct section links bypass the intro; Escape skips it. Scroll and page interactions unlock when the reveal finishes, with a timeout fallback. Industry navigation and card arrows use centered SVG geometry at 1.2× their previous size.

`src/Motion.tsx` adapts the SentientX handoff to Prism: measured line reveals, staggered workflow steps, and scroll-linked card/preview entrances. Headings use Motion for a masked slide-and-fade reveal: 1 second per line, 100 ms stagger, and cubic Bézier easing `[0.23, 1, 0.32, 1]`. The existing font, sizing, alignment, and wrapping are preserved by measuring the rendered lines after fonts load. Each heading plays once on entering the viewport with a bottom margin of −10%; reduced motion displays it immediately. Resizing during a reveal restores the original text. `src/motion.css` adds clipped CTA arrow movement and feature-copy transitions. Scroll effects use stable outer wrappers and one event-driven scheduler, with no continuous render loop at rest.

Reduced motion shows content immediately and disables automatic tab cycling. Tab cycling also pauses while the browser tab is hidden. Resize, preference changes, and unmount clean up active animation work. Native touch scrolling is preserved.

`src/useSmoothScroll.ts` uses GSAP ScrollToPlugin to ease desktop wheel scrolling and same-page anchor links by animating the native scroll position. The header stays sticky, and anchors account for its height. Touch, keyboard scrolling, nested scroll areas, horizontal gestures, and reduced-motion preferences retain native browser behavior. Scroll tweens stop on direct input, resize, or a hidden tab.

Source: https://www.figma.com/design/7jhTQEd4gOESpbosguON7d/ZeroCRM?node-id=519-21860

## Open-source section background

`src/CommunityVisual.tsx` loads the renderer adapted from `research/sentientx/light-hero/background-bccade.html`. It keeps the original #BCCADE field, shape atlas, wave timing, and pointer parallax, with `trailColor: [1, 1, 1]` for a white trail. The old line background is removed from the illustration; `community-foreground.svg` preserves only its three foreground shapes. The renderer pauses offscreen and in hidden tabs, respects reduced motion, and releases its WebGL resources on unmount. A local static SVG field remains visible when WebGL is unavailable.

The shared `TrailBackground` also replaces line patterns behind all three hero previews, both deployment choices, the five feature previews, and the Why Prism illustration. Foreground exports preserve the product UI and floating cards; regenerate them from the original assets with `python3 scripts/build-trail-foregrounds.py`. Each field initializes on viewport entry, pauses offscreen, and uses the same white pointer trail and reduced-motion fallback. Deployment fields fade behind text for readability. The deployment choices now follow the hero preview, before the lifecycle section.

Copy outside the hero was adapted from the supplied Google Doc: https://docs.google.com/document/d/1vt2HZrS6ig1Jukey9bJAl3C78lm1QD1tR2sXW1RFuzA/edit. Product introduction, compliance, risk assessment, industries, Why Prism, trust, closing, and footer copy follow that source. Its screenshots describe an earlier layout; current working navigation and deployment choices are retained. Original Figma panel colors are applied beneath a transparent trail and static fallback, including the feature preview colors on desktop and mobile.

## Deployment

Source: https://github.com/Aqua-123/prism-legal-os-site

Live site: https://aqua-123.github.io/prism-legal-os-site/

GitHub Pages serves the production build from the `gh-pages` branch. Build with `npm run build -- --base=/prism-legal-os-site/` and publish the contents of `dist/` to that branch. Application and CSS assets respect Vite's base path. No environment variables are required.
