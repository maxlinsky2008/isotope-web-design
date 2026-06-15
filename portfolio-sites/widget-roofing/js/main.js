/* ============================================================
   Widget Roofing  ·  interactions
   ============================================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* -------------------------------------------------------------
     1.  Hero lantern  ·  the light that follows your cursor
     ------------------------------------------------------------- */
  const stage = document.getElementById("heroStage");
  const hint = document.getElementById("heroHint");

  if (stage && finePointer && !prefersReduced) {
    let targetX = 50, targetY = 44;        // % of stage
    let curX = 50, curY = 44;
    let active = false;
    let raf = null;
    let firstMove = true;

    const onMove = (e) => {
      const r = stage.getBoundingClientRect();
      const x = e.clientX, y = e.clientY;
      // only react while the pointer is roughly over the hero
      if (y < r.top - 40 || y > r.bottom + 40) return;
      targetX = clamp(((x - r.left) / r.width) * 100, -5, 105);
      targetY = clamp(((y - r.top) / r.height) * 100, -5, 105);

      if (firstMove) {
        firstMove = false;
        curX = targetX; curY = targetY;
        stage.classList.add("is-live");      // stop the idle drift
        if (hint) hint.classList.add("is-hidden");
      }
      if (!active) { active = true; loop(); }
    };

    const loop = () => {
      curX = lerp(curX, targetX, 0.12);
      curY = lerp(curY, targetY, 0.12);
      stage.style.setProperty("--mx", curX.toFixed(2) + "%");
      stage.style.setProperty("--my", curY.toFixed(2) + "%");
      if (Math.abs(curX - targetX) > 0.05 || Math.abs(curY - targetY) > 0.05) {
        raf = requestAnimationFrame(loop);
      } else {
        active = false;
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
  }

  /* -------------------------------------------------------------
     2.  Magnetic buttons
     ------------------------------------------------------------- */
  if (finePointer && !prefersReduced) {
    document.querySelectorAll(".magnetic").forEach((el) => {
      const strength = 0.32;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* -------------------------------------------------------------
     3.  Nav  ·  scroll state + mobile menu
     ------------------------------------------------------------- */
  const nav = document.getElementById("nav");
  const burger = document.getElementById("navBurger");
  const navLinks = document.getElementById("navLinks");

  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (burger && navLinks) {
    const toggle = (open) => {
      const willOpen = open ?? !navLinks.classList.contains("is-open");
      navLinks.classList.toggle("is-open", willOpen);
      nav.classList.toggle("is-open", willOpen);
      burger.setAttribute("aria-expanded", String(willOpen));
    };
    burger.addEventListener("click", () => toggle());
    navLinks.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => toggle(false))
    );
  }

  /* -------------------------------------------------------------
     4.  Scroll reveals
     ------------------------------------------------------------- */
  const reveals = document.querySelectorAll("[data-reveal]");
  reveals.forEach((el) => {
    const d = el.getAttribute("data-reveal-d");
    if (d) el.style.setProperty("--d", d);
  });

  if (prefersReduced || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("in-view"));
  } else {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* -------------------------------------------------------------
     5.  Animated stat counters
     ------------------------------------------------------------- */
  const nums = document.querySelectorAll(".stat__num[data-count]");
  const fmt = (n) => n.toLocaleString("en-US");

  const runCount = (el) => {
    const target = parseFloat(el.getAttribute("data-count"));
    const decimal = parseInt(el.getAttribute("data-decimal") || "0", 10);
    const suffix = el.getAttribute("data-suffix") || "";
    const dur = 1500;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const p = clamp((now - start) / dur, 0, 1);
      const val = target * ease(p);
      if (decimal) {
        el.textContent = (val / Math.pow(10, decimal)).toFixed(decimal) + suffix;
      } else {
        el.textContent = fmt(Math.round(val)) + suffix;
      }
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (nums.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      // leave the static markup as-is
    } else {
      const io2 = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              runCount(entry.target);
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      nums.forEach((el) => io2.observe(el));
    }
  }

  /* -------------------------------------------------------------
     6.  Estimate form (demo: validate + friendly success)
     ------------------------------------------------------------- */
  const form = document.getElementById("estimateForm");
  const success = document.getElementById("formSuccess");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      form.querySelectorAll("[required]").forEach((field) => {
        const empty = !String(field.value).trim();
        field.classList.toggle("invalid", empty);
        if (empty && ok) { field.focus(); ok = false; }
      });
      if (!ok) return;
      form.querySelectorAll(".field").forEach((f) => {
        if (f.contains(success)) return;
        f.style.display = "none";
      });
      const btn = form.querySelector("button[type=submit]");
      const fine = form.querySelector(".estimate__fineprint");
      if (btn) btn.style.display = "none";
      if (fine) fine.style.display = "none";
      if (success) success.hidden = false;
    });
    form.querySelectorAll("[required]").forEach((field) => {
      field.addEventListener("input", () => field.classList.remove("invalid"));
    });
  }

  /* -------------------------------------------------------------
     7.  Footer year
     ------------------------------------------------------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
