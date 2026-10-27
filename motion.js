// Malesh Labs — motion layer. Progressive: the page reads fine without it.
(() => {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const raf = window.requestAnimationFrame.bind(window);

  const ready = (fn) =>
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn();

  /* ---------- Text scramble for mono labels ---------- */

  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·—+";

  function scramble(el, duration = 700) {
    if (reduce || el.dataset.busy) return;
    const target = el.dataset.text;
    el.dataset.busy = "1";
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      let out = "";
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        const settleAt = (i / target.length) * 0.75 + 0.2;
        if (ch === " " || t >= settleAt) out += ch;
        else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (t < 1) raf(step);
      else { el.textContent = target; delete el.dataset.busy; }
    };
    raf(step);
  }

  function scrambleSetup() {
    document.querySelectorAll("[data-scramble]").forEach((el) => {
      el.dataset.text = el.textContent;
    });
    // Labels above the fold decode on load; the rest when revealed.
    document.querySelectorAll(".site-header [data-scramble], .hero [data-scramble]").forEach((el, i) =>
      setTimeout(() => scramble(el, 800), 150 + i * 120)
    );
    if (finePointer) {
      document.querySelectorAll("[data-scramble]").forEach((el) =>
        (el.closest(".area, .section-label, .plate-head, .site-header") || el)
          .addEventListener("mouseenter", () => scramble(el, 450))
      );
    }
  }

  /* ---------- Rolling letters on the email link ---------- */

  function rollSetup() {
    document.querySelectorAll("[data-roll]").forEach((el) => {
      const text = el.textContent.trim();
      el.textContent = "";
      el.setAttribute("aria-hidden", "true");
      [...text].forEach((ch, i) => {
        const c = document.createElement("span");
        c.className = "c";
        c.dataset.c = ch;
        c.style.setProperty("--i", i);
        const inner = document.createElement("span");
        inner.textContent = ch;
        c.appendChild(inner);
        el.appendChild(c);
      });
    });
  }

  /* ---------- Statement lights up word by word as you scroll ---------- */

  let scrubEls = [];

  function scrubSetup() {
    document.querySelectorAll("[data-scrub]").forEach((el) => {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = "";
      words.forEach((w, i) => {
        const s = document.createElement("span");
        s.className = "sw";
        s.textContent = w;
        el.appendChild(s);
        if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      });
      el.classList.add("scrubbing");
      scrubEls.push({ el, words: [...el.querySelectorAll(".sw")], lit: -1 });
    });
  }

  function scrubUpdate() {
    const vh = window.innerHeight;
    for (const s of scrubEls) {
      const r = s.el.getBoundingClientRect();
      const p = reduce ? 1 : Math.min(1, Math.max(0, (vh * 0.82 - r.top) / (r.height + vh * 0.28)));
      const lit = Math.round(p * s.words.length);
      if (lit === s.lit) continue;
      s.words.forEach((w, i) => w.classList.toggle("on", i < lit));
      s.lit = lit;
    }
  }

  /* ---------- Reveal on scroll ---------- */

  function revealSetup() {
    const els = document.querySelectorAll("[data-reveal]");
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const vh = window.innerHeight;
    els.forEach((el) => {
      if (el.getBoundingClientRect().top > vh * 0.95) el.classList.add("pending");
      else el.classList.add("in");
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          e.target.querySelectorAll("[data-scramble]").forEach((s, i) => setTimeout(() => scramble(s), 120 + i * 140));
          io.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );
    els.forEach((el) => el.classList.contains("pending") && io.observe(el));
  }

  /* ---------- Scroll progress hairline ---------- */

  function progressSetup() {
    const bar = document.querySelector(".progress span");
    let ticking = false;
    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
      scrubUpdate();
    };
    const onScroll = () => { if (!ticking) { ticking = true; raf(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ---------- Magnetic button ---------- */

  function magneticSetup() {
    document.querySelectorAll(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        el.style.transform = `translate(${(x * 7).toFixed(2)}px, ${(y * 5).toFixed(2)}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- Dot-matrix field behind the whole site ---------- */

  function fieldSetup(staticOnly = false) {
    const canvas = document.createElement("canvas");
    if (!canvas.getContext || typeof Path2D === "undefined") return;
    const inkPaths = new Array(101).fill(null), accPaths = new Array(101).fill(null);
    canvas.className = "field";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);
    const ctx = canvas.getContext("2d");
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue("--fg").trim() || "#f2f1ec";
    const accent = css.getPropertyValue("--accent").trim() || "#ff6224";

    let w = 0, h = 0, dpr = 1, gap = 22, quiet = [];
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, s: 0, ts: 0, last: 0 };
    let running = false, frame = 0;
    const t0 = performance.now();

    // Text blocks the lens should not glare over (viewport coordinates, refreshed on scroll).
    const quietEls = [...document.querySelectorAll(".headline, .lede, .actions, .statement, .area, .collab p, .email, .page-list, .site-footer .wrap, .section-label")];
    function measureQuiet() {
      quiet = quietEls.map((el) => el.getBoundingClientRect());
    }
    function inQuiet(x, y) {
      for (const r of quiet) if (x > r.left - 24 && x < r.right + 24 && y > r.top - 24 && y < r.bottom + 24) return true;
      return false;
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      gap = w < 640 ? 18 : 22;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      measureQuiet();
      if (staticOnly || !running) draw(performance.now());
    }

    function draw(now) {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);

      // Nobody pointing (phones, idle): the lens drifts on its own.
      if (now - pointer.last > 2600) {
        pointer.tx = w * (0.55 + 0.33 * Math.sin(t * 0.21));
        pointer.ty = h * (0.5 + 0.32 * Math.sin(t * 0.29 + 1.3));
        pointer.ts = w < 1040 ? 0.45 : 0.8;
      }
      if (pointer.x < -1000) { pointer.x = pointer.tx; pointer.y = pointer.ty; }
      pointer.x += (pointer.tx - pointer.x) * 0.09;
      pointer.y += (pointer.ty - pointer.y) * 0.09;
      // Dim the lens while it sits over copy, so text stays crisp.
      const target = inQuiet(pointer.x, pointer.y) ? pointer.ts * 0.3 : pointer.ts;
      pointer.s += (target - pointer.s) * 0.07;

      const sigma = Math.max(90, Math.min(150, w * 0.09));
      const inv = 1 / (2 * sigma * sigma);
      const px = pointer.x, py = pointer.y, ps = staticOnly ? 0 : pointer.s;

      // The grid scrolls at half speed for a little depth.
      const sy0 = window.scrollY;
      const oy = staticOnly ? gap / 2 : ((-sy0 * 0.5) % gap + gap) % gap;
      const ox = (w % gap) / 2;
      const reach = sigma * 3.2;

      // Dots are grouped by colour and opacity (1% steps) so each group is a
      // single fill: a few dozen draw calls per frame instead of a thousand.
      inkPaths.fill(null); accPaths.fill(null);
      for (let y = oy - gap; y < h + gap; y += gap) {
        for (let x = ox; x < w; x += gap) {
          const dx = x - px, dy = y - py;
          const near = ps > 0.01 && Math.abs(dx) < reach && Math.abs(dy) < reach;
          const f = near ? ps * Math.exp(-(dx * dx + dy * dy) * inv) : 0;
          const wave = staticOnly ? 0 : 0.5 + 0.5 * Math.sin(x * 0.011 + y * 0.007 + sy0 * 0.0035 - t * 1.1);
          let a = 0.075 + wave * 0.045 + f * 0.55;
          let r = 0.9 + wave * 0.35 + f * 2.1;
          let cx = x, cy = y;
          if (f > 0.02) {
            const len = Math.hypot(dx, dy) || 1;
            cx += (dx / len) * f * 5; cy += (dy / len) * f * 5;
          }
          let set = inkPaths;
          if (f > 0.62) { set = accPaths; a = Math.min(1, a + 0.3); r += 0.3; }
          const k = Math.min(100, Math.round(a * 100));
          const path = set[k] || (set[k] = new Path2D());
          path.moveTo(cx + r, cy);
          path.arc(cx, cy, r, 0, 6.2832);
        }
      }
      ctx.fillStyle = ink;
      for (let k = 0; k <= 100; k++) if (inkPaths[k]) { ctx.globalAlpha = k / 100; ctx.fill(inkPaths[k]); }
      ctx.fillStyle = accent;
      for (let k = 0; k <= 100; k++) if (accPaths[k]) { ctx.globalAlpha = k / 100; ctx.fill(accPaths[k]); }
      ctx.globalAlpha = 1;
    }

    function loop(now) {
      if (document.hidden) { running = false; return; }
      // Phones get 30fps to save battery; nobody can tell on a drifting field.
      if (w >= 640 || (frame++ & 1) === 0) draw(now);
      raf(loop);
    }

    function start() {
      if (staticOnly || running) return;
      running = true;
      raf(loop);
    }

    window.addEventListener("resize", () => raf(resize));
    window.addEventListener("scroll", measureQuiet, { passive: true });
    resize();
    canvas.classList.add("on");
    if (staticOnly) return;

    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      pointer.tx = e.clientX;
      pointer.ty = e.clientY;
      pointer.ts = 1;
      pointer.last = performance.now();
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => { pointer.last = 0; });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) start(); });
    start();
  }

  ready(() => {
    document.documentElement.classList.add("motion");
    scrambleSetup();
    rollSetup();
    scrubSetup();
    revealSetup();
    progressSetup();
    if (!reduce && finePointer) magneticSetup();
    // The field is decoration: start it once the page has settled.
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
    const startField = () => idle(() => fieldSetup(reduce), { timeout: 800 });
    if (document.readyState === "complete") startField();
    else window.addEventListener("load", startField, { once: true });
  });
})();
