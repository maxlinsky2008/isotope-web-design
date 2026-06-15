// Nav scroll state
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 4);
  }, { passive: true });
}

// Mobile nav toggle
const toggle = document.getElementById('nav-toggle');
const drawer = document.getElementById('nav-drawer');
if (toggle && drawer) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('nav--open');
    toggle.setAttribute('aria-expanded', String(open));
    drawer.setAttribute('aria-hidden', String(!open));
  });

  document.addEventListener('click', e => {
    if (nav.classList.contains('nav--open') && !nav.contains(e.target)) {
      nav.classList.remove('nav--open');
      toggle.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
    }
  });

  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('nav--open');
      toggle.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
    });
  });
}

// Active nav link
const currentPage = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav__link').forEach(link => {
  if (link.getAttribute('href') === currentPage) link.classList.add('active');
});

// Scroll reveal via IntersectionObserver
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

document.querySelectorAll('.reveal').forEach(el => {
  // Hero elements animate on page load, not scroll
  if (!el.closest('.hero')) revealObserver.observe(el);
});

// Hero scroll-scrub — scroll depth drives the video timeline and reveals the
// copy line-by-line. No autoplay, no loop: the animation only ever shows how
// far you've scrolled into it.
const heroEl    = document.getElementById('hero');
const heroVideo = document.querySelector('.hero__video');
const heroSteps = Array.from(document.querySelectorAll('.hero__step'));

if (heroEl && heroVideo) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Static fallback (CSS collapses the track): show all copy, rest on a
    // fully-formed frame, no scrubbing.
    heroSteps.forEach(step => step.classList.add('is-in'));
    const showFinal = () => {
      try { heroVideo.currentTime = Math.max(0, (heroVideo.duration || 0) - 0.05); } catch (e) {}
    };
    if (heroVideo.readyState >= 1) showFinal();
    else heroVideo.addEventListener('loadedmetadata', showFinal, { once: true });
  } else {
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    let duration   = 0;
    let targetTime = 0;   // where the scroll position says the video should be
    let shownTime  = 0;   // where it currently is (eased toward target)
    let progress   = 0;
    let rafId      = null;
    let moved      = false;
    let dirty      = true;   // a scroll/resize happened; recompute layout next frame

    // Cache each step's threshold and last shown/hidden state so reveal() only
    // writes to the DOM when a step actually crosses its threshold — no class
    // churn (and no style recalc) on every frame of a long scroll.
    const stepFrom = heroSteps.map(s => parseFloat(s.dataset.from) || 0);
    const stepIn   = heroSteps.map(() => false);

    function reveal() {
      for (let i = 0; i < heroSteps.length; i++) {
        const shouldShow = progress >= stepFrom[i];
        if (shouldShow !== stepIn[i]) {
          stepIn[i] = shouldShow;
          heroSteps[i].classList.toggle('is-in', shouldShow);
        }
      }
      const wantMoved = progress > 0.02;
      if (wantMoved !== moved) {
        moved = wantMoved;
        heroEl.classList.toggle('hero--moved', wantMoved);
      }
    }

    function getProgress() {
      const scrollable = heroEl.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      return clamp(-heroEl.getBoundingClientRect().top / scrollable, 0, 1);
    }

    // Ease the shown frame toward the scroll target, and only issue a new seek
    // when the decoder is idle — paces seeks to what the browser can handle and
    // makes the scrub glide/settle instead of snapping.
    // Stop just shy of the very end — seeking to exactly duration can leave the
    // video waiting on a frame that never paints (flicker / stuck 'ended').
    const endTime = () => Math.max(0, duration - 0.05);

    // Smoothing as a time constant (ms) rather than a fixed per-frame fraction,
    // so the glide feels identical on 60Hz and 120Hz displays. ~150ms reads as
    // the same gentle catch-up the old 0.12-per-frame lerp gave at 60fps, a hair
    // more fluid. SEEK_EPS skips sub-frame seeks so the decoder isn't asked to
    // jump to a spot it's effectively already at — fewer, cleaner seeks scrub
    // smoother than a flood of imperceptible ones.
    const SMOOTH_MS = 150;
    const SEEK_EPS  = 0.008;
    let   lastT     = 0;     // timestamp of the previous frame (for dt)
    let   lastSeek  = -1;    // last currentTime we actually issued

    function loop(now) {
      // Read layout at most once per painted frame instead of once per scroll
      // event — a fling fires scroll dozens of times between paints and each
      // getBoundingClientRect() forces a reflow; we only ever need the latest.
      if (dirty) {
        dirty      = false;
        progress   = getProgress();
        targetTime = progress * endTime();
        reveal();
      }

      const dt = lastT ? Math.min(now - lastT, 50) : 16.7;   // cap after idle gaps
      lastT = now;

      const ease = 1 - Math.exp(-dt / SMOOTH_MS);
      shownTime += (targetTime - shownTime) * ease;
      const settled = Math.abs(targetTime - shownTime) < 0.004;
      if (settled) shownTime = targetTime;

      if (duration && !heroVideo.seeking) {
        const t = clamp(shownTime, 0, endTime());
        if (Math.abs(t - lastSeek) > SEEK_EPS || t === targetTime) {
          try { heroVideo.currentTime = t; lastSeek = t; } catch (e) {}
        }
      }
      // Idle the loop once the frame has settled and there's nothing new to read;
      // a fresh scroll re-arms it via schedule().
      rafId = (settled && !dirty) ? null : requestAnimationFrame(loop);
    }

    function schedule() {
      if (rafId === null) { lastT = 0; rafId = requestAnimationFrame(loop); }
    }

    function onScroll() {
      dirty = true;
      schedule();
    }

    function start() {
      duration = heroVideo.duration || 0;
      try { heroVideo.currentTime = 0; } catch (e) {}   // paint the first frame
      dirty = true;
      schedule();
    }
    if (heroVideo.readyState >= 1) start();
    else heroVideo.addEventListener('loadedmetadata', start, { once: true });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    reveal();   // set the resting state immediately (label + first line)
  }
}

