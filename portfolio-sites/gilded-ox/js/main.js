/* =====================================================================
   THE GILDED OX  ·  main.js
   Vanilla, dependency-free. Progressive enhancement only.
   ===================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Header scroll state ---------- */
  var header = $(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 36);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  var toggle = $(".nav-toggle");
  var overlay = $(".mobile-nav");
  if (toggle && overlay) {
    var setOpen = function (open) {
      overlay.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", function () {
      setOpen(!overlay.classList.contains("open"));
    });
    $$(".mobile-nav a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) setOpen(false);
    });
  }

  /* ---------- Scroll reveal + stagger ---------- */
  var reveals = $$(".reveal");
  if (reveals.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("in"); });
    } else {
      // stagger children that share a [data-stagger] parent
      $$("[data-stagger]").forEach(function (group) {
        $$(":scope > *", group).forEach(function (child, i) {
          child.style.setProperty("--d", (i * 0.09) + "s");
        });
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- Menu scrollspy ---------- */
  var menuNav = $(".menu-nav");
  if (menuNav) {
    var links = $$("a", menuNav);
    var sections = links
      .map(function (l) { return $(l.getAttribute("href")); })
      .filter(Boolean);
    if (sections.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id;
            links.forEach(function (l) {
              var active = l.getAttribute("href") === "#" + id;
              l.classList.toggle("active", active);
              if (active && l.scrollIntoView) {
                l.scrollIntoView({ block: "nearest", inline: "center" });
              }
            });
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      sections.forEach(function (s) { spy.observe(s); });
    }
  }

  /* ---------- Chip groups (forms) ---------- */
  $$("[data-chip-group]").forEach(function (group) {
    var input = $("input[type=hidden]", group) || group.nextElementSibling;
    $$(".chip", group).forEach(function (chip) {
      chip.addEventListener("click", function () {
        $$(".chip", group).forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", "true");
        if (input && input.tagName === "INPUT") input.value = chip.dataset.value || chip.textContent.trim();
      });
    });
  });

  /* ---------- FAQ accordion ---------- */
  $$(".faq-item").forEach(function (item) {
    var q = $(".faq-q", item);
    if (!q) return;
    q.addEventListener("click", function () {
      var open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* ---------- Gallery lightbox ---------- */
  var lightbox = $(".lightbox");
  if (lightbox) {
    var lbImg = $(".lightbox img", lightbox);
    var lbCap = $(".lightbox figcaption", lightbox);
    var openLb = function (src, alt, caption) {
      lbImg.src = src;
      lbImg.alt = alt || "";
      if (lbCap) lbCap.innerHTML = caption || "";
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
    };
    var closeLb = function () {
      lightbox.classList.remove("open");
      document.body.style.overflow = "";
    };
    $$("[data-lightbox]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var img = $("img", btn);
        openLb(
          btn.dataset.full || (img && img.src),
          img && img.alt,
          btn.dataset.caption || ""
        );
      });
    });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox || e.target.closest(".lightbox-close")) closeLb();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lightbox.classList.contains("open")) closeLb();
    });
  }

  /* ---------- Demo forms ---------- */
  $$("form.demo").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = $(".form-success", form);
      if (ok) {
        ok.classList.add("show");
        ok.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      }
      form.querySelectorAll("input:not([type=hidden]), textarea, select").forEach(function (f) {
        if (f.type !== "submit") f.value = "";
      });
      $$(".chip", form).forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
    });
  });

  /* ---------- Today's hours highlight ---------- */
  var today = new Date().getDay(); // 0 = Sun
  $$("[data-day]").forEach(function (el) {
    if (parseInt(el.dataset.day, 10) === today) el.classList.add("today");
  });

  /* ---------- Footer year ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Wine intro: scroll-scrub pour (canvas frame sequence) ----------
     The pour is pre-rendered to a JPEG frame sequence and painted to a canvas
     as you scroll. Frames decode on demand (off the main thread) into a small
     LRU cache with directional prefetch, so scrubbing stays smooth and memory
     stays bounded. No per-frame video seeking, which is what made it lag. */
  var wineIntro = $("[data-wine-scrub]");
  if (wineIntro) {
    var wiTrack  = $(".wine-intro-track", wineIntro);
    var wiCanvas = $(".wi-canvas", wineIntro);
    var wiCue    = $(".wi-cue", wineIntro);
    var wiLines  = $$("[data-wi-line]", wineIntro).map(function (el) {
      var a = parseFloat(el.getAttribute("data-wi-from"));
      var b = parseFloat(el.getAttribute("data-wi-to"));
      return { el: el, a: isNaN(a) ? 0 : a, b: isNaN(b) ? 1 : b };
    });

    var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
    var easeOut = function (x) { return 1 - Math.pow(1 - x, 3); };
    var paintLine = function (l, p) {
      var t = easeOut(clamp01((p - l.a) / Math.max(0.0001, l.b - l.a)));
      l.el.style.opacity = t;
      l.el.style.transform = "translate3d(0," + ((1 - t) * 26).toFixed(2) + "px,0)";
      l.el.style.filter = t > 0.985 ? "none" : "blur(" + ((1 - t) * 7).toFixed(2) + "px)";
    };

    var ctx = (wiCanvas && wiCanvas.getContext)
      ? wiCanvas.getContext("2d", { alpha: false }) : null;
    var small = window.matchMedia("(max-width: 640px)").matches;
    var FRAMES = small ? 60 : 120;
    var DIR = small ? "media/pour-800/" : "media/pour-1600/";
    var LRU_MAX = small ? 16 : 28;
    var pad = function (n) { return ("000" + n).slice(-3); };

    var bmps = {}, order = [], inflight = {};
    var curIdx = -1, wantIdx = 0, lastDir = 1, rafId = null, firstDrawn = false;
    var trackH = 0, vh = 0;

    var measure = function () { trackH = wiTrack.offsetHeight; vh = window.innerHeight; };
    var touch = function (idx) {
      var k = order.indexOf(idx);
      if (k !== -1) order.splice(k, 1);
      order.push(idx);
      while (order.length > LRU_MAX) {
        var ev = order.shift();
        if (ev === curIdx) { order.push(ev); break; }   // never evict the on-screen frame
        if (bmps[ev]) { if (bmps[ev].close) bmps[ev].close(); delete bmps[ev]; }
      }
    };
    var coverDraw = function (bmp) {
      var cw = wiCanvas.width, ch = wiCanvas.height;
      var bw = bmp.naturalWidth || bmp.width, bh = bmp.naturalHeight || bmp.height;
      var s = Math.max(cw / bw, ch / bh);
      var w = bw * s, h = bh * s;
      ctx.drawImage(bmp, (cw - w) * 0.52, (ch - h) * 0.42, w, h);
    };
    var nearestIdx = function (idx) {
      if (bmps[idx]) return idx;
      for (var d = 1; d < FRAMES; d++) {
        if (bmps[idx - d]) return idx - d;
        if (bmps[idx + d]) return idx + d;
      }
      return -1;
    };
    var schedule = function () { if (ctx && rafId === null) rafId = requestAnimationFrame(draw); };
    var decode = function (idx) {
      if (idx < 0 || idx >= FRAMES || bmps[idx] || inflight[idx]) return;
      inflight[idx] = true;
      var img = new Image();
      img.decoding = "async";
      var done = function () {
        delete inflight[idx]; bmps[idx] = img; touch(idx);
        if (idx === wantIdx) schedule();
      };
      var fail = function () { delete inflight[idx]; };
      img.onerror = fail;
      img.src = DIR + pad(idx) + ".jpg";
      if (img.decode) {
        img.decode().then(done).catch(function () {
          // decode() can reject spuriously; accept it if it actually loaded
          if (img.complete && img.naturalWidth) done(); else fail();
        });
      } else {
        img.onload = done;
      }
    };
    var draw = function () {
      rafId = null;
      var di = bmps[wantIdx] ? wantIdx : nearestIdx(wantIdx);
      if (di !== -1) {
        coverDraw(bmps[di]); curIdx = di; touch(di);
        if (!firstDrawn) { firstDrawn = true; wiCanvas.classList.add("ready"); }
      }
      decode(wantIdx);
      for (var i = 1; i <= 4; i++) decode(wantIdx + lastDir * i);
      decode(wantIdx - lastDir);
    };

    var sizeCanvas = function () {
      if (!ctx) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = wiCanvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
      if (w !== wiCanvas.width || h !== wiCanvas.height) { wiCanvas.width = w; wiCanvas.height = h; curIdx = -1; }
    };
    var progress = function () {
      var span = trackH - vh;
      return span > 0 ? clamp01(-wiTrack.getBoundingClientRect().top / span) : 0;
    };
    var onWiScroll = function () {
      var p = progress();
      var idx = Math.round(p * (FRAMES - 1));
      if (idx !== wantIdx) { lastDir = idx > wantIdx ? 1 : -1; wantIdx = idx; }
      schedule();
      for (var i = 0; i < wiLines.length; i++) paintLine(wiLines[i], p);
      if (wiCue) wiCue.style.opacity = clamp01(1 - p / 0.10);
    };

    if (reduceMotion || !ctx) {
      // Static, accessible hero: reveal all copy; paint the final filled-glass frame.
      wiLines.forEach(function (l) { l.el.style.opacity = ""; l.el.style.transform = ""; l.el.style.filter = ""; });
      if (ctx) {
        measure(); sizeCanvas(); wantIdx = FRAMES - 1; decode(FRAMES - 1);
        window.addEventListener("resize", function () { measure(); sizeCanvas(); schedule(); }, { passive: true });
      }
    } else {
      measure(); sizeCanvas();
      for (var wl = 0; wl < wiLines.length; wl++) paintLine(wiLines[wl], 0);
      onWiScroll();
      window.addEventListener("scroll", onWiScroll, { passive: true });
      window.addEventListener("resize", function () { measure(); sizeCanvas(); onWiScroll(); }, { passive: true });
    }
  }
})();
