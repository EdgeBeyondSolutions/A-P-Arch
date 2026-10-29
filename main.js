(function () {
  "use strict";

  function safe(fn, name) { try { fn(); } catch (e) { if (window.console) console.error("init failed:", name, e); } }

  var IDS = ["home", "brochures", "staff", "partners", "contact", "payments"];
  var panels = {}, links = [];
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Panel router (hash-based) ---------- */
  function initRouter() {
    IDS.forEach(function (id) { panels[id] = document.getElementById("p-" + id); });
    links = Array.prototype.slice.call(document.querySelectorAll(".menu a[data-panel]"));
    var shell = document.querySelector(".shell");

    function idFromHash() {
      var h = (location.hash || "").replace("#", "");
      return IDS.indexOf(h) > -1 ? h : "home";
    }

    function show(id, userAction) {
      IDS.forEach(function (k) {
        if (!panels[k]) return;
        panels[k].classList.toggle("is-active", k === id);
      });
      links.forEach(function (a) {
        if (a.getAttribute("data-panel") === id) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });
      document.dispatchEvent(new CustomEvent("panelchange", { detail: id }));
      if (userAction) {
        if (shell && shell.getBoundingClientRect().top < 0) shell.scrollIntoView({ block: "start" });
        var h = panels[id] && panels[id].querySelector("h2");
        if (h) h.focus({ preventScroll: true });
      }
    }

    window.addEventListener("hashchange", function () { show(idFromHash(), true); });
    show(idFromHash(), false);
  }

  /* ---------- Partner carousel ---------- */
  function initCarousel() {
    var root = document.querySelector(".carousel");
    if (!root) return;
    var track = root.querySelector(".track");
    var slides = track.children;
    var timer = null, paused = false;

    function step() {
      var s = slides[0];
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      return s.getBoundingClientRect().width + gap;
    }
    function move(dir) {
      var max = track.scrollWidth - track.clientWidth;
      var next = track.scrollLeft + dir * step();
      if (dir > 0 && track.scrollLeft >= max - 4) next = 0;
      else if (dir < 0 && track.scrollLeft <= 4) next = max;
      track.scrollTo({ left: next, behavior: reduceMotion ? "auto" : "smooth" });
    }
    root.querySelectorAll(".car-btn").forEach(function (b) {
      b.addEventListener("click", function () { move(parseInt(b.getAttribute("data-dir"), 10)); });
    });

    function start() {
      if (reduceMotion || timer) return;
      timer = setInterval(function () { if (!paused && !document.hidden) move(1); }, 3800);
    }
    function stop() { clearInterval(timer); timer = null; }

    ["mouseenter", "focusin", "touchstart"].forEach(function (ev) { root.addEventListener(ev, function () { paused = true; }, { passive: true }); });
    ["mouseleave", "focusout"].forEach(function (ev) { root.addEventListener(ev, function () { paused = false; }); });

    document.addEventListener("panelchange", function (e) {
      if (e.detail === "partners") start(); else stop();
    });
    if (document.getElementById("p-partners").classList.contains("is-active")) start();
  }

  /* ---------- Contact form ---------- */
  function initForm() {
    var form = document.getElementById("contact-form");
    var status = document.getElementById("form-status");
    if (!form || !status) return;
    var fallback = "Your message was not sent. Please email alvin.apa@gmail.com or call 210.544.7785.";

    function setStatus(msg, cls) { status.textContent = msg; status.className = "form-status " + (cls || ""); }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var msg = form.elements.message.value.trim();
      if (!name || !email || !msg || email.indexOf("@") < 1) {
        setStatus("Please enter your name, a valid email, and a message.", "err");
        return;
      }
      if (form.action.indexOf("FORMSPREE_ID") > -1) { setStatus(fallback, "err"); return; }
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true; setStatus("Sending…", "");
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (r) {
          if (r.ok) { form.reset(); setStatus("Thank you. Your message was sent.", "ok"); }
          else { setStatus(fallback, "err"); }
        })
        .catch(function () { setStatus(fallback, "err"); })
        .then(function () { btn.disabled = false; });
    });
  }

  safe(initRouter, "router");
  safe(initCarousel, "carousel");
  safe(initForm, "form");
  safe(function () { var y = document.getElementById("yr"); if (y) y.textContent = new Date().getFullYear(); }, "year");
})();
