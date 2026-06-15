/* ==========================================================================
   KNEAD ATL  ·  interactions
   nav · theme · mobile menu · reveals · magnetic · ritual pan ·
   counters · service filter · session configurator · form states
   All motion respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---- Theme (day / evening) -------------------------------------------- */
  var THEME_KEY = "knead-theme";
  function applyTheme(t) {
    if (t === "evening") document.documentElement.setAttribute("data-theme", "evening");
    else document.documentElement.removeAttribute("data-theme");
  }
  applyTheme(localStorage.getItem(THEME_KEY));
  $$(".theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var now = document.documentElement.getAttribute("data-theme") === "evening" ? "day" : "evening";
      localStorage.setItem(THEME_KEY, now);
      applyTheme(now);
    });
  });

  /* ---- Nav: scrolled state + hide on scroll-down ------------------------ */
  var nav = $(".nav");
  if (nav) {
    var lastY = window.scrollY, ticking = false;
    function onScroll() {
      var y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 24);
      if (y > lastY && y > 420 && !$(".mobile-menu.open")) nav.classList.add("is-hidden");
      else nav.classList.remove("is-hidden");
      lastY = y;
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
  }

  /* ---- Mobile menu ------------------------------------------------------ */
  var burger = $(".burger"), mobile = $(".mobile-menu");
  function closeMenu() { if (mobile) { mobile.classList.remove("open"); mobile.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; if (burger) { burger.classList.remove("on"); burger.setAttribute("aria-expanded", "false"); } } }
  if (burger && mobile) {
    burger.setAttribute("aria-expanded", "false");
    burger.addEventListener("click", function () {
      var open = mobile.classList.toggle("open");
      burger.classList.toggle("on", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      mobile.setAttribute("aria-hidden", open ? "false" : "true");
      document.body.style.overflow = open ? "hidden" : "";
    });
    $$(".mobile-menu a").forEach(function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  }

  /* ---- Scroll reveal ---------------------------------------------------- */
  var reveals = $$(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Magnetic buttons ------------------------------------------------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    $$("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2;
        var my = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + mx * 0.22 + "px," + my * 0.3 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---- Animated counters ------------------------------------------------ */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = (el.getAttribute("data-dec") === "1");
    if (reduceMotion) { el.textContent = dec ? target.toFixed(1) : target.toLocaleString(); return; }
    var start = null, dur = 1600;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      var val = target * eased;
      el.textContent = dec ? val.toFixed(1) : Math.floor(val).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = dec ? target.toFixed(1) : target.toLocaleString();
    }
    requestAnimationFrame(step);
  }
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else { counters.forEach(animateCount); }

  /* ---- Ritual horizontal pan (GSAP) ------------------------------------- */
  var panSection = $("[data-pan]");
  if (panSection && window.gsap && window.ScrollTrigger && !reduceMotion && window.innerWidth > 760) {
    gsap.registerPlugin(ScrollTrigger);
    panSection.classList.add("is-panning");
    var track = $(".pan-track", panSection);
    var bar = $(".pan-progress i", panSection);
    var dist = function () { return track.scrollWidth - window.innerWidth + 80; };
    gsap.to(track, {
      x: function () { return -dist(); },
      ease: "none",
      scrollTrigger: {
        trigger: panSection,
        start: "top top",
        end: function () { return "+=" + dist(); },
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: function (self) { if (bar) bar.style.width = (self.progress * 100).toFixed(1) + "%"; }
      }
    });
  }

  /* ---- Services filter -------------------------------------------------- */
  var chips = $$(".chip");
  if (chips.length) {
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        var cat = chip.getAttribute("data-cat");
        $$(".svc-card").forEach(function (card) {
          var show = cat === "all" || card.getAttribute("data-cat") === cat;
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* ---- Session configurator -------------------------------------------- */
  var cfg = $("[data-config]");
  if (cfg) {
    var money = function (n) { return "$" + n; };

    function singleSelect(opt) {
      var group = opt.getAttribute("data-group");
      $$('.opt[data-group="' + group + '"]', cfg).forEach(function (o) { o.classList.remove("sel"); });
      opt.classList.add("sel");
    }

    $$(".opt", cfg).forEach(function (opt) {
      opt.setAttribute("tabindex", "0");
      opt.setAttribute("role", "button");
      function activate() {
        if (opt.classList.contains("addon-opt")) opt.classList.toggle("sel");
        else singleSelect(opt);
        renderSummary();
      }
      opt.addEventListener("click", activate);
      opt.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
      });
    });

    function renderSummary() {
      var svc = $('.opt.sel[data-group="service"]', cfg);
      var dur = $('.opt.sel[data-group="duration"]', cfg);
      var addons = $$(".addon-opt.sel", cfg);
      var lines = $("[data-summary-lines]");
      var totalEl = $("[data-summary-total]");
      var bookBtn = $("[data-summary-book]");
      lines.innerHTML = "";
      var total = 0;

      if (!svc) {
        lines.innerHTML = '<div class="line empty">Pick a massage to begin building your session.</div>';
        if (totalEl) totalEl.textContent = "$0";
        if (bookBtn) bookBtn.setAttribute("aria-disabled", "true");
        return;
      }
      if (bookBtn) bookBtn.removeAttribute("aria-disabled");

      var base = parseInt(svc.getAttribute("data-price"), 10);
      total += base;
      addLine(svc.getAttribute("data-name"), money(base));

      if (dur) {
        var add = parseInt(dur.getAttribute("data-add"), 10) || 0;
        total += add;
        addLine(dur.getAttribute("data-name") + " session", add ? "+" + money(add) : "included");
      }
      addons.forEach(function (a) {
        var p = parseInt(a.getAttribute("data-price"), 10);
        total += p;
        addLine(a.getAttribute("data-name"), "+" + money(p));
      });

      if (totalEl) totalEl.textContent = money(total);

      function addLine(label, val) {
        var d = document.createElement("div");
        d.className = "line";
        d.innerHTML = "<span>" + label + "</span><span>" + val + "</span>";
        lines.appendChild(d);
      }
    }
    renderSummary();
  }

  /* ---- Form validation + success --------------------------------------- */
  $$("form[data-validate]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      $$("[required]", form).forEach(function (input) {
        var field = input.closest(".field");
        var valid = input.value.trim() !== "" && (input.type !== "email" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value));
        if (field) field.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      if (!ok) { var bad = $(".field.invalid input, .field.invalid select", form); if (bad) bad.focus(); return; }
      var card = form.closest(".form-card");
      if (card) card.classList.add("sent");
      var success = $(".form-success", card || form);
      if (success) success.classList.add("show");
    });
    $$("[required]", form).forEach(function (input) {
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field && field.classList.contains("invalid")) field.classList.remove("invalid");
      });
    });
  });

  /* ---- Footer year ------------------------------------------------------ */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