// Portfolio — 3D circular gallery (auto-rotate + drag, with a mobile fallback)
const gallery        = document.getElementById('portfolio-gallery');
const galleryStage   = document.getElementById('gallery-stage');
const portfolioModal = document.getElementById('portfolio-modal');

if (gallery && galleryStage && typeof window.PORTFOLIO_PROJECTS !== 'undefined') {
  const CATEGORY_LABELS = {
    hvac: 'HVAC', plumbing: 'Plumbing', roofing: 'Roofing',
    restaurant: 'Restaurant', dining: 'Fine Dining', beauty: 'Nail Salon',
    services: 'Dry Cleaning', wellness: 'Massage & Spa', fitness: 'Fitness',
  };

  // Simple monoline glyphs (24×24, stroke = currentColor) — one per category.
  const SVG = (paths) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const ICONS = {
    hvac:       SVG('<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h9a2.4 2.4 0 1 1-2.4 2.4"/>'),
    plumbing:   SVG('<path d="M12 3s6 6.4 6 10.5a6 6 0 0 1-12 0C6 9.4 12 3 12 3z"/>'),
    roofing:    SVG('<path d="M3 11l9-7 9 7"/><path d="M5 10v9h14v-9"/>'),
    restaurant: SVG('<path d="M8 2v6a3 3 0 0 1-6 0V2M5 2v6M5 11v11"/><path d="M19 2c-1.6 1.6-2 4.2-2 6.4 0 1.6 1 2.4 2 2.4v11.2"/>'),
    dining:     SVG('<path d="M8 3h8l-1.1 6.2a3 3 0 0 1-5.8 0z"/><path d="M12 14v6M9 21h6"/>'),
    beauty:     SVG('<path d="M12 2l2 5.2L19 9l-5 1.8L12 16l-2-5.2L5 9l5-1.8z"/><path d="M18 15l.7 1.8L20.5 17.5l-1.8.7L18 20l-.7-1.8L15.5 17.5l1.8-.7z"/>'),
    services:   SVG('<path d="M12 5.5a2 2 0 1 1 2.2 2c-1 .3-1.2 1-1.2 1.8L21 15a1.6 1.6 0 0 1-1 2.9H4A1.6 1.6 0 0 1 3 15l9-5.7"/>'),
    wellness:   SVG('<path d="M12 21c-4 0-7-2.6-7-6.2 2 0 3.6.8 4.8 2.2C9.6 13.4 8.3 10.2 12 7c3.7 3.2 2.4 6.4 2.2 10 1.2-1.4 2.8-2.2 4.8-2.2 0 3.6-3 6.2-7 6.2z"/>'),
    fitness:    SVG('<path d="M6.5 8v8M4 9.5v5M17.5 8v8M20 9.5v5M6.5 12h11"/>'),
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const projects    = window.PORTFOLIO_PROJECTS;
  const modalIframe = document.getElementById('modal-iframe');
  const modalTitle  = document.getElementById('modal-title');
  const modalBadge  = document.getElementById('modal-badge');
  const modalDesc   = document.getElementById('modal-desc');
  const modalCta    = document.getElementById('modal-cta');

  const mobileQuery  = window.matchMedia('(max-width: 640px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Coverflow tuning — one "step" = the distance to the next card.
  const SPREAD       = 215;    // px a neighbor sits to the side of the focus
  const TILT         = 50;     // deg a neighbor is angled inward
  const DEPTH        = 150;    // px a neighbor is pushed back
  const SCALE_STEP   = 0.07;   // shrink per step away from the focus
  const OPACITY_STEP = 0.32;   // dim per step away from the focus
  const STEP_EVERY   = 2600;   // ms a card rests centered before advancing
  const EASE         = 0.10;   // how snappily the glide settles on a card
  const DRAG_PX      = 260;    // pixels dragged to move the focus by one card

  let cards    = [];
  let position = 0;       // fractional focus index; integer = a card centered
  let target   = 0;       // the card the gallery is gliding toward
  let dwell    = 0;       // ms the current card has been centered
  let lastT    = 0;       // timestamp of the previous frame
  let rafId    = null;
  let isMobile = mobileQuery.matches;

  // Drag state
  let dragging    = false;
  let dragMoved   = false;
  let lastX       = 0;
  let autoPaused  = false;
  let resumeTimer = null;

  function buildCards() {
    galleryStage.innerHTML = '';
    cards = [];
    gallery.classList.remove('portfolio-empty');

    if (projects.length === 0) {
      galleryStage.innerHTML = '<div class="portfolio-empty"><p>Projects coming soon.</p></div>';
      return;
    }

    projects.forEach(p => {
      const card = document.createElement('article');
      card.className = 'portfolio-card';
      const label = CATEGORY_LABELS[p.category] || p.category || '';
      const icon  = ICONS[p.category] || '';
      card.innerHTML = `
        <div class="portfolio-card__poster" style="--accent:${esc(p.accent || '#1E90FF')}">
          <div class="poster__top">
            <span class="poster__icon">${icon}</span>
            <span class="poster__cat">${esc(label)}</span>
          </div>
          <span class="poster__mono" aria-hidden="true">${esc(p.monogram || '')}</span>
          <h3 class="poster__name">${esc(p.title)}</h3>
          <div class="portfolio-card__overlay"><span>View Project</span></div>
        </div>`;
      card.addEventListener('click', () => {
        if (dragMoved) return;          // ignore the click that ends a drag
        openModal(p);
      });
      galleryStage.appendChild(card);
      cards.push(card);
    });
  }

  // Place every card relative to the current focus, coverflow-style: the
  // focused card faces us; the two neighbors angle inward and sit just to the
  // sides so their inner corners peek out. A card rotating past a neighbor
  // folds back behind the focus and fades, so the loop is seamless + infinite.
  function render() {
    const n = cards.length;
    const denom = n / 2 - 1;   // span over which a far card folds away
    cards.forEach((card, i) => {
      let rel = (i - position) % n;          // signed steps to the focus, wrapped
      if (rel >  n / 2) rel -= n;
      if (rel < -n / 2) rel += n;
      const a = Math.abs(rel);
      const s = rel < 0 ? -1 : 1;

      let x, z, rot, opacity, scale;
      if (a <= 1) {
        x = s * a * SPREAD;
        z = -a * DEPTH;
        rot = s * a * TILT;
        opacity = 1 - a * OPACITY_STEP;
        scale = 1 - a * SCALE_STEP;
      } else {
        // beyond the nearest neighbor: fold back behind the focus and fade out
        const t = denom > 0 ? Math.min(1, (a - 1) / denom) : 1;
        x = s * SPREAD * (1 - t);
        z = -DEPTH * (1 + t * 2);
        rot = s * (TILT + t * 25);
        opacity = (1 - OPACITY_STEP) * (1 - t);
        scale = (1 - SCALE_STEP) * (1 - t * 0.25);
      }

      card.style.transform =
        `translateX(${x}px) translateZ(${z}px) rotateY(${rot}deg) scale(${scale})`;
      card.style.opacity = Math.max(0, opacity).toFixed(3);
    });
  }

  function tick(now) {
    const dt = lastT ? now - lastT : 16;
    lastT = now;

    if (!dragging && !autoPaused && !reduceMotion.matches) {
      dwell += dt;
      // once a card has been centered long enough, advance to the next
      if (dwell >= STEP_EVERY && Math.abs(target - position) < 0.01) {
        dwell = 0;
        target += 1;
      }
    }
    if (!dragging) {
      position += (target - position) * EASE;   // ease/settle onto the target card
      if (Math.abs(target - position) < 0.0005) position = target;
    }
    render();
    rafId = requestAnimationFrame(tick);
  }

  function startRing() {
    stopRing();
    lastT = 0;
    render();
    rafId = requestAnimationFrame(tick);
  }
  function stopRing() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  // Drag-to-spin (desktop / tablet)
  function onPointerDown(e) {
    if (isMobile) return;
    dragging = true;
    dragMoved = false;
    autoPaused = true;
    lastX = e.clientX;
    gallery.classList.add('is-dragging');
    // No setPointerCapture: window-level move/up listeners already track the
    // drag everywhere, and capture can divert the closing click off the card.
  }
  function onPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    if (Math.abs(dx) > 2) dragMoved = true;
    lastX = e.clientX;
    position -= dx / DRAG_PX;   // drag right → the previous card swings in
  }
  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    gallery.classList.remove('is-dragging');
    target = Math.round(position);   // settle onto the nearest card
    dwell = 0;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { autoPaused = false; }, 1600);
    // clear dragMoved after the trailing click has been handled
    requestAnimationFrame(() => requestAnimationFrame(() => { dragMoved = false; }));
  }

  function bindDrag() {
    gallery.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    gallery.addEventListener('dragstart', preventDrag);
  }
  function unbindDrag() {
    gallery.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    gallery.removeEventListener('dragstart', preventDrag);
  }
  function preventDrag(e) { e.preventDefault(); }

  function applyMode() {
    isMobile = mobileQuery.matches;
    buildCards();
    if (cards.length === 0) { stopRing(); unbindDrag(); return; }
    unbindDrag();
    if (isMobile) {
      stopRing();
      cards.forEach(c => { c.style.transform = ''; c.style.opacity = ''; });
      galleryStage.style.removeProperty('--ring-rot');
    } else {
      bindDrag();
      startRing();
    }
  }

  applyMode();

  // Re-evaluate on breakpoint changes (resize / orientation)
  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener('change', applyMode);
  } else if (mobileQuery.addListener) {
    mobileQuery.addListener(applyMode); // Safari < 14
  }

  // Modal open/close — live-preview behavior preserved
  function openModal(project) {
    modalTitle.textContent = project.title;
    modalBadge.textContent = CATEGORY_LABELS[project.category] || project.category;
    modalDesc.textContent  = project.description;
    if (project.live) modalIframe.src = project.live;
    if (modalCta) modalCta.href = project.live || '#';
    portfolioModal.classList.add('open');
    portfolioModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.getElementById('modal-close').focus();
  }

  function closeModal() {
    portfolioModal.classList.remove('open');
    portfolioModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => { modalIframe.src = ''; }, 300);
  }

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && portfolioModal.classList.contains('open')) closeModal();
  });
}

