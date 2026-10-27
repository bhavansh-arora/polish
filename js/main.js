/* Polish — site behaviour (no dependencies). Motion lives in motion.js. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var store = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  var ready = false, readyQ = [];
  window.POLISH = window.POLISH || {};
  window.POLISH.onReady = function (fn) { if (ready) fn(); else readyQ.push(fn); };
  function fireReady() { if (ready) return; ready = true; readyQ.forEach(function (f) { f(); }); document.dispatchEvent(new CustomEvent("polish:ready")); }

  /* ---------- preloader (first visit in a session) ---------- */
  var pre = $(".preloader");
  if (pre && !doc.classList.contains("no-preload") && !reduce) {
    store.set("polish-seen", "1");
    var count = $(".preloader__count span", pre), words = $$(".preloader__words span", pre);
    var t0 = performance.now(), dur = 2200;
    (function tick(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      pre.style.setProperty("--p", e.toFixed(3));
      count.textContent = Math.round(e * 100);
      words.forEach(function (w, i) { w.classList.toggle("is-lit", e >= (i + 1) / (words.length + 1)); });
      if (k < 1) requestAnimationFrame(tick);
      else setTimeout(function () {
        pre.classList.add("is-done");
        setTimeout(fireReady, 500);
        setTimeout(function () { pre.remove(); }, 1500);
      }, 250);
    })(t0);
  } else {
    if (pre) pre.remove();
    if (doc.classList.contains("is-entering")) setTimeout(fireReady, 350); else fireReady();
  }

  /* ---------- page curtain ---------- */
  var curtain = $(".curtain");
  if (curtain && doc.classList.contains("is-entering")) {
    requestAnimationFrame(function () {
      curtain.classList.add("is-leaving");
      setTimeout(function () { doc.classList.remove("is-entering"); curtain.classList.remove("is-leaving"); }, 1200);
    });
  }
  var labels = { "index.html": "Home", "coaching.html": "Executive <em>coaching</em>", "programmes.html": "Programmes &amp; <em>courses</em>", "approach.html": "The nine <em>pillars</em>",
    "speaking.html": "Keynote <em>speaking</em>", "about.html": "About <em>Melissa</em>", "insights.html": "<em>Insights</em>", "article.html": "<em>Insights</em>",
    "assessment.html": "Readiness <em>check</em>", "contact.html": "Say <em>hello</em>", "ideas.html": "Ideas for <em>Polish</em>" };
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || !curtain || reduce) return;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || a.target === "_blank" || a.hasAttribute("download") || /^(mailto:|tel:|https?:|data:)/.test(href) || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var file = href.split(/[?#]/)[0];
    if (!file || file === location.pathname.split("/").pop() && href.indexOf("#") > -1) return;
    e.preventDefault();
    var pg = $(".curtain__page span:last-child", curtain);
    if (pg) pg.innerHTML = labels[file] || "Polish";
    curtain.classList.add("is-on");
    store.set("polish-curtain", "1");
    setTimeout(function () { location.href = href; }, 720);
  });
  window.addEventListener("pageshow", function (e) { if (e.persisted && curtain) curtain.classList.remove("is-on"); });

  /* ---------- header + progress ---------- */
  var header = $(".site-header"), lastY = window.scrollY, sticky = $(".sticky-cta"), heroEl = $(".hero, .phero");
  function onScroll() {
    var y = window.scrollY, max = doc.scrollHeight - window.innerHeight;
    doc.style.setProperty("--sp", max > 0 ? (y / max).toFixed(4) : 0);
    if (header && !document.body.classList.contains("menu-open")) header.classList.toggle("is-hidden", y > lastY && y > 400);
    if (sticky) {
      var past = heroEl ? y > heroEl.offsetHeight * 0.8 : y > 600;
      var nearEnd = y > max - 900;
      sticky.classList.toggle("is-visible", past && !nearEnd);
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- menu ---------- */
  var mbtn = $(".menu-btn"), menu = $(".menu");
  if (mbtn && menu) {
    var setMenu = function (open) {
      document.body.classList.toggle("menu-open", open);
      mbtn.setAttribute("aria-expanded", open ? "true" : "false");
      $(".menu-btn__label", mbtn).textContent = open ? "Close" : "Menu";
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      if (open) header.classList.remove("is-hidden");
    };
    mbtn.addEventListener("click", function () { setMenu(!document.body.classList.contains("menu-open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  /* ---------- rotator ---------- */
  $$("[data-rotator]").forEach(function (r) {
    var track = $(".rotator__track", r), items = $$(".rotator__word", r), i = 0;
    if (items.length < 2 || reduce) return;
    track.appendChild(items[0].cloneNode(true));
    setInterval(function () {
      i++;
      track.style.transition = "";
      track.style.transform = "translateY(" + (-i * 100 / (items.length + 1)) + "%)";
      if (i === items.length) setTimeout(function () { track.style.transition = "none"; track.style.transform = "translateY(0)"; i = 0; }, 850);
    }, 2400);
  });

  /* ---------- hero card carousel ---------- */
  var hcard = $(".hero-card");
  if (hcard) {
    var slides = $$(".hero-card__slide", hcard), cur = 0, dotsN = $(".hero__dots [data-cur]"), bar = $(".hero__bar i");
    var DUR = 5200, start = performance.now();
    var show = function (n) {
      slides.forEach(function (s, k) { s.classList.toggle("is-active", k === n); s.setAttribute("aria-hidden", k === n ? "false" : "true"); });
      if (dotsN) dotsN.textContent = "0" + (n + 1);
      start = performance.now();
    };
    show(0);
    if (!reduce && slides.length > 1) (function loop(t) {
      var k = Math.min(1, (t - start) / DUR);
      if (bar) bar.style.transform = "scaleX(" + k.toFixed(3) + ")";
      if (k >= 1 && !hcard.matches(":hover")) { cur = (cur + 1) % slides.length; show(cur); }
      requestAnimationFrame(loop);
    })(start);
  }

  /* ---------- hero video ---------- */
  var video = $(".hero video, .phero video");
  if (video) {
    var src = window.innerWidth < 760 ? video.getAttribute("data-src-sm") : video.getAttribute("data-src");
    if (src) video.src = src;
    if (reduce) video.removeAttribute("autoplay"); else { var pp = video.play(); if (pp && pp.catch) pp.catch(function () {}); }
    var vt = $(".video-toggle");
    if (vt) {
      var lab = function () { $("span", vt).textContent = video.paused ? "Play film" : "Pause film"; vt.setAttribute("aria-pressed", video.paused ? "true" : "false"); };
      vt.addEventListener("click", function () { if (video.paused) video.play(); else video.pause(); lab(); });
      video.addEventListener("play", lab); video.addEventListener("pause", lab); lab();
    }
  }

  /* ---------- flip the thought ---------- */
  var flip = $("[data-flip]");
  if (flip) {
    var thoughts = [
      ["“AI is going to make my team feel replaceable.”", "AI takes the repeatable, so my team can do <em>more of the work only people can do.</em>"],
      ["“I need to be the AI expert before I can lead this.”", "I need to be clear on the <em>why.</em> The expertise can sit with my team."],
      ["“If I admit I'm unsure, I'll lose credibility.”", "Saying “I'm learning too” <em>gives everyone permission</em> to learn."],
      ["“We'll wait until things settle down.”", "Change won't settle. <em>Small, safe experiments</em> can start this week."],
      ["“My people are resisting the change.”", "My people are asking for <em>clarity</em> — and I can give it."]
    ];
    var fi = 0, sw = $("input", flip), before = $(".before", flip), after = $(".after", flip), state = $("[data-flip-state]", flip), dots = $(".flip-dots", flip);
    dots.innerHTML = thoughts.map(function () { return "<i></i>"; }).join("");
    var paint = function () {
      before.textContent = thoughts[fi][0]; after.innerHTML = thoughts[fi][1];
      $$("i", dots).forEach(function (d, k) { d.classList.toggle("is-on", k === fi); });
    };
    var setFlip = function (on) { flip.classList.toggle("is-flipped", on); sw.checked = on; state.textContent = on ? "Reframed" : "The thought"; };
    sw.addEventListener("change", function () { setFlip(sw.checked); });
    $("[data-flip-next]", flip).addEventListener("click", function () {
      setFlip(false);
      setTimeout(function () { fi = (fi + 1) % thoughts.length; paint(); }, 280);
    });
    paint();
  }

  /* ---------- mini RBP calculator ---------- */
  $$("[data-mini-calc]").forEach(function (mc) {
    var r = $("input[type=range]", mc), outN = $("[data-n]", mc), outT = $("[data-t]", mc), outS = $("[data-s]", mc);
    var fmt = function (v) { return "NZ $" + v.toLocaleString("en-NZ", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
    var up = function () {
      var n = +r.value, total = n * 995, net = total / 2;
      outN.textContent = n + (n === 1 ? " person" : " people");
      outT.textContent = fmt(net);
      outS.textContent = "You save " + fmt(total - net) + " with RBP co-funding";
      r.style.setProperty("--p", ((n - r.min) / (r.max - r.min) * 100) + "%");
    };
    r.addEventListener("input", up); up();
  });

  /* ---------- FAQ ---------- */
  $$(".faq details").forEach(function (d) {
    var body = $(".faq__body", d);
    $("summary", d).addEventListener("click", function (e) {
      if (reduce || !body.animate) return;
      e.preventDefault();
      if (d.open) {
        body.animate([{ height: body.offsetHeight + "px" }, { height: "0px" }], { duration: 450, easing: "cubic-bezier(.16,1,.3,1)" }).onfinish = function () { d.open = false; };
      } else {
        $$(".faq details[open]", d.parentElement).forEach(function (o) { if (o !== d) $("summary", o).click(); });
        d.open = true;
        body.animate([{ height: "0px" }, { height: body.offsetHeight + "px" }], { duration: 550, easing: "cubic-bezier(.16,1,.3,1)" });
      }
    });
  });

  /* ---------- cursor ---------- */
  if (fine && !reduce) {
    var cursorEl = document.createElement("div");
    cursorEl.className = "cursor"; cursorEl.setAttribute("aria-hidden", "true"); cursorEl.innerHTML = '<span class="cursor__label"></span>';
    document.body.appendChild(cursorEl);
    doc.classList.add("has-cursor");
    var cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy, lab2 = $(".cursor__label", cursorEl);
    window.addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() { cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22; cursorEl.style.transform = "translate3d(" + cx + "px," + cy + "px,0)"; requestAnimationFrame(loop); })();
    document.addEventListener("pointerover", function (e) {
      var t = e.target.closest && e.target.closest("[data-cursor], a, button, input, textarea, select, label");
      cursorEl.classList.remove("is-label", "is-link", "is-hidden");
      if (!t) return;
      if (t.matches("input, textarea, select")) { cursorEl.classList.add("is-hidden"); return; }
      if (t.hasAttribute("data-cursor")) { lab2.textContent = t.getAttribute("data-cursor"); cursorEl.classList.add("is-label"); }
      else cursorEl.classList.add("is-link");
    });
    document.addEventListener("pointerleave", function () { cursorEl.classList.add("is-hidden"); });
  }

  /* ---------- counters ---------- */
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        var el = x.target, to = +el.getAttribute("data-count"), t1 = performance.now();
        cio.unobserve(el);
        if (reduce) return;
        (function tk(t) { var k = Math.min(1, (t - t1) / 1600), e = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(to * e).toLocaleString("en-NZ"); if (k < 1) requestAnimationFrame(tk); })(t1);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- clock / year ---------- */
  var clocks = $$("[data-nz-time]");
  var tickClock = function () {
    var s = "";
    try { s = new Intl.DateTimeFormat("en-NZ", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Pacific/Auckland" }).format(new Date()); } catch (e) {}
    clocks.forEach(function (c) { c.textContent = s.replace(/\s/g, " ").toLowerCase(); });
  };
  if (clocks.length) { tickClock(); setInterval(tickClock, 20000); }
  $$("[data-year]").forEach(function (y) { y.textContent = new Date().getFullYear(); });

  /* ---------- insights filter ---------- */
  var filters = $$(".filter");
  filters.forEach(function (f) {
    f.addEventListener("click", function () {
      var c = f.getAttribute("data-filter");
      filters.forEach(function (o) { o.classList.toggle("is-active", o === f); o.setAttribute("aria-pressed", o === f ? "true" : "false"); });
      $$("[data-cat]").forEach(function (p) { p.classList.toggle("is-hidden", !(c === "all" || p.getAttribute("data-cat").split(" ").indexOf(c) > -1)); });
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  });

  /* ---------- copy link ---------- */
  $$("[data-copy-link]").forEach(function (b) {
    b.addEventListener("click", function () { if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () { b.style.color = "var(--rose)"; }); });
  });
})();
