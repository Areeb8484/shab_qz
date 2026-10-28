/* SHAB — Team quarter-zip showcase */
(() => {
  // When the Kling turn renders are processed, frames/manifest.json appears:
  // { "count": 240, "pattern": "frames/turn/{n}.webp", "pad": 4, "degrees": 360 }
  const MANIFEST = "frames/manifest.json";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  document.body.classList.add("is-loading");

  if (!window.gsap || !window.ScrollTrigger) {
    $("#loader").remove();
    document.body.classList.remove("is-loading");
    $$(".callout").forEach(c => (c.style.opacity = 1));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const target = $(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { duration: 1.6 }) : target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }));

  /* ---------- Cursor ---------- */
  if (fine) {
    const cur = $("#cursor");
    const cx = gsap.quickTo(cur, "x", { duration: 0.35, ease: "power3" });
    const cy = gsap.quickTo(cur, "y", { duration: 0.35, ease: "power3" });
    addEventListener("pointermove", e => { cx(e.clientX); cy(e.clientY); });
    $$("a, .dcard, .view").forEach(el => {
      el.addEventListener("pointerenter", () => cur.classList.add("is-hover"));
      el.addEventListener("pointerleave", () => cur.classList.remove("is-hover"));
    });
  }

  /* ---------- Frame sequence (optional) ---------- */
  const seq = { frames: [], count: 0, degrees: 360, ready: false };

  async function loadSequence(onProgress) {
    let m;
    try {
      const res = await fetch(MANIFEST, { cache: "no-cache" });
      if (!res.ok) return false;
      m = await res.json();
    } catch { return false; }
    seq.count = m.count;
    seq.degrees = m.degrees || 360;
    seq.aspect = m.width && m.height ? `${m.width} / ${m.height}` : null;
    const src = n => m.pattern.replace("{n}", String(n).padStart(m.pad || 4, "0"));
    let done = 0;
    await Promise.all(Array.from({ length: m.count }, (_, i) => new Promise(r => {
      const img = new Image();
      img.decoding = "async";
      img.onload = img.onerror = () => { done++; onProgress(done / m.count); r(); };
      img.src = src(i + 1);
      seq.frames[i] = img;
    })));
    seq.ready = true;
    return true;
  }

  const canvas = $("#seq");
  const ctx = canvas.getContext("2d");
  function sizeCanvas() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
  }
  let lastFrame = -1;
  function drawFrame(i, force) {
    i = clamp(i, 0, seq.count - 1);
    if (i === lastFrame && !force) return;
    // Fall back to the nearest loaded frame so fast scrolling never shows a gap.
    let img = seq.frames[i], k = 0;
    while ((!img || !img.complete || !img.naturalWidth) && k < seq.count) {
      k++; img = seq.frames[i - k] || seq.frames[i + k];
    }
    if (!img || !img.naturalWidth) return;
    lastFrame = i;
    const { width: w, height: h } = canvas;
    const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  /* ---------- Loader ---------- */
  const bar = $("#loaderBar"), pct = $("#loaderPct");
  const shown = { v: 0 };
  function setProgress(v) {
    gsap.to(shown, {
      v, duration: 0.4, ease: "power2.out", overwrite: true,
      onUpdate: () => { bar.style.width = shown.v * 100 + "%"; pct.textContent = String(Math.round(shown.v * 100)).padStart(3, "0"); }
    });
  }
  gsap.to(".loader__word span", { y: 0, duration: 1, stagger: 0.08, ease: "expo.out", delay: 0.15 });

  const stills = ["assets/front.png", "assets/back.png"];
  const stillsLoaded = Promise.all(stills.map(s => new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = s; })));
  let stillP = 0, seqP = 0, hasSeq = false;
  const report = () => setProgress(hasSeq ? stillP * 0.15 + seqP * 0.85 : stillP);

  Promise.all([
    stillsLoaded.then(() => { stillP = 1; report(); }),
    loadSequence(p => { hasSeq = true; seqP = p; report(); }).then(ok => (hasSeq = ok)),
    new Promise(r => setTimeout(r, 1300)),
    document.fonts ? document.fonts.ready : null
  ]).then(() => { setProgress(1); setTimeout(start, 450); });

  /* ---------- Start ---------- */
  function start() {
    if (seq.ready) {
      $("#turnStage").classList.add("is-seq");
      if (seq.aspect) $("#turnStage").style.setProperty("--stage-ar", seq.aspect);
      $("#flip").hidden = true;
      canvas.hidden = false;
      sizeCanvas();
      drawFrame(0, true);
    }

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.classList.remove("is-loading");
        $("#loader").remove();
        lenis && lenis.start();
        ScrollTrigger.refresh();
      }
    });
    tl.to(".loader__word span", { y: "-110%", duration: 0.7, stagger: 0.05, ease: "expo.in" })
      .to("#loader", { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut" }, "-=0.2")
      .from(".hw", { yPercent: 60, opacity: 0, duration: 1.4, stagger: 0.09, ease: "expo.out" }, "-=0.45")
      .from("#heroProduct", { y: 120, scale: 0.86, opacity: 0, duration: 1.6, ease: "expo.out" }, "<0.1")
      .from(".reveal-up, .hero__scroll, .nav", { y: 24, opacity: 0, duration: 1, stagger: 0.08, ease: "power3.out" }, "<0.5");

    initHero();
    initTurn();
    initMeaning();
    initDetails();
    initViews();
    initSections();
  }

  /* ---------- Hero ---------- */
  function initHero() {
    const hero = $("#hero"), prod = $("#heroProduct");
    if (fine && !reduced) {
      const rx = gsap.quickTo(prod, "rotationX", { duration: 1, ease: "power3" });
      const ry = gsap.quickTo(prod, "rotationY", { duration: 1, ease: "power3" });
      gsap.set(prod, { transformPerspective: 1200 });
      hero.addEventListener("pointermove", e => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        rx((0.5 - y) * 10); ry((x - 0.5) * 16);
        hero.style.setProperty("--mx", x * 100 + "%");
        hero.style.setProperty("--my", y * 100 + "%");
      });
    }
    const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
    gsap.to(prod, { yPercent: 18, scale: 0.9, ease: "none", scrollTrigger: st });
    $$(".hw").forEach((l, i) => gsap.to(l, { xPercent: (i - 1.5) * 28, opacity: 0.25, ease: "none", scrollTrigger: st }));
    gsap.to([".hero__left", ".hero__right", ".hero__scroll"], { opacity: 0, y: -30, ease: "none", scrollTrigger: { ...st, end: "40% top" } });
  }

  /* ---------- The Turn ---------- */
  function initTurn() {
    const flip = $("#flip"), front = $(".flip__front"), back = $(".flip__back");
    const stage = $("#turnStage"), word = $("#turnWord"), deg = $("#turnDeg"), tbar = $("#turnBar");
    back.style.transform = "none";

    const callouts = $$(".callout").map(el => {
      let dot = null;
      if (!seq.ready) {
        dot = document.createElement("span");
        dot.className = "hotspot";
        dot.style.left = el.style.getPropertyValue("--x");
        dot.style.top = el.style.getPropertyValue("--y");
        stage.appendChild(dot);
      }
      return { el, dot, from: +el.dataset.from, to: +el.dataset.to, on: false, dx: el.dataset.side === "left" ? -40 : 40 };
    });

    let curWord = "FRONT";
    function setWord(w) {
      if (w === curWord) return;
      curWord = w;
      gsap.to(word, { opacity: 0, duration: 0.25, onComplete: () => { word.textContent = w; gsap.to(word, { opacity: 1, duration: 0.4 }); } });
    }

    // [scroll progress, degrees]: hold on the front, spin to the back, hold, spin home.
    const SPIN = [[0, 0], [0.19, 0], [0.42, 180], [0.69, 180], [0.93, 360], [1, 360]];
    function spinAngle(p) {
      for (let i = 0; i < SPIN.length - 1; i++) {
        const [p0, a0] = SPIN[i], [p1, a1] = SPIN[i + 1];
        if (p <= p1) return a0 + (a1 - a0) * smooth(p0, p1, p);
      }
      return 360;
    }

    function update(p) {
      let angle = spinAngle(p);
      if (seq.ready) {
        drawFrame(Math.round((angle / seq.degrees) * seq.count) % seq.count);
      } else {
        // Two-image fallback: fold the 360° path into front → back → front.
        const t = (angle <= 180 ? angle : 360 - angle) / 180;
        const sway = Math.sin(p * Math.PI * 4) * 7 * (1 - Math.sin(t * Math.PI));
        const showBack = t > 0.5;
        const squeeze = Math.max(Math.abs(Math.cos(t * Math.PI)), 0.14);
        front.style.opacity = showBack ? 0 : 1;
        back.style.opacity = showBack ? 1 : 0;
        const lift = Math.sin(t * Math.PI);
        flip.style.transform = `translateY(${-lift * 4}%) rotateY(${sway}deg) scaleX(${squeeze}) scale(${1 + lift * 0.04})`;
        flip.style.filter = `brightness(${1 - lift * 0.35})`;
      }
      const a = ((angle % 360) + 360) % 360;
      setWord(a < 45 || a >= 315 ? "FRONT" : a < 135 ? "SIDE" : a < 225 ? "BACK" : "SIDE");
      deg.textContent = String(Math.round(angle)).padStart(3, "0") + "°";
      tbar.style.width = p * 100 + "%";

      callouts.forEach(c => {
        const on = p >= c.from && p < c.to;
        if (on === c.on) return;
        c.on = on;
        gsap.to(c.el, on
          ? { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.7, ease: "expo.out", overwrite: true }
          : { opacity: 0, x: c.dx, filter: "blur(6px)", duration: 0.4, ease: "power2.in", overwrite: true });
        if (c.dot) gsap.to(c.dot, { opacity: on ? 1 : 0, scale: on ? 1 : 0, duration: on ? 0.5 : 0.25, ease: on ? "back.out(3)" : "power2.in" });
      });
    }

    callouts.forEach(c => gsap.set(c.el, { x: c.dx, filter: "blur(6px)" }));
    ScrollTrigger.create({
      trigger: "#turn", start: "top top", end: "bottom bottom", scrub: true,
      onUpdate: self => update(self.progress)
    });
    update(0);
    gsap.from(stage, { scale: 0.8, opacity: 0, ease: "none", scrollTrigger: { trigger: "#turn", start: "top bottom", end: "top top", scrub: true } });

    if (seq.ready) addEventListener("resize", () => { sizeCanvas(); drawFrame(Math.max(lastFrame, 0), true); });
  }

  /* ---------- Meaning ---------- */
  function initMeaning() {
    const tl = gsap.timeline({ scrollTrigger: { trigger: "#meaning", start: "top 70%", end: "center 45%", scrub: true } });
    tl.to(".aw", { opacity: 1, stagger: 0.5, ease: "none" })
      .from("#meaningEn", { y: 30, opacity: 0, ease: "none" }, "-=0.5");
    gsap.from(".meaning__cols p", { y: 40, opacity: 0, stagger: 0.12, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".meaning__cols", start: "top 85%" } });
  }

  /* ---------- Details (horizontal) ---------- */
  function initDetails() {
    const track = $("#detailsTrack");
    gsap.to(track, {
      x: () => -(track.scrollWidth - innerWidth),
      ease: "none",
      scrollTrigger: { trigger: "#details", start: "top top", end: "bottom bottom", scrub: true, invalidateOnRefresh: true }
    });
    addEventListener("load", () => ScrollTrigger.refresh());
    gsap.from(".dcard", { y: 80, opacity: 0, stagger: 0.08, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: "#details", start: "top 60%" } });
  }

  /* ---------- Views tilt ---------- */
  function initViews() {
    if (fine && !reduced) {
      $$(".tilt").forEach(card => {
        card.addEventListener("pointermove", e => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 10}deg)`;
        });
        card.addEventListener("pointerleave", () => (card.style.transform = ""));
      });
    }
    gsap.from(".view", { y: 100, opacity: 0, stagger: 0.15, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".views__grid", start: "top 85%" } });
  }

  /* ---------- Section headings, specs, footer ---------- */
  function initSections() {
    const nav = $(".nav");
    ScrollTrigger.create({
      trigger: "#meaning", start: () => `top ${nav.offsetHeight / 2}px`, end: () => `bottom ${nav.offsetHeight / 2}px`,
      toggleClass: { targets: nav, className: "on-light" }
    });
    $$(".views__head, .specs__head, .details__head").forEach(h =>
      gsap.from(h.children, { y: 50, opacity: 0, stagger: 0.1, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: h, start: "top 85%" } }));
    gsap.from(".specs__list div", { y: 30, opacity: 0, stagger: 0.06, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: ".specs__list", start: "top 85%" } });
    gsap.from(".footer__word", { yPercent: 40, opacity: 0, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });
  }
})();
