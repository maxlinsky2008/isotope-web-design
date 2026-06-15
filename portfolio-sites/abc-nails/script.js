/* =====================================================================
   ABC Nails — interactions
   Vanilla JS, no dependencies. All features degrade gracefully.
   ===================================================================== */
(function () {
  "use strict";
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Current year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky / condensing header ---------- */
  const header = $(".site-header");
  const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile nav drawer ---------- */
  const toggle = $("#nav-toggle");
  const nav = $("#primary-nav");
  const closeNav = () => {
    nav.classList.remove("is-open");
    toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  };
  const openNav = () => {
    nav.classList.add("is-open");
    toggle.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
  };
  toggle.addEventListener("click", () =>
    nav.classList.contains("is-open") ? closeNav() : openNav()
  );
  // Close when a link is tapped or Escape is pressed
  $$("#primary-nav a").forEach((a) => a.addEventListener("click", closeNav));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      closeNav();
      toggle.focus();
    }
  });

  /* ---------- Scroll reveals (one shared observer) ---------- */
  const revealEls = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Scroll-spy: highlight current nav link ---------- */
  const navLinks = $$('#primary-nav a[href^="#"]');
  const sections = navLinks
    .map((l) => $(l.getAttribute("href")))
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = "#" + entry.target.id;
            navLinks.forEach((l) =>
              l.classList.toggle("is-current", l.getAttribute("href") === id)
            );
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Gallery filter ---------- */
  const chips = $$(".chip");
  const items = $$(".gallery-item");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => {
        c.classList.remove("is-active");
        c.setAttribute("aria-selected", "false");
      });
      chip.classList.add("is-active");
      chip.setAttribute("aria-selected", "true");
      const filter = chip.dataset.filter;
      items.forEach((item) => {
        const show = filter === "all" || item.dataset.cat === filter;
        item.classList.toggle("is-hidden", !show);
      });
    });
  });

  /* ---------- Testimonial slider ---------- */
  const track = $("#tst-track");
  if (track) {
    const cards = $$(".tst-card", track);
    const dotsWrap = $("#tst-dots");
    let index = cards.findIndex((c) => c.classList.contains("is-active"));
    if (index < 0) index = 0;
    let timer;

    // Build dots
    cards.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Go to testimonial " + (i + 1));
      dot.addEventListener("click", () => go(i, true));
      dotsWrap.appendChild(dot);
    });
    const dots = $$("button", dotsWrap);

    function go(next, user) {
      cards[index].classList.remove("is-active");
      dots[index].classList.remove("is-active");
      index = (next + cards.length) % cards.length;
      cards[index].classList.add("is-active");
      dots[index].classList.add("is-active");
      if (user) restart();
    }
    function restart() {
      if (reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(() => go(index + 1, false), 6000);
    }

    $(".tst-next").addEventListener("click", () => go(index + 1, true));
    $(".tst-prev").addEventListener("click", () => go(index - 1, true));
    dots[index].classList.add("is-active");
    restart();

    // Pause on hover
    const stage = $(".tst-stage");
    stage.addEventListener("mouseenter", () => clearInterval(timer));
    stage.addEventListener("mouseleave", restart);
  }

  /* ---------- Booking form (demo) ---------- */
  const bookingForm = $("#booking-form");
  if (bookingForm) {
    const note = $("#form-note");
    const dateInput = $("#bf-date");
    if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

    bookingForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#bf-name").value.trim();
      const service = $("#bf-service").value;
      const date = $("#bf-date").value;
      if (!name || !service || !date) {
        note.textContent = "Please add your name, a service and a date.";
        note.classList.remove("is-success");
        return;
      }
      note.textContent = `Thank you, ${name}! We'll confirm your ${service} on ${date} shortly.`;
      note.classList.add("is-success");
      bookingForm.reset();
    });
  }

  /* ---------- Newsletter (demo) ---------- */
  const newsForm = $("#news-form");
  if (newsForm) {
    const newsNote = $("#news-note");
    newsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = newsForm.querySelector("input").value.trim();
      if (!email) return;
      newsNote.textContent = "You're on the list — see you soon ✦";
      newsForm.reset();
    });
  }

  /* ---------- About stats: count up when scrolled into view ---------- */
  const statsWrap = $("#about-stats");
  if (statsWrap) {
    const nums = $$(".about-stat-num", statsWrap);
    const format = (val, decimals) =>
      val.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    const setFinal = (el) => {
      const target = parseFloat(el.dataset.count) || 0;
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      el.textContent = format(target, decimals) + (el.dataset.suffix || "");
    };
    const animate = (el) => {
      const target = parseFloat(el.dataset.count) || 0;
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const suffix = el.dataset.suffix || "";
      const duration = 1500;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = format(target * eased, decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nums.forEach(setFinal);
    } else {
      const counter = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              nums.forEach(animate);
              obs.disconnect();
            }
          });
        },
        { threshold: 0.4 }
      );
      counter.observe(statsWrap);
    }
  }

  /* ---------- Image fallback: keep layout premium if a photo fails ---------- */
  $$(".img-frame img, .tst-card figcaption img").forEach((img) => {
    const fail = () => {
      const frame = img.closest(".img-frame") || img.parentElement;
      if (frame) frame.classList.add("is-broken");
      img.style.opacity = "0";
    };
    img.addEventListener("error", fail);
    // Catch already-failed images (cached errors before listener attached)
    if (img.complete && img.naturalWidth === 0) fail();
  });
})();
