(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.from((scope || document).querySelectorAll(sel)); };
  var escHTML = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ---------- Architectural rendering-style placeholder generator ---------- */
  var SKIES = [
    ["#f2ead9", "#f8f4ec"],
    ["#ece2cf", "#f6f1e6"],
    ["#efe6d4", "#f9f5ea"],
    ["#e9dfcb", "#f5efe3"]
  ];
  var BUILDING = ["#33302a", "#28251f", "#3e372c"];
  var ACCENTS = ["#9c7a3c", "#3f4a3a", "#7d6748"];

  function artSVG(seed) {
    var sky = SKIES[seed % SKIES.length];
    var wall = BUILDING[seed % BUILDING.length];
    var accent = ACCENTS[seed % ACCENTS.length];
    var variant = seed % 3; // 0: gable house, 1: flat-roof modern, 2: two-volume massing
    var uid = "art" + seed;

    var shapes = "";
    if (variant === 0) {
      shapes =
        '<polygon points="70,300 200,190 330,300" fill="' + wall + '" opacity="0.92"/>' +
        '<rect x="95" y="300" width="210" height="150" fill="' + wall + '"/>' +
        '<rect x="170" y="380" width="60" height="70" fill="' + sky[1] + '" opacity="0.9"/>' +
        '<rect x="115" y="330" width="46" height="40" fill="' + accent + '" opacity="0.85"/>' +
        '<rect x="239" y="330" width="46" height="40" fill="' + accent + '" opacity="0.85"/>' +
        '<line x1="200" y1="190" x2="200" y2="450" stroke="' + sky[0] + '" stroke-width="1" opacity="0.4"/>';
    } else if (variant === 1) {
      shapes =
        '<rect x="60" y="250" width="280" height="30" fill="' + accent + '" opacity="0.8"/>' +
        '<rect x="80" y="280" width="240" height="170" fill="' + wall + '"/>' +
        '<rect x="100" y="320" width="200" height="60" fill="' + sky[1] + '" opacity="0.85"/>' +
        '<rect x="80" y="280" width="240" height="8" fill="' + sky[0] + '" opacity="0.5"/>' +
        '<rect x="240" y="200" width="70" height="50" fill="' + wall + '" opacity="0.7"/>';
    } else {
      shapes =
        '<rect x="70" y="260" width="150" height="190" fill="' + wall + '"/>' +
        '<rect x="220" y="310" width="120" height="140" fill="' + accent + '" opacity="0.82"/>' +
        '<rect x="95" y="300" width="40" height="50" fill="' + sky[1] + '" opacity="0.85"/>' +
        '<rect x="150" y="300" width="40" height="50" fill="' + sky[1] + '" opacity="0.85"/>' +
        '<rect x="245" y="345" width="70" height="45" fill="' + sky[1] + '" opacity="0.85"/>';
    }

    var treeX = 40 + (seed * 37) % 40;
    var trees = '<circle cx="' + treeX + '" cy="410" r="26" fill="' + accent + '" opacity="0.35"/>' +
      '<rect x="' + (treeX - 3) + '" y="410" width="6" height="40" fill="' + wall + '" opacity="0.3"/>';

    return '<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs><linearGradient id="' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + sky[0] + '"/><stop offset="100%" stop-color="' + sky[1] + '"/>' +
      '</linearGradient></defs>' +
      '<rect width="400" height="500" fill="url(#' + uid + ')"/>' +
      '<rect y="450" width="400" height="50" fill="' + sky[1] + '" opacity="0.6"/>' +
      trees +
      shapes +
      '</svg>';
  }
  function mountArtBlocks() {
    $$("[data-art]").forEach(function (el, i) {
      if (el.dataset.artMounted) return;
      el.dataset.artMounted = "1";
      var seed = parseInt(el.dataset.art, 10);
      if (isNaN(seed)) seed = i;
      el.insertAdjacentHTML("afterbegin", artSVG(seed));
      if (!el.querySelector(".art-tag") && el.dataset.artTag) {
        var tag = document.createElement("span");
        tag.className = "art-tag";
        tag.textContent = el.dataset.artTag;
        el.appendChild(tag);
      }
    });
  }

  /* ---------- Mounts (idempotent) ---------- */
  function mountServices() {
    var target = $("[data-services]");
    if (!target || target.children.length > 0 || !data.services) return;
    target.innerHTML = data.services.map(function (s, i) {
      return '<article class="card service-card reveal">' +
        '<span class="num">0' + (i + 1) + '</span>' +
        '<h3>' + escHTML(s.name) + '</h3>' +
        '<p class="blurb">' + escHTML(s.summary) + '</p>' +
        '</article>';
    }).join("");
  }

  function mountProjects(target, list) {
    if (!target || target.children.length > 0 || !list) return;
    target.innerHTML = list.map(function (p, i) {
      var media = p.img
        ? '<div class="art-block" style="--ar: 4/5;"><img src="' + escHTML(p.img) + '" alt="' + escHTML(p.name) + '" loading="lazy"></div>'
        : '<div class="art-block" data-art="' + (i + 1) + '" data-art-tag="' + escHTML(p.category) + '"></div>';
      return '<article class="bento-item reveal' + (i === 0 ? " is-wide" : "") + '" data-category="' + escHTML(p.category) + '">' +
        media +
        '<span class="cat">' + escHTML(p.category) + '</span>' +
        '<h3>' + escHTML(p.name) + '</h3>' +
        '<p class="blurb">' + escHTML(p.blurb) + '</p>' +
        '</article>';
    }).join("");
    mountArtBlocks();
  }

  function mountTestimonials() {
    var target = $("[data-testimonials]");
    if (!target || target.children.length > 0 || !data.testimonials) return;
    target.innerHTML = data.testimonials.map(function (t) {
      return '<div class="testimonial reveal">' +
        '<blockquote>&ldquo;' + escHTML(t.quote) + '&rdquo;</blockquote>' +
        '<cite>' + escHTML(t.author) + '</cite>' +
        '</div>';
    }).join("");
  }

  function mountFooterContact() {
    $$("[data-brand-phone]").forEach(function (el) { el.textContent = data.phone || ""; el.setAttribute("href", "tel:" + (data.phone || "").replace(/[^\d+]/g, "")); });
    $$("[data-brand-email]").forEach(function (el) { el.textContent = data.email || ""; el.setAttribute("href", "mailto:" + (data.email || "")); });
    $$("[data-brand-address]").forEach(function (el) { el.textContent = data.address || ""; });
    $$("[data-brand-hours]").forEach(function (el) { el.textContent = data.hours || ""; });
  }

  /* ---------- Nav ---------- */
  function initNav() {
    var nav = $(".nav");
    if (!nav) return;
    var onScroll = function () {
      if (window.scrollY > 12) nav.classList.add("is-solid");
      else nav.classList.remove("is-solid");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var toggle = $(".nav-toggle");
    var menu = $(".mobile-menu");
    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!open));
        menu.classList.toggle("is-open", !open);
        document.body.style.overflow = !open ? "hidden" : "";
      });
      $$("a", menu).forEach(function (a) {
        a.addEventListener("click", function () {
          toggle.setAttribute("aria-expanded", "false");
          menu.classList.remove("is-open");
          document.body.style.overflow = "";
        });
      });
    }
  }

  /* ---------- Smooth anchor scroll ---------- */
  function initAnchorScroll() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var top = el.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveals() {
    var items = $$(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
    // Safety net: reveal everything after 6s regardless
    setTimeout(function () {
      $$(".reveal:not(.is-visible)").forEach(function (el) { el.classList.add("is-visible"); });
    }, 6000);
  }

  /* ---------- Filter tabs (portfolio page) ---------- */
  function initFilters() {
    var tabs = $$(".filter-tab");
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("is-active"); });
        tab.classList.add("is-active");
        var cat = tab.dataset.filter;
        $$(".bento-item").forEach(function (item) {
          var show = cat === "all" || item.dataset.category === cat;
          item.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* ---------- Contact form ---------- */
  function initContactForm() {
    var form = $("#contact-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var status = $(".form-status", form);
      var btn = $('button[type="submit"]', form);
      var action = form.getAttribute("action") || "";
      if (!action || action.indexOf("FORMSPREE_ID") !== -1) {
        if (status) {
          status.textContent = "Demo form — connect Formspree before launch to receive submissions live.";
          status.className = "form-status is-success";
        }
        form.reset();
        return;
      }
      if (btn) btn.disabled = true;
      fetch(action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      }).then(function (res) {
        if (res.ok) {
          if (status) { status.textContent = "Thanks — we'll be in touch shortly."; status.className = "form-status is-success"; }
          form.reset();
        } else {
          if (status) { status.textContent = "Something went wrong. Please call or email us directly."; status.className = "form-status is-error"; }
        }
      }).catch(function () {
        if (status) { status.textContent = "Something went wrong. Please call or email us directly."; status.className = "form-status is-error"; }
      }).finally(function () {
        if (btn) btn.disabled = false;
      });
    });
  }

  /* ---------- GSAP-enhanced hero (optional, feature-detected) ---------- */
  function initHeroMotion() {
    if (reduced || !window.gsap) return;
    var targets = $$(".hero-kicker, .hero-title, .hero-sub, .hero-actions");
    if (!targets.length) return;
    gsap.set(targets, { opacity: 0, y: 24 });
    gsap.to(targets, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: "power3.out", delay: 0.1 });
  }

  function boot() {
    safe(mountServices, "mountServices");
    safe(function () { mountProjects($("[data-projects]"), (data.projects || []).slice(0, 4)); }, "mountProjects");
    safe(function () { mountProjects($("[data-projects-full]"), data.projects); }, "mountProjectsFull");
    safe(mountTestimonials, "mountTestimonials");
    safe(mountFooterContact, "mountFooterContact");
    safe(mountArtBlocks, "mountArtBlocks");
    safe(initNav, "initNav");
    safe(initAnchorScroll, "initAnchorScroll");
    safe(initReveals, "initReveals");
    safe(initFilters, "initFilters");
    safe(initContactForm, "initContactForm");
    safe(initHeroMotion, "initHeroMotion");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
