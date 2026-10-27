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

  /* ---------- Dot-matrix field behind the hero ---------- */

  function fieldSetup(staticOnly = false) {
    const canvas = document.querySelector(".field");
    if (!canvas || !canvas.getContext) return;
    const hero = canvas.parentElement;
    const ctx = canvas.getContext("2d");
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue("--fg").trim() || "#171717";
    const accent = css.getPropertyValue("--accent").trim() || "#ea5a1c";

    let w = 0, h = 0, dpr = 1, gap = 22, dots = [];
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, s: 0, ts: 0, last: 0 };
    let visible = true, running = false, t0 = performance.now();

    function resize() {
      const r = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      gap = w < 640 ? 18 : 22;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      const ox = (w % gap) / 2 + gap / 2, oy = (h % gap) / 2 + gap / 2;
      for (let y = oy; y < h; y += gap) for (let x = ox; x < w; x += gap) dots.push(x, y);
      if (staticOnly || !running) draw(performance.now());
    }

    function draw(now) {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);

      // When nobody is pointing (phones, idle), a lens drifts on its own.
      const idle = now - pointer.last > 2600;
      if (idle) {
        pointer.tx = w * (0.62 + 0.26 * Math.sin(t * 0.23));
        pointer.ty = h * (0.5 + 0.3 * Math.sin(t * 0.31 + 1.3));
        pointer.ts = 0.75;
      }
      if (pointer.x < -1000) { pointer.x = pointer.tx; pointer.y = pointer.ty; }
      pointer.x += (pointer.tx - pointer.x) * 0.09;
      pointer.y += (pointer.ty - pointer.y) * 0.09;
      pointer.s += (pointer.ts - pointer.s) * 0.06;

      const sigma = Math.max(90, Math.min(150, w * 0.09));
      const inv = 1 / (2 * sigma * sigma);
      const px = pointer.x, py = pointer.y;
      // Keep the lens off the copy: full strength on the right of wide layouts, gentle on phones.
      const wide = w >= 1040;
      const ps = staticOnly ? 0 : pointer.s * (wide ? 1 : 0.5);
      const x0 = w * 0.42, x1 = w * 0.66;

      ctx.fillStyle = ink;
      for (let i = 0; i < dots.length; i += 2) {
        const x = dots[i], y = dots[i + 1];
        const dx = x - px, dy = y - py;
        let k = 1;
        if (wide) { const u = Math.min(1, Math.max(0, (x - x0) / (x1 - x0))); k = 0.22 + 0.78 * u * u * (3 - 2 * u); }
        const f = ps * k * Math.exp(-(dx * dx + dy * dy) * inv);
        const wave = staticOnly ? 0 : 0.5 + 0.5 * Math.sin(x * 0.011 + y * 0.007 - t * 1.1);
        const a = 0.085 + wave * 0.05 + f * 0.55;
        let r = 0.9 + wave * 0.35 + f * 2.1;
        // Dots lean away from the lens, like iron filings.
        const push = f * 5;
        const len = Math.hypot(dx, dy) || 1;
        const sx = x + (dx / len) * push, sy = y + (dy / len) * push;
        if (f > 0.62) { ctx.fillStyle = accent; ctx.globalAlpha = Math.min(1, a + 0.1); r += 0.3; }
        else { ctx.fillStyle = ink; ctx.globalAlpha = a; }
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    let frame = 0;
    function loop(now) {
      if (!visible || document.hidden) { running = false; return; }
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
    resize();
    if (staticOnly) return;

    hero.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const r = hero.getBoundingClientRect();
      pointer.tx = e.clientX - r.left;
      pointer.ty = e.clientY - r.top;
      pointer.ts = 1;
      pointer.last = performance.now();
    });
    hero.addEventListener("pointerleave", () => { pointer.last = 0; });

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(hero);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) start(); });
    canvas.classList.add("on");
    start();
  }

  ready(() => {
    document.documentElement.classList.add("motion");
    scrambleSetup();
    rollSetup();
    scrubSetup();
    revealSetup();
    progressSetup();
    if (!reduce) {
      fieldSetup();
      if (finePointer) magneticSetup();
    } else {
      fieldSetup(true);
    }
  });
})();
