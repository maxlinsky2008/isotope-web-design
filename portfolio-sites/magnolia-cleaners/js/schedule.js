/* Magnolia Cleaners - pickup scheduling form (demo, no backend) */
(function () {
  'use strict';

  const form = document.getElementById('pickupForm');
  if (!form) return;

  const dateInput = document.getElementById('date');
  const formShell = document.getElementById('formShell');
  const confirmCard = document.getElementById('confirmCard');

  /* ---- Min date = today (block past dates) ---- */
  const today = new Date();
  const tzOffset = today.getTimezoneOffset() * 60000;
  const todayStr = new Date(today - tzOffset).toISOString().slice(0, 10);
  dateInput.min = todayStr;

  /* ---- Validation helpers ---- */
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRe = /^[\d\s()+\-.]{10,}$/;
  const zipRe = /^\d{5}$/;

  function setInvalid(field, invalid) {
    const wrap = field.closest('.field');
    if (wrap) wrap.classList.toggle('invalid', invalid);
  }

  function validateField(field) {
    let ok = true;
    const v = field.value.trim();
    if (field.hasAttribute('required') && !v) ok = false;
    if (ok && field.type === 'email') ok = emailRe.test(v);
    if (ok && field.type === 'tel') ok = phoneRe.test(v);
    if (ok && field.id === 'zip') ok = zipRe.test(v);
    if (ok && field.id === 'date') ok = v >= todayStr;
    setInvalid(field, !ok);
    return ok;
  }

  /* live-clear errors as the user fixes them */
  form.querySelectorAll('input, select, textarea').forEach(function (f) {
    f.addEventListener('blur', function () { if (f.hasAttribute('required') || f.value) validateField(f); });
    f.addEventListener('input', function () {
      const wrap = f.closest('.field');
      if (wrap && wrap.classList.contains('invalid')) validateField(f);
    });
  });

  const serviceChips = document.querySelectorAll('input[name="services"]');
  const servicesError = document.getElementById('servicesError');
  serviceChips.forEach(function (c) {
    c.addEventListener('change', function () {
      if (anyServiceChecked()) servicesError.style.display = 'none';
    });
  });
  function anyServiceChecked() {
    return Array.prototype.some.call(serviceChips, function (c) { return c.checked; });
  }

  /* ---- Submit ---- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll('[required]').forEach(function (f) {
      if (!validateField(f)) valid = false;
    });

    if (!anyServiceChecked()) {
      servicesError.style.display = 'flex';
      valid = false;
    } else {
      servicesError.style.display = 'none';
    }

    if (!valid) {
      const firstBad = form.querySelector('.field.invalid, #servicesError[style*="flex"]');
      const target = form.querySelector('.field.invalid');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    showConfirmation();
  });

  /* ---- Build + show confirmation ---- */
  function showConfirmation() {
    const fname = document.getElementById('firstName').value.trim();
    const email = document.getElementById('email').value.trim();
    const address = document.getElementById('address').value.trim();
    const zip = document.getElementById('zip').value.trim();
    const date = document.getElementById('date').value;
    const windowVal = document.getElementById('window').value;
    const recurring = document.getElementById('recurring').checked;
    const services = Array.prototype.filter.call(serviceChips, function (c) { return c.checked; })
      .map(function (c) { return c.value; });

    const code = 'MAG-' + Math.floor(100000 + Math.random() * 900000);

    const niceDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });

    document.getElementById('confirmName').textContent = fname;
    document.getElementById('confirmEmail').textContent = email;
    document.getElementById('confirmCode').textContent = code;

    const rowStyle = 'display:flex;justify-content:space-between;gap:1rem;padding:.6rem 0;border-bottom:1px solid var(--sand);';
    document.getElementById('confirmDetails').innerHTML =
      '<div style="' + rowStyle + '"><span class="text-muted">Pickup</span><strong>' + niceDate + '</strong></div>' +
      '<div style="' + rowStyle + '"><span class="text-muted">Window</span><strong>' + windowVal.replace(/·/g, '–') + '</strong></div>' +
      '<div style="' + rowStyle + '"><span class="text-muted">Address</span><strong style="text-align:right">' + escapeHtml(address) + ', ' + zip + '</strong></div>' +
      '<div style="' + rowStyle + '"><span class="text-muted">Services</span><strong style="text-align:right">' + services.join(', ') + '</strong></div>' +
      (recurring ? '<div style="' + rowStyle + 'border-bottom:none"><span class="text-muted">Plan</span><strong style="color:var(--sage-deep)">Weekly recurring · 13% off</strong></div>'
                 : '<div style="' + rowStyle + 'border-bottom:none"><span class="text-muted">Discount</span><strong style="color:var(--sage-deep)">First order · 20% off</strong></div>');

    formShell.classList.add('hidden');
    confirmCard.classList.remove('hidden');
    confirmCard.classList.add('in');
    window.scrollTo({ top: confirmCard.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---- Book another ---- */
  const bookAnother = document.getElementById('bookAnother');
  if (bookAnother) {
    bookAnother.addEventListener('click', function () {
      form.reset();
      form.querySelectorAll('.field.invalid').forEach(function (w) { w.classList.remove('invalid'); });
      servicesError.style.display = 'none';
      confirmCard.classList.add('hidden');
      formShell.classList.remove('hidden');
      window.scrollTo({ top: formShell.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' });
    });
  }
})();
