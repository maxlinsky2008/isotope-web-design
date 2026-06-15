/* Magnolia Cleaners - shared interactions */
(function () {
  'use strict';

  /* ---- Mobile nav toggle ---- */
  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      const open = links.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- Sticky header shadow (IntersectionObserver, no scroll listener) ---- */
  const header = document.querySelector('.site-header');
  if (header && 'IntersectionObserver' in window) {
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none;';
    document.body.prepend(sentinel);
    const headerIO = new IntersectionObserver(function (entries) {
      header.classList.toggle('scrolled', !entries[0].isIntersecting);
    }, { threshold: 0 });
    headerIO.observe(sentinel);
  } else if (header) {
    header.classList.add('scrolled');
  }

  /* ---- Scroll reveal ---- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq__item').forEach(function (item) {
    const q = item.querySelector('.faq__q');
    const a = item.querySelector('.faq__a');
    if (!q || !a) return;
    q.addEventListener('click', function () {
      const isOpen = item.classList.contains('open');
      // close siblings
      const parent = item.closest('.faq');
      if (parent) {
        parent.querySelectorAll('.faq__item.open').forEach(function (other) {
          if (other !== item) {
            other.classList.remove('open');
            other.querySelector('.faq__a').style.maxHeight = null;
            other.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
          }
        });
      }
      if (isOpen) {
        item.classList.remove('open');
        a.style.maxHeight = null;
        q.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---- Reusable scroll-scrub section ----
     Pins a section's video and seeks it to scroll position, while toggling
     staged content reveals. Used by both the hero and the "What we do" section. */
  function initScrubSection(section, opts) {
    if (!section) return;
    var track = section.querySelector(opts.trackSel);
    var video = section.querySelector(opts.videoSel);
    var stages = Array.prototype.slice.call(section.querySelectorAll('[data-stage]'));
    var thresholds = opts.thresholds;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

    function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

    function revealStagesOnView() {
      if ('IntersectionObserver' in window) {
        var sio = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add('is-in'); sio.unobserve(e.target); }
          });
        }, { threshold: 0.2 });
        stages.forEach(function (el) { sio.observe(el); });
      } else {
        stages.forEach(function (el) { el.classList.add('is-in'); });
      }
    }

    if (reduceMotion || coarse || !track || !video) {
      /* Static / mobile fallback: no pin, looping backdrop, normal reveals */
      section.classList.add(opts.staticClass);
      if (video && !reduceMotion) {
        video.loop = true; video.muted = true;
        var playP = video.play();
        if (playP && playP.catch) { playP.catch(function () {}); }
      }
      revealStagesOnView();
      return;
    }

    /* Desktop scrub: video motion tied to scroll position */
    var duration = 0, rafId = null, running = false;
    var current = 0, lastSet = -1;
    /* One frame of a ~30fps clip. Seeking finer than this just re-decodes the
       same picture, so we skip it. */
    var SEEK_STEP = 1 / 30;

    video.pause();
    function onMeta() { duration = video.duration || 0; }
    if (video.readyState >= 1) { onMeta(); }
    video.addEventListener('loadedmetadata', onMeta);
    /* Nudge the first frame to paint so the stage is never blank before scrub */
    function paintFirstFrame() { try { video.currentTime = 0.05; } catch (err) {} }
    if (video.readyState >= 2) { paintFirstFrame(); }
    else { video.addEventListener('loadeddata', paintFirstFrame, { once: true }); }

    function progress() {
      var dist = track.offsetHeight - window.innerHeight;
      if (dist <= 0) return 0;
      return clamp(-track.getBoundingClientRect().top / dist, 0, 1);
    }

    function frame() {
      var p = progress();
      for (var i = 0; i < stages.length; i++) {
        var idx = parseInt(stages[i].getAttribute('data-stage'), 10);
        var t = (idx >= 0 && idx < thresholds.length) ? thresholds[idx] : 0;
        stages[i].classList.toggle('is-in', p >= t);
      }
      if (duration > 0) {
        var target = p * duration;
        current += (target - current) * 0.16;
        if (Math.abs(target - current) < 0.004) { current = target; }
        /* Only issue a seek when the decoder is idle (video.seeking === false).
           HD seeks take longer than a frame, so firing every rAF piles them up
           and thrashes the decoder — that is the lag. Gating on the in-flight
           seek lets it run at its natural pace and always lands on the latest
           eased position. SEEK_STEP drops redundant same-frame seeks. */
        if (!video.seeking && video.readyState >= 2 &&
            Math.abs(current - lastSet) >= SEEK_STEP) {
          try { video.currentTime = current; lastSet = current; } catch (err) {}
        }
      }
      if (running) { rafId = requestAnimationFrame(frame); }
    }

    function start() { if (!running) { running = true; rafId = requestAnimationFrame(frame); } }
    function stop() { running = false; if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { start(); } else { stop(); }
      }, { threshold: 0 });
      vio.observe(section);
    } else {
      start();
    }
  }

  /* Hero: front-loaded reveals so headline lands almost immediately */
  initScrubSection(document.querySelector('.hero'), {
    trackSel: '.hero__track', videoSel: '.hero__video',
    staticClass: 'hero--static', thresholds: [0.00, 0.16, 0.34, 0.55]
  });
  /* "What we do" iron section */
  initScrubSection(document.querySelector('.ironscape'), {
    trackSel: '.ironscape__track', videoSel: '.ironscape__video',
    staticClass: 'ironscape--static', thresholds: [0.02, 0.28, 0.54, 0.80]
  });

  /* ---- Footer year ---- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
