import { assetUrl } from './assets';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ExpandingSurface, RollingNumber, WorkflowConnectors } from './ScrollEffects';
gsap.registerPlugin(ScrollTrigger);
import { LineReveal, HeadingReveal, ScrollScene, useReducedMotion, useWorkflowEntrance } from './Motion';
import './sections.css';
import { useSmoothScroll } from './useSmoothScroll';
import { CommunityVisual } from './CommunityVisual';
import { TrailBackground } from './TrailBackground';
import { usePageReady } from './PageReady';

const GITHUB = 'https://github.com/FuturixAI-and-Quantum-Works/Prism-Legal-OS';
const CONTACT = 'https://www.futurixai.com/contact';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <img className={`icon ${className}`} src={assetUrl(`${name}.svg`)} alt="" aria-hidden="true" width="18" height="18" />;
}

function ExternalArrow() {
  const arrow = <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} strokeWidth={1.75} />;
  return <span className="external-arrow" aria-hidden="true"><span>{arrow}</span><span>{arrow}</span></span>;
}

function Header() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <a className="brand" href="#main" aria-label="Prism Legal OS home">
          <Icon name="hero-imgFrame199" />
          <span>Prism Legal OS</span>
        </a>
        <nav className="header-actions" aria-label="Main navigation">
          <a className="button button-light github-link" href={GITHUB} target="_blank" rel="noreferrer">
            <Icon name="hero-imgImage54Vectorized" className="github-icon" />GitHub<ExternalArrow />
          </a>
          <a className="button button-dark" href={CONTACT}>Contact Us</a>
        </nav>
      </header>
    </>
  );
}

const views = [
  {
    id: 'workspace',
    label: 'Workspace',
    alt: 'Prism document workspace with a legal agreement, highlighted clauses, an AI review, and a floating clause detection card.',
    description: 'Review documents, work together, and keep every clause in context.',
  },
  {
    id: 'assistant',
    label: 'Prism AI',
    alt: 'Prism AI assistant showing a conversation and an editable generated document preview.',
    description: 'Research, draft, and refine legal documents with your AI assistant.',
  },
  {
    id: 'intelligence',
    label: 'Contract Intelligence',
    alt: 'Prism contract intelligence table comparing terms, confidentiality, obligations, and carve-outs across multiple documents.',
    description: 'Compare documents side by side and bring the details that matter into view.',
  },
] as const;

function ProductShowcase() {
  const reducedMotion = useReducedMotion();
  const pageReady = usePageReady();
  const [active, setActive] = useState(0);
  const [manualSelection, setManualSelection] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (reducedMotion || !pageReady) return;
    let timer: number;
    const schedule = () => {
      window.clearTimeout(timer);
      if (!document.hidden) timer = window.setTimeout(() => setActive((current) => (current + 1) % views.length), 4000);
    };
    schedule();
    document.addEventListener('visibilitychange', schedule);
    return () => { window.clearTimeout(timer); document.removeEventListener('visibilitychange', schedule); };
  }, [active, manualSelection, reducedMotion, pageReady]);

  function selectTab(index: number) {
    setActive(index);
    setManualSelection((selection) => selection + 1);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % views.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + views.length) % views.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = views.length - 1;
    else return;
    event.preventDefault();
    selectTab(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <section className="showcase" aria-label="Explore Prism">
      <div className="tabs" role="tablist" aria-label="Product views">
        {views.map((view, index) => (
          <button
            className="tab"
            key={view.id}
            id={`tab-${view.id}`}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-controls={`panel-${view.id}`}
            tabIndex={active === index ? 0 : -1}
            ref={(node) => { tabRefs.current[index] = node; }}
            onClick={() => selectTab(index)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
          >
            {view.label}
          </button>
        ))}
      </div>
      <ScrollScene className="preview-stage" scale={.97} rise={24} end={.4}>
        {views.map((view, index) => (
          <div
            key={view.id}
            id={`panel-${view.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${view.id}`}
            className={`preview-panel preview-${view.id}`}
            hidden={active !== index}
            tabIndex={0}
          >
            {active === index && <TrailBackground />}
            <img
              className="product-preview trail-foreground"
              src={assetUrl(view.id === 'workspace' ? 'workspace-complete-foreground.svg' : `${view.id}-foreground.svg`)}
              alt={view.alt}
              width="1744"
              height="788"
              fetchPriority={index === 0 ? 'high' : 'auto'}
              draggable={false}
            />
            <p className="sr-only">{view.description}</p>
          </div>
        ))}
      </ScrollScene>
    </section>
  );
}

