/* Polish — motion layer (GSAP + ScrollTrigger). Without GSAP or with reduced motion, everything is simply visible. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  if (reduce || !window.gsap || !window.ScrollTrigger) {
    doc.classList.remove("has-motion");
    doc.classList.add("no-motion");
    return;
  }
  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  var EASE = "expo.out";
  var onReady = (window.POLISH && window.POLISH.onReady) || function (f) { f(); };

  /* ---------- split words ---------- */
  function splitWords(el) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(" ")); return; }
            var o = document.createElement("span"); o.className = "split-w";
            var i = document.createElement("span"); i.textContent = w; o.appendChild(i); frag.appendChild(o);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR" && !n.classList.contains("inline-img")) walk(n);
      });
    };
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    walk(el);
    return $$(".split-w > span", el);
  }

  /* home hero title (lines) */
  var heroT = $(".hero__title");
  if (heroT) {
    var lines = $$(".line > span", heroT);
    gsap.set(lines, { yPercent: 110 });
    gsap.set([".hero__eyebrow", ".hero__foot", ".hero-card", ".hero__dots"], { autoAlpha: 0, y: 24 });
    onReady(function () {
      var tl = gsap.timeline({ delay: 0.1 });
      tl.to(".hero__media video, .hero__media img", { scale: 1, duration: 2.4, ease: "power3.out" }, 0)
        .to(".hero__eyebrow", { autoAlpha: 1, y: 0, duration: 1, ease: EASE }, 0.1)
        .to(lines, { yPercent: 0, duration: 1.4, ease: EASE, stagger: 0.12, onComplete: function () { heroT.classList.add("is-in"); } }, 0.15)
        .to([".hero__foot", ".hero-card", ".hero__dots"], { autoAlpha: 1, y: 0, duration: 1.2, ease: EASE, stagger: 0.1 }, 0.55);
    });
    gsap.to(".hero__media", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__content", { yPercent: -10, autoAlpha: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true } });
  }

  /* inner hero */
  var ph = $(".phero");
  if (ph) {
    var pt = $(".phero__title", ph), pw = pt ? splitWords(pt) : [];
    gsap.set(pw, { yPercent: 110 });
    gsap.set([".phero__crumbs", ".phero__foot"], { autoAlpha: 0, y: 24 });
    onReady(function () {
      var tl = gsap.timeline({ delay: 0.1 });
      tl.fromTo(".phero__media", { scale: 1.12 }, { scale: 1, duration: 2.2, ease: "power3.out" }, 0)
        .to(".phero__crumbs", { autoAlpha: 1, y: 0, duration: 1, ease: EASE }, 0.1)
        .to(pw, { yPercent: 0, duration: 1.3, ease: EASE, stagger: 0.06, onComplete: function () { pt.classList.add("is-split-done"); } }, 0.15)
        .to(".phero__foot", { autoAlpha: 1, y: 0, duration: 1.2, ease: EASE }, 0.5);
    });
    gsap.to(".phero__media", { yPercent: 10, ease: "none", scrollTrigger: { trigger: ph, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".phero__content", { yPercent: -10, autoAlpha: 0.2, ease: "none", scrollTrigger: { trigger: ph, start: "35% top", end: "bottom top", scrub: true } });
  }

  /* section headings */
  $$("[data-split]").forEach(function (el) {
    var w = splitWords(el);
    gsap.set(w, { yPercent: 110 });
    ST.create({ trigger: el, start: "top 88%", once: true, onEnter: function () {
      gsap.to(w, { yPercent: 0, duration: 1.2, ease: EASE, stagger: 0.05, onComplete: function () { el.classList.add("is-split-done"); } });
    } });
  });

  /* reveals */
  var reveals = $$("[data-reveal]");
  gsap.set(reveals, { autoAlpha: 0, y: 28 });
  ST.batch(reveals, { start: "top 92%", once: true, onEnter: function (els) { gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.08, overwrite: true }); } });

  /* images settle from a zoom */
  $$("[data-zoom] img, .tile__img img, .stack-card__media img, .qcard__img img, .chapter__img img").forEach(function (img) {
    gsap.fromTo(img, { scale: 1.16 }, { scale: 1, duration: 1.8, ease: EASE, scrollTrigger: { trigger: img, start: "top 90%", once: true } });
  });

  /* clip reveal */
  $$("[data-clip]").forEach(function (el) {
    ST.create({ trigger: el, start: "top 85%", once: true, onEnter: function () {
      gsap.to(el, { clipPath: "inset(0% 0% 0% 0% round " + getComputedStyle(el).borderRadius + ")", duration: 1.5, ease: "expo.inOut", clearProps: "clipPath" });
    } });
  });

  /* parallax */
  $$("[data-parallax], .tile__img, .feature__media").forEach(function (el) {
    gsap.fromTo(el, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* statement lights up word by word */
  $$(".statement").forEach(function (el) {
    var words = [];
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            var s = document.createElement("span"); s.className = "w"; s.textContent = w; frag.appendChild(s); words.push(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains("inline-img")) walk(n);
        else if (n.nodeType === 1) { n.classList.add("w"); words.push(n); }
      });
    };
    walk(el);
    ST.create({ trigger: el, start: "top 80%", end: "bottom 45%", scrub: true, onUpdate: function (s) {
      var on = Math.round(s.progress * words.length);
      words.forEach(function (w, i) { w.classList.toggle("is-lit", i < on); });
    } });
  });

  /* sound familiar: lines light one by one */
  $$(".familiar__item").forEach(function (it) {
    ST.create({ trigger: it, start: "top 72%", end: "bottom 30%", onToggle: function (s) { if (s.isActive) it.classList.add("is-lit"); }, onLeaveBack: function () { it.classList.remove("is-lit"); } });
  });

  /* pillars: pinned sideways scroll on desktop */
  var pin = $(".pillars__pin"), track = $(".pillars__track");
  if (pin && track) {
    var mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", function () {
      var dist = function () { return Math.max(0, track.scrollWidth - pin.clientWidth + 48); };
      var counter = $("[data-pillar-cur]");
      var cards = $$(".pcard", track);
      gsap.to(track, {
        x: function () { return -dist(); }, ease: "none",
        scrollTrigger: { trigger: pin, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: function (s) {
            pin.style.setProperty("--pp", s.progress.toFixed(3));
            if (counter) counter.textContent = String(Math.min(cards.length, Math.floor(s.progress * (cards.length - 1)) + 1)).padStart(2, "0");
          } }
      });
      cards.forEach(function (c) { gsap.fromTo(c.querySelector(".pcard__big"), { yPercent: 30 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: pin, start: "top top", end: function () { return "+=" + dist(); }, scrub: true } }); });
    });
    mm.add("(max-width: 899px)", function () {
      var counter = $("[data-pillar-cur]"), cards = $$(".pcard", track);
      var upd = function () {
        var p = track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth);
        pin.style.setProperty("--pp", p.toFixed(3));
        if (counter) counter.textContent = String(Math.min(cards.length, Math.round(p * (cards.length - 1)) + 1)).padStart(2, "0");
      };
      track.addEventListener("scroll", upd, { passive: true });
      return function () { track.removeEventListener("scroll", upd); };
    });
  }

  /* word marquee reacts to scroll speed and direction */
  $$(".words__track").forEach(function (tr) {
    var x = 0, dir = -1, speed = 0.6, w = 0, visible = false;
    var measure = function () { w = tr.scrollWidth / 2; };
    measure(); window.addEventListener("resize", measure);
    ST.create({ trigger: tr, start: "top bottom", end: "bottom top", onToggle: function (s) { visible = s.isActive; },
      onUpdate: function (s) { var v = s.getVelocity(); dir = v < 0 ? 1 : -1; speed = Math.min(8, 0.6 + Math.abs(v) / 400); } });
    gsap.ticker.add(function () {
      if (!visible) return;
      x += dir * speed; speed += (0.6 - speed) * 0.05;
      if (x <= -w) x += w; if (x > 0) x -= w;
      gsap.set(tr, { x: x });
    });
  });

  /* stacking cards shrink as the next one covers them */
  gsap.matchMedia().add("(min-width: 900px)", function () {
    var cards = $$(".stack-card");
    cards.forEach(function (card, i) {
      card.style.setProperty("--i", i);
      if (!cards[i + 1]) return;
      gsap.to(card, { scale: 0.92 + i * 0.02, "--dim": 0.35, ease: "none", scrollTrigger: { trigger: cards[i + 1], start: "top 85%", end: "top 120px", scrub: true } });
    });
  });

  /* footer wordmark rises */
  var fm = $$(".footer-mark > *");
  if (fm.length) {
    gsap.set(fm, { yPercent: 60, autoAlpha: 0 });
    ST.create({ trigger: ".footer-mark", start: "top 95%", once: true, onEnter: function () { gsap.to(fm, { yPercent: 0, autoAlpha: 1, duration: 1.5, ease: EASE, stagger: 0.1 }); } });
  }

  /* gradient wordmark drifts */
  gsap.to(".footer-mark span, .footer-mark em", { backgroundPosition: "+=60% 0", duration: 8, ease: "sine.inOut", yoyo: true, repeat: -1 });

  /* recalc once fonts and images settle */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  window.addEventListener("load", function () { ST.refresh(); });
})();
