/* ===================================================================
   GetFit Fitness — motion & interaction
   =================================================================== */
(function () {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js");

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- NAV: stuck state + mobile menu ---------- */
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("mobileMenu");
  const closeMenu = () => {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  };
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    if (open) return closeMenu();
    menu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
  });
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

  /* ---------- SCHEDULE data + render ---------- */
  const schedule = {
    Mon: [
      ["6:00a", "Strength: Lower", "Maya", 4],
      ["12:00p", "Express HIIT", "Theo", 8],
      ["5:30p", "Boxing Fundamentals", "Dani", 0],
      ["7:00p", "Mobility Flow", "Priya", 11],
    ],
    Tue: [
      ["6:30a", "Conditioning", "Theo", 6],
      ["9:00a", "Strength: Upper", "Maya", 9],
      ["6:00p", "Spin Rhythm", "Dani", 2],
    ],
    Wed: [
      ["6:00a", "Strength: Full", "Maya", 5],
      ["12:00p", "Express HIIT", "Theo", 7],
      ["5:30p", "Yoga & Restore", "Priya", 12],
      ["7:00p", "Boxing Rounds", "Dani", 3],
    ],
    Thu: [
      ["6:30a", "Mobility Flow", "Priya", 10],
      ["12:00p", "Conditioning", "Theo", 6],
      ["6:00p", "Strength: Lower", "Maya", 1],
    ],
    Fri: [
      ["6:00a", "Strength: Upper", "Maya", 4],
      ["12:00p", "Friday Burn HIIT", "Theo", 8],
      ["5:30p", "Spin Rhythm", "Dani", 5],
    ],
    Sat: [
      ["8:00a", "Saturday Sweat", "Theo", 14],
      ["9:30a", "Strength: Full", "Maya", 6],
      ["11:00a", "Yoga & Restore", "Priya", 9],
    ],
    Sun: [
      ["9:00a", "Recovery & Mobility", "Priya", 16],
      ["10:30a", "Open Gym + Coach", "Maya", 20],
    ],
  };

  const listEl = document.getElementById("schedList");
  function renderDay(day) {
    const rows = schedule[day] || [];
    if (!rows.length) {
      listEl.innerHTML = '<p class="sched__empty">Rest day. Go on, you earned it.</p>';
      return;
    }
    listEl.innerHTML = rows
      .map(([time, klass, coach, spots]) => {
        let spotTxt, spotCls = "";
        if (spots === 0) { spotTxt = "Full · join waitlist"; spotCls = "is-full"; }
        else if (spots <= 4) { spotTxt = spots + " spots left"; spotCls = "is-low"; }
        else { spotTxt = spots + " spots"; }
        return (
          '<div class="sched__item">' +
          '<span class="sched__time">' + time + "</span>" +
          '<span class="sched__class">' + klass + "</span>" +
          '<span class="sched__coach">w/ ' + coach + "</span>" +
          '<span class="sched__spots ' + spotCls + '">' + spotTxt + "</span>" +
          "</div>"
        );
      })
      .join("");
    if (hasGSAP && !reduce) {
      gsap.fromTo(
        listEl.querySelectorAll(".sched__item"),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "expo.out" }
      );
    }
  }

  const tabs = document.querySelectorAll(".sched__tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      renderDay(tab.dataset.day);
    });
  });
  // default to current day if it has classes, else Monday
  const today = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
  const startTab = [...tabs].find((t) => t.dataset.day === today) || tabs[0];
  tabs.forEach((t) => { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
  startTab.classList.add("is-active");
  startTab.setAttribute("aria-selected", "true");
  renderDay(startTab.dataset.day);

  /* ---------- CTA form (demo) ---------- */
  const form = document.getElementById("ctaForm");
  const msg = document.getElementById("ctaMsg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email");
    if (!email.value || !email.validity.valid) {
      msg.textContent = "Pop in a valid email and we'll set you up.";
      email.focus();
      return;
    }
    msg.textContent = "You're in! Check your inbox for your free-week pass. 💪";
    form.reset();
  });

  /* ---------- REDUCED MOTION: bail out of choreography ---------- */
  if (reduce || !hasGSAP) {
    document.querySelectorAll("[data-reveal],[data-anim]").forEach((el) => {
      el.style.opacity = 1; el.style.transform = "none";
    });
    document.querySelectorAll(".hero__word .ltr").forEach((el) => {
      el.style.opacity = 1; el.style.transform = "none";
    });
    // show final stat values instead of leaving them at 0
    document.querySelectorAll(".stat__num").forEach((el) => {
      const t = parseFloat(el.dataset.count);
      el.textContent = (t >= 1000 ? Math.round(t).toLocaleString() : Math.round(t)) + (el.dataset.suffix || "");
    });
    return;
  }

  /* ---------- HERO load timeline ---------- */
  const heroLetters = document.querySelectorAll(".hero__word .ltr");
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.to(".hero__eyebrow", { opacity: 1, y: 0, duration: 0.8 }, 0.1)
    .to(heroLetters, { opacity: 1, y: 0, duration: 1.1, stagger: 0.07 }, 0.2)
    .to([".hero__sub", ".hero__cta"], { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 }, 0.7);

  // Pulse line draw using stroke-dashoffset (no paid plugin needed)
  const pulse = document.querySelector(".hero__pulse path");
  if (pulse) {
    const len = pulse.getTotalLength();
    pulse.style.strokeDasharray = len;
    pulse.style.strokeDashoffset = len;
    gsap.to(pulse, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut", delay: 0.6 });
    // subtle continuous "heartbeat" shimmer after draw
    gsap.to(".hero__pulse", { opacity: 0.7, duration: 1.2, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 2 });
  }

  /* ---------- MARQUEE infinite loop ---------- */
  const track = document.getElementById("marqueeTrack");
  if (track) {
    track.innerHTML += track.innerHTML; // duplicate for seamless loop
    const half = track.scrollWidth / 2;
    gsap.to(track, { x: -half, duration: 22, ease: "none", repeat: -1 });
  }

  /* ---------- SCROLL REVEALS ---------- */
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.9, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 86%" },
    });
  });

  // grouped stagger for the why-list & bento children when parent enters
  gsap.utils.toArray(".bento").forEach((grid) => {
    gsap.fromTo(grid.querySelectorAll(".tile"),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: "expo.out",
        scrollTrigger: { trigger: grid, start: "top 82%" } });
  });

  /* ---------- STAT COUNT-UPS ---------- */
  document.querySelectorAll(".stat__num").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => {
        gsap.to(obj, {
          v: target, duration: 1.8, ease: "expo.out",
          onUpdate: () => {
            const n = obj.v;
            el.textContent = (n >= 1000 ? Math.round(n).toLocaleString() : Math.round(n)) + suffix;
          },
        });
      },
    });
  });

  /* ---------- GALLERY parallax ---------- */
  document.querySelectorAll(".gallery__item").forEach((item) => {
    const depth = parseFloat(item.dataset.parallax) || 0.1;
    const img = item.querySelector("img");
    gsap.set(img, { scale: 1.18 });
    gsap.to(img, {
      yPercent: depth * 100,
      ease: "none",
      scrollTrigger: { trigger: item, start: "top bottom", end: "bottom top", scrub: true },
    });
  });

  /* ---------- HERO background subtle parallax on scroll ---------- */
  gsap.to(".hero__glow", {
    yPercent: 30, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
})();
