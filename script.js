/* ====================================================================
   LOVECUT — Script
   
   Features:
   1. Services marquee (CSS handles pause-on-hover)
   2. Map & Examples modals
   3. FLAG + nearby photos: pixel-art 1:1 → full resolution anim
      - 3 messy circles appear alongside
      - Re-triggers weaker when scrolling away & back
   4. Hero: one-time weak pixel flash on page load
   5. Footer: one-time weak pixel flash when scrolled into view
   6. Scroll reveal (fade-in)
   ==================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ===========================
     MODALS (map, examples)
     =========================== */
  function openModal(id) {
    const m = $('#' + id);
    if (!m) return;
    m.classList.add('open');
    // lazy-load map iframe
    const iframe = $('iframe[data-src]', m);
    if (iframe) { iframe.src = iframe.dataset.src; delete iframe.dataset.src; }
  }
  function closeModal(id) {
    const m = $('#' + id);
    if (m) m.classList.remove('open');
  }

  // Map
  const openMap = $('#openMapBtn');
  if (openMap) openMap.addEventListener('click', e => { e.preventDefault(); openModal('mapModal'); });

  // Examples
  const openEx = $('#examplesBtn');
  if (openEx) openEx.addEventListener('click', () => openModal('examplesModal'));

  // Close buttons & overlays
  document.addEventListener('click', e => {
    if (e.target.hasAttribute('data-close')) {
      const modal = e.target.closest('.modal');
      if (modal) modal.classList.remove('open');
    }
  });

  // Booking button — decorative feedback only
  const bookBtn = $('.btn-booking');
  if (bookBtn) bookBtn.addEventListener('click', () => {
    bookBtn.style.transform = 'scale(.93)';
    setTimeout(() => bookBtn.style.transform = '', 180);
  });

  /* ===========================
     FLAG CANVAS
     =========================== */
  const canvas = $('#flagCanvas');
  let ctx;
  if (canvas) {
    ctx = canvas.getContext('2d');
    drawFlag(20); // start heavily pixelated
  }

  function drawFlag(px) {
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const sh = H / 13;

    // Stripes
    for (let i = 0; i < 13; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#B22234' : '#FFFFFF';
      blockFill(ctx, 0, i * sh, W, sh, px);
    }
    // Canton
    const cW = W * 0.4, cH = 7 * sh;
    ctx.fillStyle = '#3C3B6E';
    blockFill(ctx, 0, 0, cW, cH, px);
    // Stars
    ctx.fillStyle = '#FFFFFF';
    const sX = cW / 12, sY = cH / 10;
    for (let r = 0; r < 9; r++) {
      const cols = r % 2 === 0 ? 6 : 5;
      const off = r % 2 === 0 ? 0 : sX * .5;
      for (let c = 0; c < cols; c++) {
        const cx = off + (c + 1) * sX, cy = (r + 1) * sY;
        if (px > 3) {
          ctx.fillRect(Math.floor(cx / px) * px, Math.floor(cy / px) * px, px, px);
        } else {
          star(ctx, cx, cy, Math.max(3, 6 - px));
        }
      }
    }
  }

  function blockFill(ctx, x0, y0, w, h, px) {
    if (px <= 1) { ctx.fillRect(x0, y0, w, h); return; }
    for (let x = x0; x < x0 + w; x += px)
      for (let y = y0; y < y0 + h; y += px)
        ctx.fillRect(x, y, px, px);
  }

  function star(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      ctx[i ? 'lineTo' : 'moveTo'](cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    ctx.closePath(); ctx.fill();
  }

  /* Smooth pixel animation (from → to pixel size) */
  function animateFlag(from, to, duration, cb) {
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
      const cur = Math.max(1, Math.round(from + (to - from) * ease));
      drawFlag(cur);
      if (p < 1) requestAnimationFrame(step);
      else if (cb) cb();
    })(t0);
  }

  /* ===========================
     PIXEL TARGETS (photos + messy circles near flag)
     =========================== */
  const pxTargets = $$('.px-target');
  const roughCircles = $$('.rough-circle');

  function setPixelState(on, dur) {
    pxTargets.forEach((el, i) => {
      setTimeout(() => {
        if (on) {
          el.classList.add('pixelated');
        } else {
          el.classList.remove('pixelated');
        }
      }, i * 100);
    });
    // Rough circles appear/disappear together
    roughCircles.forEach((c, i) => {
      setTimeout(() => {
        if (on) c.classList.remove('show');
        else c.classList.add('show');
      }, 300 + i * 200);
    });
  }

  /* ===========================
     INTERSECTION OBSERVER — flag area
     Middle section: pixel→real (strong) on enter,
     real→pixel (weaker) on leave, repeats weaker each time
     =========================== */
  const flagWrap = $('#flagWrap');
  let flagSeenCount = 0; // Track how many times we've triggered

  if (flagWrap) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          flagSeenCount++;
          // Each subsequent trigger is weaker (shorter anim, less extreme start)
          const strength = Math.max(0.3, 1 - (flagSeenCount - 1) * 0.25);
          const startPx = Math.round(20 * strength);
          const dur = Math.round(2200 * strength);
          animateFlag(startPx, 1, dur);
          setPixelState(false, dur);
        } else if (flagSeenCount > 0) {
          // Going away — weaker return to pixel
          const strength = Math.max(0.2, 1 - flagSeenCount * 0.3);
          const endPx = Math.round(14 * strength);
          animateFlag(1, endPx, Math.round(800 * strength));
          setPixelState(true, 600);
        }
      });
    }, { threshold: 0.35 });
    obs.observe(flagWrap);
  }

  /* ===========================
     HERO — one-time weak pixel flash at page load
     =========================== */
  const heroImgs = $$('.hero__photo-shape img');
  // Start pixelated
  heroImgs.forEach(img => {
    img.style.imageRendering = 'pixelated';
    img.style.filter = 'contrast(1.2) brightness(.86)';
  });
  // Fade to real after short delay
  setTimeout(() => {
    heroImgs.forEach(img => {
      img.style.transition = 'filter 1.3s ease';
      img.style.filter = 'none';
      // We can't really transition image-rendering, so switch after filter done
      setTimeout(() => { img.style.imageRendering = 'auto'; }, 1300);
    });
  }, 600);

  /* ===========================
     FOOTER — one-time weak pixel flash
     =========================== */
  const footer = $('#footer');
  let footerDone = false;

  if (footer) {
    new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting && !footerDone) {
          footerDone = true;
          const cards = $$('.footer__card', footer);
          cards.forEach(c => {
            c.style.filter = 'contrast(1.2) brightness(.84)';
          });
          setTimeout(() => {
            cards.forEach(c => {
              c.style.transition = 'filter .9s ease';
              c.style.filter = '';
            });
          }, 450);
        }
      });
    }, { threshold: 0.4 }).observe(footer);
  }

  /* ===========================
     SCROLL REVEAL (fade-in)
     =========================== */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) en.target.classList.add('visible');
    });
  }, { threshold: 0.1 });

  $$('.reveal').forEach(el => revealObs.observe(el));

  /* ===========================
     DONE
     =========================== */
  console.log('Lovecut loaded ✓');
});