const steps = [
  { id: 'organize', label: 'Organize', icon: 'imgFolder', detail: 'Bring primary and supporting documents into a shared legal workspace.' },
  { id: 'research', label: 'Research', icon: 'imgFileText', detail: 'Explore your sources with AI-assisted answers and supporting references.' },
  { id: 'draft', label: 'Draft', icon: 'imgPenTool', detail: 'Start with a legal template and refine your draft with Luna.' },
  { id: 'analyze', label: 'Analyze', icon: 'imgBarChart', detail: 'Extract and compare key terms across multiple documents.' },
  { id: 'review', label: 'Review', icon: 'imgClipboardCheck', detail: 'Check contracts against your team’s review playbooks.' },
  { id: 'refine', label: 'Refine', icon: 'imgRefreshCw', detail: 'Edit clauses, resolve comments, and keep a history of every version.' },
  { id: 'approve', label: 'Approve', icon: 'imgShieldCheck', detail: 'Bring your team together to review and approve the final draft.' },
  { id: 'export', label: 'Export', icon: 'imgDownload', detail: 'Export your document in Word or PDF, ready for the next step.' },
] as const;

function Lifecycle() {
  const diagram = useWorkflowEntrance();
  return (
    <section className="lifecycle" aria-labelledby="lifecycle-title">
      <HeadingReveal id="lifecycle-title">All your legal work,<br />one connected workspace.</HeadingReveal>
      <div ref={diagram} className="lifecycle-diagram" aria-label="Prism legal workflow">
        <WorkflowConnectors />
        <div className="prism-badge"><Icon name="flow-imgFrame199" /><span>Prism</span></div>
        <ol className="workflow-steps">
          {steps.map((step) => (
            <li className={`workflow-step step-${step.id}`} key={step.id} tabIndex={0} aria-describedby={`detail-${step.id}`}>
              <span className="step-icon"><Icon name={`flow-${step.icon}`} /></span>
              <span className="step-label">{step.label}</span>
              <span className="step-tooltip" role="tooltip" id={`detail-${step.id}`}>{step.detail}</span>
            </li>
          ))}
        </ol>
      </div>
      <a className="button button-dark lifecycle-cta" href={GITHUB} target="_blank" rel="noreferrer"><Icon name="hero-imgImage54Vectorized" className="github-icon" />View Github<ExternalArrow /></a>
    </section>
  );
}

function DeploymentOptions() {
  return (
    <section className="deployment" aria-labelledby="deployment-title">
      <HeadingReveal id="deployment-title">Your Infrastructure. Your Rules.</HeadingReveal>
      <LineReveal className="deployment-intro">Deploy Prism on your own infrastructure, or let our team handle setup and ongoing operations.</LineReveal>
      <div className="deployment-grid">
        <ScrollScene className="deployment-slot" start={.08} end={.45}>
        <article className="deployment-card deployment-self-hosted" aria-labelledby="self-hosted-title">
          <TrailBackground />
          <div className="deployment-copy">
            <h3 id="self-hosted-title">Self-Hosted</h3>
            <p>Your infrastructure. Your control. Get the source code, customize Prism, and run it wherever you choose.</p>
            <a className="button button-light" href={GITHUB} target="_blank" rel="noreferrer"><Icon name="hero-imgImage54Vectorized" className="github-icon" />Explore on GitHub<ExternalArrow /></a>
          </div>
          <img className="deployment-preview" src={assetUrl("deployment-self-hosted-foreground.svg")} alt="Prism’s open-source GitHub repository, with its source files ready to explore." width="639" height="457" loading="lazy" />
        </article>
        </ScrollScene>
        <ScrollScene className="deployment-slot" start={.11} end={.48}>
        <article className="deployment-card deployment-managed" aria-labelledby="managed-title">
          <TrailBackground />
          <div className="deployment-copy">
            <h3 id="managed-title">Managed by Us</h3>
            <p>We deploy, maintain, and run Prism for your team. You focus on legal work &amp; we keep the workspace running.</p>
            <a className="button button-light" href={CONTACT}>Talk to Our Team<ExternalArrow /></a>
          </div>
          <img className="deployment-preview" src={assetUrl("deployment-managed-foreground.svg")} alt="The Prism legal workspace, showing document editing, version history, and AI-assisted review." width="639" height="457" loading="lazy" />
        </article>
        </ScrollScene>
      </div>
    </section>
  );
}

