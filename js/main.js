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

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validate()) return;
    form.style.display = 'none';
    successEl.classList.add('visible');
    successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => {
      field.closest('.form-group').classList.remove('has-error');
      field.classList.remove('field-error');
    });
  });
}
