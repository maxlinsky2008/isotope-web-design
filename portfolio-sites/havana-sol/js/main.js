/* Havana Sol — interactions */
(function () {
  "use strict";

  /* ---- Header scroll state ---- */
  const header = document.querySelector(".site-header");
  if (header && !header.classList.contains("header-solid")) {
    const onScroll = () => {
      header.classList.toggle("scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Mobile menu ---- */
  const toggle = document.querySelector(".nav-toggle");
  const body = document.body;
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = body.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      body.style.overflow = open ? "hidden" : "";
    });
    document.querySelectorAll(".mobile-menu a").forEach((a) =>
      a.addEventListener("click", () => {
        body.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
        body.style.overflow = "";
      })
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && body.classList.contains("menu-open")) {
        body.classList.remove("menu-open");
        toggle.setAttribute("aria-expanded", "false");
        body.style.overflow = "";
      }
    });
  }

  /* ---- Scroll reveal ---- */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el, i) => {
      // stagger items that share a parent grid
      const parent = el.parentElement;
      if (parent && parent.dataset.stagger !== undefined) {
        const idx = Array.prototype.indexOf.call(parent.children, el);
        el.style.setProperty("--reveal-delay", (idx % 6) * 0.08 + "s");
      }
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* ---- Menu page: scrollspy + smooth category nav ---- */
  const menuNav = document.querySelector(".menu-nav");
  if (menuNav) {
    const links = Array.from(menuNav.querySelectorAll("a"));
    const sections = links
      .map((l) => document.querySelector(l.getAttribute("href")))
      .filter(Boolean);

    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = "#" + entry.target.id;
            links.forEach((l) =>
              l.classList.toggle("active", l.getAttribute("href") === id)
            );
            // keep active chip in view
            const active = menuNav.querySelector("a.active");
            if (active)
              active.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll(".faq-q").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const open = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* ---- Chip groups (party size, etc.) ---- */
  document.querySelectorAll("[data-chip-group]").forEach((group) => {
    const hidden = group.parentElement.querySelector("input[type=hidden]");
    group.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        group.querySelectorAll(".chip").forEach((c) => {
          c.classList.remove("active");
          c.setAttribute("aria-pressed", "false");
        });
        chip.classList.add("active");
        chip.setAttribute("aria-pressed", "true");
        if (hidden) hidden.value = chip.dataset.value || chip.textContent.trim();
      });
    });
  });

  /* ---- Forms: client-side success state ---- */
  document.querySelectorAll("form[data-demo]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const success = form.querySelector(".form-success");
      if (success) {
        success.classList.add("show");
        success.setAttribute("role", "status");
        success.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      }
      form.querySelectorAll("input, select, textarea").forEach((el) => {
        if (el.type !== "hidden") el.value = "";
      });
      form.querySelectorAll(".chip.active").forEach((c) => c.classList.remove("active"));
    });
  });

  /* ---- Footer year ---- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Highlight today's hours ---- */
  document.querySelectorAll("[data-hours]").forEach((list) => {
    const today = new Date().getDay(); // 0 Sun .. 6 Sat
    list.querySelectorAll("[data-day]").forEach((row) => {
      const days = row.getAttribute("data-day").split(",").map(Number);
      if (days.includes(today)) row.classList.add("today");
    });
  });
})();