const features = [
  { id: 'documents', title: 'Document Intelligence', description: 'Analyze legal documents with speed and precision.\nExtract clauses, obligations, risks, key entities, and critical information from contracts, policies, and legal documents in seconds', preview: 0, alt: 'Prism analyzing a legal agreement alongside the source document.' },
  { id: 'compliance', title: 'Compliance and Governance', description: 'Bring legal documents and compliance checks together in one place.\nPrism helps you spot gaps, flag risks, and ensure every document meets the right legal requirements.', preview: 1, alt: 'A Prism risk analysis highlighting liability, termination, and privacy compliance issues.' },
  { id: 'contracts', title: 'Contract Management', description: 'Keep your contracts organized and within reach.\nBring agreements, versions, and supporting documents into one workspace so your team can find what matters and move work forward.', preview: 2, alt: 'Prism’s contract library with agreement cards, status labels, and document filters.' },
  { id: 'workflows', title: 'Workflow Automation', description: 'Give repeatable legal work a consistent starting point.\nUse shared templates and review playbooks to streamline drafting and help your team move from first draft to final review.', preview: 4, alt: 'Prism’s template library with NDAs, service agreements, and reusable legal documents.' },
  { id: 'collaboration', title: 'Collaboration', description: 'Bring the whole team into the conversation.\nDiscuss clauses, share feedback, and resolve comments alongside the document, with the context everyone needs to make decisions.', preview: 3, alt: 'Team members discussing contract clauses in Prism’s document comments panel.' },
  { id: 'risks', title: 'Risk Assessment', description: 'Identify legal risks before they become problems.\nSpot missing clauses, compliance gaps, conflicting terms, and potential risks across your legal documents, so your team can review and act with confidence.', preview: 1, alt: 'Prism highlighting document risks and review findings.' },
] as const;

