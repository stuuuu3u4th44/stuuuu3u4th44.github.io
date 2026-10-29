/* ===================================================
   LOVECUT — Script
   • Marquee pause on hover
   • Map & Examples modals
   • Flag pixel → real animation (IntersectionObserver)
   • Collage pixel → real with messy circles
   • Hero one-time pixel flash
   • Footer one-time pixel flash
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ---- helpers ---- */
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

    /* ============================================
       MAP MODAL
       ============================================ */
    const mapModal    = $('#mapModal');
    const mapIframe   = $('#mapIframe');
    const openMapBtn  = $('#openMapBtn');
    const mapClose    = $('#mapClose');
    const mapOverlay  = $('#mapOverlay');

    function toggleMap(show) {
        if (!mapModal) return;
        if (show) {
            mapModal.classList.add('active');
            // lazy-load iframe
            if (mapIframe && mapIframe.dataset.src) {
                mapIframe.src = mapIframe.dataset.src;
                delete mapIframe.dataset.src;
            }
        } else {
            mapModal.classList.remove('active');
        }
    }

    if (openMapBtn) openMapBtn.addEventListener('click', e => { e.preventDefault(); toggleMap(true); });
    if (mapClose)   mapClose.addEventListener('click',   () => toggleMap(false));
    if (mapOverlay) mapOverlay.addEventListener('click',  () => toggleMap(false));

    /* ============================================
       EXAMPLES MODAL
       ============================================ */
    const exModal   = $('#examplesModal');
    const exClose   = $('#examplesClose');
    const exOverlay = $('#examplesOverlay');
    const exBtn     = $('#examplesBtn');

    function toggleExamples(show) {
        if (!exModal) return;
        exModal.classList[show ? 'add' : 'remove']('active');
    }

    if (exBtn)     exBtn.addEventListener('click', () => toggleExamples(true));
    if (exClose)   exClose.addEventListener('click', () => toggleExamples(false));
    if (exOverlay) exOverlay.addEventListener('click', () => toggleExamples(false));

    /* ---- booking button feedback ---- */
    const bookBtn = $('#bookingBtn');
    if (bookBtn) {
        bookBtn.addEventListener('click', () => {
            bookBtn.style.transform = 'scale(.94)';
            setTimeout(() => bookBtn.style.transform = '', 180);
        });
    }

    /* ============================================
       FLAG CANVAS — pixel art → real
       ============================================ */
    const flagCanvas = $('#flagCanvas');
    let flagCtx;
    if (flagCanvas) {
        flagCtx = flagCanvas.getContext('2d');
        drawFlag(16);                     // start pixelated (16 px blocks)
    }

    function drawFlag(px) {
        if (!flagCtx) return;
        const W = flagCanvas.width;
        const H = flagCanvas.height;
        flagCtx.clearRect(0, 0, W, H);

        const stripeH = H / 13;

        // stripes
        for (let i = 0; i < 13; i++) {
            flagCtx.fillStyle = i % 2 === 0 ? '#B22234' : '#FFFFFF';
            fillBlock(flagCtx, 0, i * stripeH, W, stripeH, px);
        }

        // canton
        const cW = W * 0.4, cH = 7 * stripeH;
        flagCtx.fillStyle = '#3C3B6E';
        fillBlock(flagCtx, 0, 0, cW, cH, px);

        // stars (simplified)
        flagCtx.fillStyle = '#FFFFFF';
        const rows = 9, sX = cW / 12, sY = cH / 10;
        for (let r = 0; r < rows; r++) {
            const cols = r % 2 === 0 ? 6 : 5;
            const offX = r % 2 === 0 ? 0 : sX * 0.5;
            for (let c = 0; c < cols; c++) {
                const cx = offX + (c + 1) * sX;
                const cy = (r + 1) * sY;
                if (px > 2) {
                    flagCtx.fillRect(
                        Math.floor(cx / px) * px,
                        Math.floor(cy / px) * px,
                        px, px
                    );
                } else {
                    star5(flagCtx, cx, cy, 5);
                }
            }
        }
    }

    function fillBlock(ctx, x0, y0, w, h, px) {
        if (px <= 1) { ctx.fillRect(x0, y0, w, h); return; }
        for (let x = x0; x < x0 + w; x += px)
            for (let y = y0; y < y0 + h; y += px)
                ctx.fillRect(x, y, px, px);
    }

    function star5(ctx, cx, cy, r) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const m = i === 0 ? 'moveTo' : 'lineTo';
            ctx[m](cx + r * Math.cos(a), cy + r * Math.sin(a));
        }
        ctx.closePath();
        ctx.fill();
    }

    /* Smooth pixel animation */
    function animateFlag(fromPx, toPx, dur) {
        const t0 = performance.now();
        (function step(now) {
            const p = Math.min((now - t0) / dur, 1);
            const ease = 1 - (1 - p) ** 3;
            const cur = Math.max(1, Math.round(fromPx + (toPx - fromPx) * ease));
            drawFlag(cur);
            if (p < 1) requestAnimationFrame(step);
        })(t0);
    }

    /* ============================================
       PIXEL TARGETS (collage photos + messy circles)
       ============================================ */
    const pxTargets = $$('.pixelate-target');

    function setPixelTargets(toPixel, dur) {
        pxTargets.forEach((el, i) => {
            setTimeout(() => {
                if (toPixel) {
                    el.classList.add('pixel-active');
                    el.style.transition = `filter ${dur}ms ease`;
                } else {
                    el.classList.remove('pixel-active');
                    el.style.transition = `filter ${dur}ms ease`;
                }
            }, i * 120);
        });
    }

    /* ---- Observe flag section ---- */
    const flagArea = $('#flagArea');
    let flagShown = false;

    if (flagArea) {
        new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (en.isIntersecting && !flagShown) {
                    flagShown = true;
                    animateFlag(16, 1, 2200);
                    setPixelTargets(false, 2200);
                } else if (!en.isIntersecting && flagShown) {
                    flagShown = false;
                    animateFlag(1, 10, 700);      // weaker return
                    setPixelTargets(true, 700);
                }
            });
        }, { threshold: 0.3 }).observe(flagArea);
    }

    /* ============================================
       HERO — one-time pixel flash at page load
       ============================================ */
    const heroImgs = $$('.pixelate-hero img');
    heroImgs.forEach(img => {
        img.style.imageRendering = 'pixelated';
        img.style.filter = 'contrast(1.25) brightness(.88)';
    });
    setTimeout(() => {
        heroImgs.forEach(img => {
            img.style.transition = 'filter 1.4s ease';
            img.style.filter = 'none';
            img.style.imageRendering = 'auto';
        });
    }, 700);

    /* ============================================
       FOOTER — one-time pixel flash when scrolled to
       ============================================ */
    const footer = $('#footer');
    let footerDone = false;
    if (footer) {
        new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (en.isIntersecting && !footerDone) {
                    footerDone = true;
                    const cards = $$('.footer__card', footer);
                    cards.forEach(c => { c.style.filter = 'contrast(1.3) brightness(.85)'; });
                    setTimeout(() => {
                        cards.forEach(c => { c.style.transition = 'filter .8s ease'; c.style.filter = ''; });
                    }, 500);
                }
            });
        }, { threshold: 0.45 }).observe(footer);
    }

    /* ============================================
       SCROLL FADE-IN
       ============================================ */
    const fadeObs = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) en.target.classList.add('visible'); });
    }, { threshold: 0.12 });

    $$('.fade-in').forEach(el => fadeObs.observe(el));

    /* done */
    console.log('Lovecut loaded ✓');
});