// Contact form
const form = document.getElementById('contact-form');
const successEl = document.getElementById('form-success');
if (form && successEl) {
  const validate = () => {
    let ok = true;
    form.querySelectorAll('[required]').forEach(field => {
      const group = field.closest('.form-group');
      const empty = !field.value.trim();
      group.classList.toggle('has-error', empty);
      field.classList.toggle('field-error', empty);
      if (empty) ok = false;
    });
    const emailField = form.querySelector('[type="email"]');
    if (emailField && emailField.value.trim()) {
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim());
      if (!valid) {
        emailField.closest('.form-group').classList.add('has-error');
        emailField.classList.add('field-error');
        ok = false;
      }
    }
    return ok;
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) return;

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      const res = await fetch('https://formspree.io/f/xqennwon', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });
      if (!res.ok) throw new Error();
      form.style.display = 'none';
      successEl.classList.add('visible');
      successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      btn.disabled = false;
      btn.textContent = 'Send Message';
      const errEl = form.querySelector('.form-error') || (() => {
        const el = document.createElement('p');
        el.className = 'form-error';
        el.textContent = 'Something went wrong. Please try again or email directly.';
        form.querySelector('.form-submit').after(el);
        return el;
      })();
      errEl.style.display = 'block';
    }
  });

  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => {
      field.closest('.form-group').classList.remove('has-error');
      field.classList.remove('field-error');
    });
  });
}