function ProductFeatures() {
  const [active, setActive] = useState(0);

  return (
    <section className="features" aria-labelledby="features-title">
      <div className="features-copy">
        <HeadingReveal id="features-title">Introducing Prism</HeadingReveal>
        <LineReveal className="features-intro">Draft faster. Check smarter. Work better.</LineReveal>
        <div className="feature-accordion">
          {features.map((feature, index) => (
            <div className="feature-item" key={feature.id}>
              <h3>
                <button type="button" id={`feature-${feature.id}`} aria-expanded={active === index} aria-controls={`feature-details-${feature.id}`} onClick={() => setActive(index)}>
                  {feature.title}
                </button>
              </h3>
              <div id={`feature-details-${feature.id}`} role="region" aria-labelledby={`feature-${feature.id}`} hidden={active !== index} className="feature-details">
                <p>{feature.description}</p>
                <a href={GITHUB} target="_blank" rel="noreferrer"><Icon name="hero-imgImage54Vectorized" className="github-icon" />View Github</a>
                <div className="feature-mobile-preview trail-artwork" data-preview={feature.preview}>
                  {active === index && <TrailBackground />}
                  <img className="trail-foreground" src={assetUrl(`feature-${feature.preview}-foreground.svg`)} alt={feature.alt} width="874" height="745" loading="lazy" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ScrollScene className="feature-preview-scene" scale={.94} rise={48}>
      <div className="feature-preview trail-artwork" data-preview={features[active].preview} aria-hidden="true">
        <TrailBackground />
        <img className="trail-foreground" key={active} src={assetUrl(`feature-${features[active].preview}-foreground.svg`)} alt="" width="874" height="745" loading="lazy" />
      </div>
      </ScrollScene>
    </section>
  );
}

const industries = [
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'banking', name: 'Banking & Financial Services' },
  { id: 'insurance', name: 'Insurance & Risk' },
  { id: 'policy', name: 'Policy Management' },
  { id: 'enterprise', name: 'Enterprise Governance' },
] as const;

function Industries() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const scrollTrigger = useRef<ScrollTrigger | null>(null);
  const navigationTween = useRef<gsap.core.Tween | null>(null);
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const el = track.current!;
    let activeIndex = -1, wasVisible = false;
    let bump: Animation | undefined;
    const update = () => {
      const distance = el.scrollWidth - el.clientWidth;
      const value = scrollTrigger.current ? scrollTrigger.current.progress : distance > 1 ? Math.max(0, Math.min(1, el.scrollLeft / distance)) : 0;
      setCanScroll(distance > 1);
      setProgress(value);
      const nextIndex = Math.round(value * (industries.length - 1));
      const bounds = el.getBoundingClientRect();
      const visible = bounds.top < innerHeight * .85 && bounds.bottom > 80;
      if (!reducedMotion && visible && (nextIndex !== activeIndex || !wasVisible)) {
        bump?.cancel();
        bump = el.querySelectorAll<HTMLElement>('.industry-card')[nextIndex].animate([
          { transform: 'translateY(0)', offset: 0 },
          { transform: 'translateY(-6px)', offset: .35 },
          { transform: 'translateY(1px)', offset: .75 },
          { transform: 'translateY(0)', offset: 1 },
        ], { duration: 540, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
      activeIndex = nextIndex;
      wasVisible = visible;
      el.querySelectorAll<HTMLElement>('.industry-card').forEach((card, index) => {
        const saturation = Math.max(0, 1 - Math.abs(value * (industries.length - 1) - index));
        card.style.setProperty('--industry-saturation', String(saturation));
        card.classList.toggle('industry-active', Math.round(value * (industries.length - 1)) === index);
      });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    const intersection = new IntersectionObserver(update, { threshold: .2 });
    intersection.observe(el);
    return () => { bump?.cancel(); el.removeEventListener('scroll', update); resize.disconnect(); intersection.disconnect(); };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const el = track.current!;
    const host = section.current!;
    const media = gsap.matchMedia();
    media.add('(min-width: 901px) and (pointer: fine)', () => {
      host.classList.add('industries-scroll-driven');
      const trigger = ScrollTrigger.create({
        id: 'industry-scroll', trigger: host, pin: true, pinSpacing: true,
        start: () => `top ${document.querySelector('.site-header')!.getBoundingClientRect().height}px`,
        end: () => `+=${Math.max(el.scrollWidth - el.clientWidth, window.innerHeight * 2)}`,
        invalidateOnRefresh: true,
        onUpdate: self => {
          el.scrollLeft = self.progress * (el.scrollWidth - el.clientWidth);
          // Also update when the browser rounds adjacent scroll positions equally.
          el.dispatchEvent(new Event('scroll'));
        },
      });
      scrollTrigger.current = trigger;
      el.scrollLeft = trigger.progress * (el.scrollWidth - el.clientWidth);
      el.dispatchEvent(new Event('scroll'));
      // Font loading and accordion copy can change the height before this section.
      // Keep the pin position aligned with the actual document layout.
      let disposed = false, refreshFrame = 0;
      const refresh = () => {
        if (disposed || refreshFrame) return;
        refreshFrame = requestAnimationFrame(() => { refreshFrame = 0; ScrollTrigger.refresh(); });
      };
      const layout = new ResizeObserver(refresh);
      document.querySelectorAll('.hero, .showcase, .deployment, .lifecycle, .features').forEach(node => layout.observe(node));
      void document.fonts.ready.then(refresh);
      return () => {
        disposed = true; layout.disconnect(); cancelAnimationFrame(refreshFrame);
        navigationTween.current?.kill();
        trigger.kill(); scrollTrigger.current = null;
        host.classList.remove('industries-scroll-driven');
        el.dispatchEvent(new Event('scroll'));
      };
    });
    return () => media.revert();
  }, [reducedMotion]);

  function navigate(value: number, instant = false) {
    const next = Math.max(0, Math.min(1, value));
    const trigger = scrollTrigger.current;
    if (trigger) {
      navigationTween.current?.kill();
      navigationTween.current = gsap.to(window, { scrollTo: { y: trigger.start + next * (trigger.end - trigger.start), autoKill: true }, duration: instant ? 0 : .65, ease: 'power3.out', overwrite: 'auto' });
    } else {
      const el = track.current!;
      el.scrollTo({ left: next * (el.scrollWidth - el.clientWidth), behavior: reducedMotion || instant ? 'instant' : 'smooth' });
    }
  }

  function move(direction: number) {
    if (scrollTrigger.current) { navigate(progress + direction / (industries.length - 1)); return; }
    const el = track.current!;
    const card = el.querySelector<HTMLElement>('.industry-card')!;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: reducedMotion ? 'instant' : 'smooth' });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      navigate(event.key === 'Home' ? 0 : 1);
    }
  }

  return (
    <section ref={section} className="industries" aria-labelledby="industries-title">
      <div className="industries-header">
        <div className="industries-heading">
          <HeadingReveal id="industries-title">Legal Work That Fits Every Industry</HeadingReveal>
        </div>
        <div className="industry-navigation">
          <button type="button" aria-label="Previous industries" aria-controls="industry-track" disabled={!canScroll || progress < .001} onClick={() => move(-1)}><Icon name="industry-arrow-right" /></button>
          <button type="button" aria-label="Next industries" aria-controls="industry-track" disabled={!canScroll || progress > .999} onClick={() => move(1)}><Icon name="industry-arrow-right" /></button>
        </div>
      </div>
      <div className="industry-track" id="industry-track" ref={track} role="group" aria-label="Industries carousel" tabIndex={0} onKeyDown={onKeyDown}>
        {industries.map((industry, index) => (
          <a className={`industry-card industry-${industry.id}`} key={industry.id} href={CONTACT} aria-label={`Discuss Prism for ${industry.name}`} onFocus={event => scrollTrigger.current ? navigate(index / (industries.length - 1), true) : event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' })}>
            <img src={assetUrl(`industry-${industry.id}.png`)} alt="" loading="lazy" draggable={false} />
            <span className="industry-arrow" aria-hidden="true"><span className="industry-card-arrow-icon" /></span>
            <span className="industry-label">{industry.name}</span>
          </a>
        ))}
      </div>
      <div className="industry-ruler" aria-hidden="true">
        {Array.from({ length: 52 }, (_, i) => <span className={i === Math.round(progress * 51) ? 'is-current' : ''} key={i} />)}
      </div>
    </section>
  );
}

const results = [
  ['80%', 'Reduction in time spent searching for legal information'],
  ['100%', 'Traceability across reviews, evidence, and compliance decisions'],
  ['70%', 'Less time spent on repetitive legal review tasks'],
  ['1000+', 'Documents, policies, and supporting files managed from a single workspace'],
] as const;

function Results() {
  return (
    <section className="results" aria-labelledby="results-title">
      <HeadingReveal id="results-title">Helping Teams Stay Focused<br /> and See Measurable Results</HeadingReveal>
      <dl className="results-list">
        {results.map(([value, label]) => (
          <div className="result-row" key={value}>
            <dt>{label}</dt>
            <dd><RollingNumber value={value} /></dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function WhyPrism() {
  return (
    <section className="why-prism" aria-labelledby="why-prism-title">
      <ScrollScene className="why-prism-visual" scale={.96} rise={40}>
        <div className="trail-artwork why-prism-artwork"><TrailBackground /><img className="trail-foreground" src={assetUrl("why-prism-foreground.svg")} alt="A legal professional reviewing documents at his desk." width="741" height="777" loading="lazy" /></div>
      </ScrollScene>
      <div className="why-prism-copy">
        <HeadingReveal id="why-prism-title">Why We Built Prism?</HeadingReveal>
        <div className="why-prism-reasons">
          <article>
            <h3>Legal work is still too fragmented.</h3>
            <LineReveal className="reason-description">Legal teams spend hours drafting documents, reviewing lengthy contracts, comparing versions, checking compliance, and managing negotiations across different tools. This makes routine legal work slower and leaves more room for missed details.</LineReveal>
          </article>
          <article>
            <h3>Prism brings the work together.</h3>
            <LineReveal className="reason-description">From drafting and analysis to compliance checks, comparisons, and negotiations, Prism gives legal teams one place to handle their day-to-day work with greater speed and control.</LineReveal>
          </article>
        </div>
      </div>
    </section>
  );
}

const securityBadges = [
  ['iso9001', 'ISO 9001'], ['iso27001', 'ISO 27001'], ['soc2', 'SOC 2'], ['soc2-type1', 'SOC 2 Type 1'], ['gdpr', 'GDPR'],
] as const;

function Security() {
  return (
    <section className="security" aria-labelledby="security-title">
      <HeadingReveal id="security-title">Legal Work Built on Trust</HeadingReveal>
      <LineReveal className="security-intro">Your legal documents hold sensitive information and carry serious business consequences. Prism is built with security, privacy, and compliance at its core, so your teams can work with confidence.</LineReveal>
      <div className="security-badges">
        {securityBadges.map(([id, label], index) => <ScrollScene key={id} scale={.96} rise={24} start={.08 + index * .02} end={.4 + index * .02}><img src={assetUrl(`security-${id}.png`)} alt={label} width="222" height="222" loading="lazy" /></ScrollScene>)}
      </div>
    </section>
  );
}

function Community() {
  return (
    <section className="community" aria-labelledby="community-title">
      <div className="community-header">
        <HeadingReveal id="community-title">Prism Legal OS Is FuturixAI’s contribution to open source.</HeadingReveal>
        <div className="community-copy">
          <LineReveal className="community-intro">We believe the best technology is built together. Prism is FuturixAI’s contribution to open source, a project designed to be shared, extended, and shaped by the community.<br />Build with us. Build in the open.</LineReveal>
          <a className="button button-light" href={GITHUB} target="_blank" rel="noreferrer"><Icon name="hero-imgImage54Vectorized" className="github-icon" />View Github<ExternalArrow /></a>
        </div>
      </div>
      <ScrollScene className="community-visual" scale={.96} rise={40}>
        <CommunityVisual />
      </ScrollScene>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="closing-cta" aria-labelledby="closing-title">
      <HeadingReveal id="closing-title">One Workspace for Smarter Legal Work.</HeadingReveal>
      <div className="closing-actions">
        <a className="button button-light" href={GITHUB} target="_blank" rel="noreferrer"><Icon name="hero-imgImage54Vectorized" className="github-icon" />View Github<ExternalArrow /></a>
        <a className="button button-outline" href={CONTACT}>Talk to Sales</a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <a className="brand footer-brand" href="#main" aria-label="Prism home"><Icon name="hero-imgFrame199" /><span>Prism Legal OS</span></a>
      <p className="footer-description">Prism by FuturixAI is a contract litigation management system that transforms complex legal work into faster, smarter, safer decisions.</p>
      <p>Copyright © {new Date().getFullYear()} FuturixAI. All rights reserved.</p>
    </footer>
  );
}

export default function App() {
  useSmoothScroll();
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
        <section className="hero" aria-labelledby="hero-title">
          <HeadingReveal as="h1" id="hero-title">The <span className="hero-open-source"><a className="hero-github-link" href={GITHUB} target="_blank" rel="noreferrer" aria-label="View Prism on GitHub"><span className="hero-github-icon" aria-hidden="true" /></a>Open Source</span><br className="desktop-break" /> Legal Operating System</HeadingReveal>
          <LineReveal className="hero-description">One Legal OS To Draft, Review,<br className="desktop-break" /> And Take Command Of Every Contract</LineReveal>
          <div className="hero-actions">
            <a className="button button-light" href={GITHUB} target="_blank" rel="noreferrer"><Icon name="hero-imgImage54Vectorized" className="github-icon" />View Github<ExternalArrow /></a>
            <a className="button button-dark" href={CONTACT}>Talk to Us</a>
          </div>
        </section>
        <ProductShowcase />
        <DeploymentOptions />
        <Lifecycle />
        <ProductFeatures />
        <Industries />
        <ExpandingSurface className="results-surface"><Results /></ExpandingSurface>
        <WhyPrism />
        <Security />
        <Community />
      </main>
      <ExpandingSurface className="closing-surface"><ClosingCTA /><Footer /></ExpandingSurface>
    </>
  );
}
