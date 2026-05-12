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

// Hero page-load animation
const heroContent = document.querySelector('.hero__content');
const heroVisual  = document.querySelector('.hero__visual');
if (heroContent) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      heroContent.classList.add('visible');
      if (heroVisual) setTimeout(() => heroVisual.classList.add('visible'), 140);
    });
  });
}

// Portfolio
const portfolioGrid   = document.getElementById('portfolio-grid');
const portfolioFilter = document.getElementById('portfolio-filter');
const portfolioModal  = document.getElementById('portfolio-modal');

if (portfolioGrid && typeof window.PORTFOLIO_PROJECTS !== 'undefined') {
  const TRADE_LABELS = {
    hvac: 'HVAC', plumbing: 'Plumbing', landscaping: 'Landscaping',
    roofing: 'Roofing', other: 'Other',
  };
  const projects    = window.PORTFOLIO_PROJECTS;
  const modalIframe = document.getElementById('modal-iframe');
  const modalTitle  = document.getElementById('modal-title');
  const modalBadge  = document.getElementById('modal-badge');
  const modalDesc   = document.getElementById('modal-desc');
  const modalCta    = document.getElementById('modal-cta');

  // Build filter tabs only for trades that have at least one project
  const activeTrades = ['hvac', 'plumbing', 'landscaping', 'roofing', 'other']
    .filter(t => projects.some(p => p.trade === t));

  if (activeTrades.length > 0) {
    [['all', 'All'], ...activeTrades.map(t => [t, TRADE_LABELS[t]])].forEach(([val, label]) => {
      const btn = document.createElement('button');
      btn.className = 'portfolio-filter__btn' + (val === 'all' ? ' active' : '');
      btn.dataset.filter = val;
      btn.textContent = label;
      portfolioFilter.appendChild(btn);
    });
  }

  // Render cards
  if (projects.length === 0) {
    portfolioGrid.innerHTML = '<div class="portfolio-empty"><p>Projects coming soon.</p></div>';
  } else {
    projects.forEach(p => {
      const card = document.createElement('article');
      card.className = 'portfolio-card reveal';
      card.dataset.trade = p.trade;
      card.innerHTML = `
        <div class="portfolio-card__thumb">
          <img src="${p.thumb}" alt="${p.title} website screenshot" loading="lazy">
          <div class="portfolio-card__overlay"><span>View Project</span></div>
        </div>
        <div class="portfolio-card__body">
          <span class="portfolio-card__trade">${TRADE_LABELS[p.trade] || p.trade}</span>
          <h3 class="portfolio-card__title">${p.title}</h3>
        </div>`;
      card.addEventListener('click', () => openModal(p));
      portfolioGrid.appendChild(card);
    });
    portfolioGrid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }

  // Filter
  portfolioFilter.addEventListener('click', e => {
    const btn = e.target.closest('.portfolio-filter__btn');
    if (!btn) return;
    portfolioFilter.querySelectorAll('.portfolio-filter__btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    portfolioGrid.querySelectorAll('.portfolio-card').forEach(card => {
      card.classList.toggle('hidden', filter !== 'all' && card.dataset.trade !== filter);
    });
  });

  // Modal open/close
  function openModal(project) {
    modalTitle.textContent = project.title;
    modalBadge.textContent = TRADE_LABELS[project.trade] || project.trade;
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
