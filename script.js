/* ====================================================================
   LOVECUT — Interactive & Multi-Scale Heterogeneous Pixelation Engine
   
   Features:
   1. Dynamic Canvas Multi-Scale Pixelation:
      - Variable block sizes (large 40-54px chunks, medium 16-24px, fine 4-8px)
      - Asynchronous non-uniform resolution across image zones
      - Matches user's reference images (flag, guy, plaid, smile)
   2. Middle section repeat with diminishing strength on return scrolls
   3. Weak one-time intro pixelation on Hero
   4. Weak one-time pixelation on Footer when scrolled into view
   5. Edge-to-edge marquee pause on hover / touch
   6. Modals for Map & Examples (plus non-functional "кнопке" and booking button)
   ==================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ====================================================================
       1. HYPER-OPTIMIZED MULTI-SCALE PHOTO PIXELATION & DISSOLUTION ENGINE
       - Zero allocations in animation loop (uses pre-allocated scratch canvas)
       - Authentic 3-band retro pixelation (matching Photo 2 reference)
       - Hardware-accelerated CSS opacity dissolve (0% CPU once settled)
       ==================================================================== */
    class PixelLayer {
        constructor(container) {
            this.container = container;
            this.canvas = container.querySelector('.pixel-fx-canvas');
            this.ctx = this.canvas ? this.canvas.getContext('2d', { alpha: true }) : null;
            this.src = container.dataset.src;
            this.img = new Image();
            this.isLoaded = false;
            this.animating = false;
            this.dissolveTimeout = null;
            this.cleanupTimeout = null;

            // Pre-allocated reusable offscreen scratch canvas — ZERO allocations in loop!
            this.scratch = document.createElement('canvas');
            this.scratchCtx = this.scratch.getContext('2d', { alpha: false });
            this.init();
        }

        init() {
            if (!this.canvas || !this.ctx || !this.src) return;
            this.img.onload = () => {
                this.isLoaded = true;
                this.animating = true;
                this.resizeCanvas();
                // Draw initial banded pixelated state
                this.renderBands(1.0);
                this.canvas.style.opacity = '1';

                // Initial timed dissolve
                setTimeout(() => {
                    this.animateToSharp(1400, 1.0);
                }, 300);
            };
            this.img.src = this.src;

            window.addEventListener('resize', () => {
                if (this.isLoaded && this.animating) {
                    this.resizeCanvas();
                    this.renderBands(0.5);
                }
            }, { passive: true });
        }

        resizeCanvas() {
            const rect = this.container.getBoundingClientRect();
            // Cap DPR at 1.5 to prevent massive 4K canvas rendering overhead
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            this.width = Math.max(Math.floor(rect.width * dpr), 40);
            this.height = Math.max(Math.floor(rect.height * dpr), 40);
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        }

        getCoverCrop(w, h) {
            const imgW = this.img.naturalWidth || this.img.width || 1;
            const imgH = this.img.naturalHeight || this.img.height || 1;
            const imgRatio = imgW / imgH;
            const targetRatio = w / h;
            let sx, sy, sw, sh;
            if (imgRatio > targetRatio) {
                sh = imgH;
                sw = imgH * targetRatio;
                sx = (imgW - sw) / 2;
                sy = 0;
            } else {
                sw = imgW;
                sh = imgW / targetRatio;
                sx = 0;
                sy = (imgH - sh) / 2;
            }
            return { sx: Math.round(sx), sy: Math.round(sy), sw: Math.round(sw), sh: Math.round(sh) };
        }

        // Fast 3-band retro pixelation: ONLY 6 drawImage calls total per photo!
        renderBands(pixelScale) {
            if (!this.isLoaded || !this.ctx) return;
            const ctx = this.ctx;
            const w = this.width;
            const h = this.height;
            const crop = this.getCoverCrop(w, h);

            ctx.clearRect(0, 0, w, h);
            ctx.imageSmoothingEnabled = false;

            // 3 Bands matching Photo 2 reference: Left chunky (28px), Center medium (14px), Right fine (6px)
            const basePx = Math.round(28 * pixelScale);
            const bands = [
                { x0: 0, x1: Math.round(w * 0.38), pSize: Math.max(1, basePx) },
                { x0: Math.round(w * 0.38), x1: Math.round(w * 0.72), pSize: Math.max(1, Math.round(basePx * 0.5)) },
                { x0: Math.round(w * 0.72), x1: w, pSize: Math.max(1, Math.round(basePx * 0.22)) }
            ];

            for (let i = 0; i < bands.length; i++) {
                const b = bands[i];
                const bandW = b.x1 - b.x0;
                if (bandW <= 0) continue;

                const sx0 = crop.sx + Math.round((b.x0 / w) * crop.sw);
                const sw = Math.round((bandW / w) * crop.sw);

                if (b.pSize <= 1) {
                    ctx.drawImage(this.img, sx0, crop.sy, sw, crop.sh, b.x0, 0, bandW, h);
                } else {
                    const sampleW = Math.max(1, Math.round(bandW / b.pSize));
                    const sampleH = Math.max(1, Math.round(h / b.pSize));

                    this.scratch.width = sampleW;
                    this.scratch.height = sampleH;
                    this.scratchCtx.imageSmoothingEnabled = false;
                    this.scratchCtx.drawImage(this.img, sx0, crop.sy, sw, crop.sh, 0, 0, sampleW, sampleH);

                    ctx.drawImage(this.scratch, 0, 0, sampleW, sampleH, b.x0, 0, bandW, h);
                }
            }
        }

        animateToSharp(duration = 1400, strength = 1.0) {
            if (!this.isLoaded || !this.ctx) return;
            if (this.dissolveTimeout) clearTimeout(this.dissolveTimeout);
            if (this.cleanupTimeout) clearTimeout(this.cleanupTimeout);

            this.animating = true;
            this.canvas.style.transition = 'none';
            this.canvas.style.opacity = '1';

            // 1. Draw initial retro pixelation
            this.renderBands(strength);

            // 2. Step down resolution after brief hold
            this.dissolveTimeout = setTimeout(() => {
                if (!this.animating) return;
                this.renderBands(strength * 0.5); // finer blocks

                // 3. Hardware-accelerated CSS opacity dissolve (handled on GPU compositor thread)
                this.canvas.style.transition = 'opacity 0.75s cubic-bezier(0.2, 0.8, 0.3, 1)';
                this.canvas.style.opacity = '0';

                // 4. Cleanup canvas after dissolve (0% CPU)
                this.cleanupTimeout = setTimeout(() => {
                    this.animating = false;
                    if (this.ctx) {
                        this.ctx.clearRect(0, 0, this.width, this.height);
                    }
                }, 800);
            }, 300);
        }
    }

    // Initialize all collage photo pixel layers
    const photoContainers = document.querySelectorAll('.cl-photo');
    const pixelLayers = [];
    photoContainers.forEach(container => {
        pixelLayers.push(new PixelLayer(container));
    });

    /* ====================================================================
       2. BATCHED HYPER-FAST STAGE PIXEL ENGINE (NEAR 3 CIRCLES)
       - Pre-computed batches grouped by color: ONLY 5-6 draw calls total!
       - Varied colors, sizes, and contours around Circle 1, Circle 2, Circle 3
       - Timed display ("на время") with smooth GPU-accelerated dissolution
       ==================================================================== */
    class StagePixelEngine {
        constructor(stageEl, canvasEl) {
            this.stage = stageEl;
            this.canvas = canvasEl;
            this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
            this.animating = false;
            this.batches = new Map();
            this.dissolveTimeout = null;
            this.cleanupTimeout = null;
            this.init();
        }

        init() {
            if (!this.canvas || !this.ctx || !this.stage) return;
            this.animating = true;
            this.resize();
            this.generateClusters();
            this.renderBatched();
            this.canvas.style.transition = 'none';
            this.canvas.style.opacity = '0.95';

            // Initial timed dissolve after 1.2s
            this.dissolveTimeout = setTimeout(() => {
                this.canvas.style.transition = 'opacity 1.4s ease-out';
                this.canvas.style.opacity = '0';
                this.cleanupTimeout = setTimeout(() => {
                    this.animating = false;
                    if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
                }, 1450);
            }, 1200);

            window.addEventListener('resize', () => {
                this.resize();
                this.generateClusters();
                if (this.animating) {
                    this.renderBatched();
                }
            }, { passive: true });
        }

        resize() {
            if (!this.stage || !this.canvas) return;
            const rect = this.stage.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            this.width = Math.max(Math.floor(rect.width * dpr), 300);
            this.height = Math.max(Math.floor(rect.height * dpr), 300);
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.scaleX = this.width / Math.max(1, rect.width);
            this.scaleY = this.height / Math.max(1, rect.height);
        }

        generateClusters() {
            if (!this.stage) return;
            const stageRect = this.stage.getBoundingClientRect();
            const batches = new Map();

            const addBlock = (x, y, size, color) => {
                if (!batches.has(color)) batches.set(color, []);
                batches.get(color).push({ x, y, size });
            };

            const pseudoRnd = (seed) => {
                const x = Math.sin(seed * 9999.123) * 10000;
                return x - Math.floor(x);
            };

            const palCircle1 = {
                navy: ['#1e295f', '#2b3a88', '#384bb2'],
                electric: ['#3e52d5', '#5569f2', '#7082ff'],
                vanilla: ['#faecd4', '#ebd6bb', '#fff3df'],
                ink: ['#0f1430']
            };

            const palCircle2 = {
                navy: ['#222659', '#313780', '#414aa8'],
                electric: ['#8a2e7d', '#b03ba0', '#d456c3'], // rich plum/magenta sparks
                vanilla: ['#faecd4', '#f0dcbf', '#fff3df'],
                ink: ['#12142e']
            };

            const palCircle3 = {
                navy: ['#1d3268', '#274590', '#3258b8'],
                electric: ['#0284c7', '#38bdf8', '#7dd3fc'], // bright cyan / sky sparks
                vanilla: ['#faecd4', '#eedaba', '#fff3df'],
                ink: ['#101a35']
            };

            const buildCircleCluster = (cx, cy, rx, ry, seedBase, palette, shapeMod) => {
                const baseUnit = Math.round(16 * this.scaleX);
                const cols = Math.ceil(rx / baseUnit);
                const rows = Math.ceil(ry / baseUnit);
                const grid = new Map();

                // Core chunky blocks (2x2 cells)
                for (let r = -rows; r <= rows; r++) {
                    for (let c = -cols; c <= cols; c++) {
                        let distNorm = Math.pow((c * baseUnit) / rx, 2) + Math.pow((r * baseUnit) / ry, 2);
                        if (shapeMod) distNorm = shapeMod(c, r, distNorm);
                        if (distNorm > 1.0) continue;

                        const seed = seedBase + (r + 100) * 317 + (c + 100) * 97;
                        const rnd = pseudoRnd(seed);

                        if (distNorm < 0.38 && c % 2 === 0 && r % 2 === 0) {
                            const size = baseUnit * 2;
                            const isVanilla = rnd < 0.28;
                            const isElectric = rnd > 0.65;
                            const isInk = rnd > 0.58 && rnd <= 0.65;
                            const col = isVanilla ? palette.vanilla[Math.floor(rnd * 10) % palette.vanilla.length]
                                      : (isElectric ? palette.electric[Math.floor(rnd * 10) % palette.electric.length]
                                      : (isInk ? palette.ink[0]
                                      : palette.navy[Math.floor(rnd * 10) % palette.navy.length]));

                            addBlock(Math.round(cx + c * baseUnit), Math.round(cy + r * baseUnit), size, col);
                            grid.set(`${c},${r}`, true);
                            grid.set(`${c + 1},${r}`, true);
                            grid.set(`${c},${r + 1}`, true);
                            grid.set(`${c + 1},${r + 1}`, true);
                        }
                    }
                }

                // Medium (16px) & fine (8px) stepping blocks
                for (let r = -rows; r <= rows; r++) {
                    for (let c = -cols; c <= cols; c++) {
                        let distNorm = Math.pow((c * baseUnit) / rx, 2) + Math.pow((r * baseUnit) / ry, 2);
                        if (shapeMod) distNorm = shapeMod(c, r, distNorm);
                        if (distNorm > 1.0 || grid.has(`${c},${r}`)) continue;

                        const seed = seedBase + (r + 100) * 317 + (c + 100) * 97;
                        const rnd = pseudoRnd(seed);
                        const bx = Math.round(cx + c * baseUnit);
                        const by = Math.round(cy + r * baseUnit);

                        if (distNorm > 0.68) {
                            const half = Math.round(baseUnit / 2);
                            const offsets = [
                                { dx: 0, dy: 0 },
                                { dx: half, dy: 0 },
                                { dx: 0, dy: half },
                                { dx: half, dy: half }
                            ];
                            offsets.forEach((off, idx) => {
                                const subRnd = pseudoRnd(seed + idx * 47);
                                if (subRnd > 0.22) {
                                    const isVanilla = subRnd < 0.26;
                                    const isElectric = subRnd > 0.68;
                                    const col = isVanilla ? palette.vanilla[0] 
                                              : (isElectric ? palette.electric[0] 
                                              : palette.navy[Math.floor(subRnd * 10) % palette.navy.length]);
                                    addBlock(bx + off.dx, by + off.dy, half, col);
                                }
                            });
                        } else {
                            const isVanilla = rnd < 0.26;
                            const isElectric = rnd > 0.66;
                            const col = isVanilla ? palette.vanilla[Math.floor(rnd * 10) % palette.vanilla.length]
                                      : (isElectric ? palette.electric[Math.floor(rnd * 10) % palette.electric.length]
                                      : palette.navy[Math.floor(rnd * 10) % palette.navy.length]);
                            addBlock(bx, by, baseUnit, col);
                        }
                    }
                }
            };

            // 1. Circle 1 (Blob 1 - Top Left):
            // 1A. Upper-left curve into background
            buildCircleCluster(
                80 * this.scaleX,
                70 * this.scaleY,
                90 * this.scaleX,
                65 * this.scaleY,
                101,
                palCircle1,
                (c, r, d) => d + (c > 0 && r > 0 ? 0.35 : 0)
            );
            // 1B. Lower curve hugging contour facing valley
            buildCircleCluster(
                260 * this.scaleX,
                350 * this.scaleY,
                110 * this.scaleX,
                75 * this.scaleY,
                102,
                palCircle1,
                (c, r, d) => d + (c < 0 && r < 0 ? 0.30 : 0)
            );

            // 2. Circle 2 (Blob 2 - Bottom Left):
            // 2A. Upper curve facing valley towards Circle 1
            buildCircleCluster(
                220 * this.scaleX,
                470 * this.scaleY,
                110 * this.scaleX,
                75 * this.scaleY,
                201,
                palCircle2,
                (c, r, d) => d + (c < 0 && r > 0 ? 0.30 : 0)
            );
            // 2B. Lower contour into bottom background
            buildCircleCluster(
                120 * this.scaleX,
                780 * this.scaleY,
                95 * this.scaleX,
                70 * this.scaleY,
                202,
                palCircle2,
                (c, r, d) => d + (c > 0 && r < 0 ? 0.35 : 0)
            );

            // 3. Circle 3 (Blob 3 - Middle Right):
            // 3A. Underside stepping along lower contour into open right background
            buildCircleCluster(
                880 * this.scaleX,
                325 * this.scaleY,
                125 * this.scaleX,
                80 * this.scaleY,
                301,
                palCircle3,
                (c, r, d) => d + (c < 0 && r < 0 ? 0.35 : 0)
            );
            // 3B. Outer right curve into ambient background
            buildCircleCluster(
                1040 * this.scaleX,
                150 * this.scaleY,
                95 * this.scaleX,
                70 * this.scaleY,
                302,
                palCircle3,
                (c, r, d) => d + (c < 0 && r > 0 ? 0.35 : 0)
            );

            // Connective accent under center collage
            buildCircleCluster(
                this.width * 0.50,
                this.height * 0.84,
                95 * this.scaleX,
                60 * this.scaleY,
                404,
                palCircle2,
                null
            );

            this.batches = batches;
        }

        // Hyper-fast batch draw: Pre-grouped paths by color
        renderBatched() {
            if (!this.ctx) return;
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.width, this.height);

            for (const [color, rects] of this.batches) {
                ctx.fillStyle = color;
                ctx.beginPath();
                for (let i = 0; i < rects.length; i++) {
                    const r = rects[i];
                    ctx.rect(r.x, r.y, r.size, r.size);
                }
                ctx.fill();
            }
        }

        triggerPixelDissolve(totalDuration = 2600) {
            if (!this.ctx || !this.canvas) return;
            if (this.dissolveTimeout) clearTimeout(this.dissolveTimeout);
            if (this.cleanupTimeout) clearTimeout(this.cleanupTimeout);

            this.animating = true;
            this.renderBatched();

            this.canvas.style.transition = 'none';
            this.canvas.style.opacity = '0.95';

            // Hold full pixel mosaic for 1.2s
            this.dissolveTimeout = setTimeout(() => {
                if (!this.animating) return;

                // Hardware-accelerated CSS opacity dissolve over 1.4s
                this.canvas.style.transition = 'opacity 1.4s ease-out';
                this.canvas.style.opacity = '0';

                // Clean up canvas after dissolve (0% CPU)
                this.cleanupTimeout = setTimeout(() => {
                    this.animating = false;
                    if (this.ctx) {
                        this.ctx.clearRect(0, 0, this.width, this.height);
                    }
                }, 1450);
            }, 1200);
        }
    }

    /* ====================================================================
       3. SCROLL & INTERACTION TRIGGERS (SMOOTH 60-120 FPS)
       ==================================================================== */
    const collageStage = document.getElementById('collageStage');
    const stagePixelCanvas = document.getElementById('stagePixelCanvas');
    const stagePixelEngine = stagePixelCanvas && collageStage ? new StagePixelEngine(collageStage, stagePixelCanvas) : null;

    let middleVisitCount = 0;
    let isCurrentlyInMiddle = false;

    function triggerMiddlePixelation(isFirstTime) {
        middleVisitCount++;
        const strength = isFirstTime ? 1.0 : Math.max(0.3, 1.0 / (middleVisitCount * 1.2));

        // 1. Photos: Trigger optimized banded retro pixelation & smooth GPU dissolve
        pixelLayers.forEach((layer, idx) => {
            setTimeout(() => {
                layer.animateToSharp(1400, strength);
            }, idx * 25);
        });

        // 2. Background: Trigger batched pixel clusters near 3 circles with timed dissolve
        if (stagePixelEngine) {
            stagePixelEngine.triggerPixelDissolve(2600);
        }
    }

    if (collageStage) {
        const middleObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!isCurrentlyInMiddle) {
                        isCurrentlyInMiddle = true;
                        triggerMiddlePixelation(middleVisitCount === 0);
                    }
                } else {
                    isCurrentlyInMiddle = false;
                }
            });
        }, { threshold: 0.16 });

        middleObserver.observe(collageStage);
    }

    // Interactive Trigger: Clicking any of the 3 Circles (Blobs) produces a fresh pixel dissolve wave!
    ['blob1', 'blob2', 'blob3'].forEach(id => {
        const blobEl = document.getElementById(id);
        if (blobEl) {
            blobEl.style.cursor = 'pointer';
            blobEl.addEventListener('click', () => {
                triggerMiddlePixelation(false);
            });
        }
    });

    /* ====================================================================
       4. LIGHTWEIGHT INTRO & FOOTER EFFECTS (NO BLUR / ZERO LAG)
       ==================================================================== */
    function runHeroIntroPixel() {
        const headerImgs = document.querySelectorAll('.bento-img');
        if (!headerImgs.length) return;

        headerImgs.forEach(img => {
            img.style.imageRendering = 'pixelated';
            img.style.filter = 'contrast(1.2) brightness(0.9)';
        });

        setTimeout(() => {
            headerImgs.forEach(img => {
                img.style.transition = 'filter 0.8s ease';
                img.style.filter = 'none';
                setTimeout(() => {
                    img.style.imageRendering = 'auto';
                }, 800);
            });
        }, 400);
    }
    runHeroIntroPixel();

    const footerSection = document.getElementById('footerSection');
    let footerFlashDone = false;

    if (footerSection) {
        const footerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !footerFlashDone) {
                    footerFlashDone = true;
                    const footerBoxes = document.querySelectorAll('.footer-box');
                    footerBoxes.forEach(box => {
                        box.style.filter = 'contrast(1.2) brightness(0.85)';
                    });

                    setTimeout(() => {
                        footerBoxes.forEach(box => {
                            box.style.transition = 'filter 0.6s ease';
                            box.style.filter = 'none';
                        });
                    }, 300);
                }
            });
        }, { threshold: 0.35 });

        footerObserver.observe(footerSection);
    }

    /* ====================================================================
       5. SERVICES TICKER: SMOOTH MOMENTUM BRAKING ON HOVER & 100% SEAMLESS LOOP
       ==================================================================== */
    const servicesSection = document.getElementById('servicesSection');
    const servicesTrack = document.getElementById('servicesTrack');
    const servicesGroup1 = document.getElementById('servicesGroup1');

    if (servicesSection && servicesTrack && servicesGroup1) {
        let currentX = 0;
        const cruisingSpeed = 0.95; // smooth px per frame
        let currentSpeed = 0.95;
        let isHovered = false;

        const onEnter = () => { isHovered = true; };
        const onLeave = () => { isHovered = false; };

        servicesSection.addEventListener('mouseenter', onEnter);
        servicesSection.addEventListener('mouseleave', onLeave);
        servicesSection.addEventListener('touchstart', onEnter, { passive: true });
        servicesSection.addEventListener('touchend', onLeave, { passive: true });

        function animateTicker() {
            // Target speed: 0 when hovered (smooth braking), cruisingSpeed when unhovered
            const targetSpeed = isHovered ? 0 : cruisingSpeed;
            // Lerp factor 0.045 gives an organic deceleration over ~350ms (not jarring / instant)
            currentSpeed += (targetSpeed - currentSpeed) * 0.045;

            if (Math.abs(currentSpeed) > 0.001) {
                currentX -= currentSpeed;
                const groupWidth = servicesGroup1.offsetWidth;
                if (groupWidth > 0 && currentX <= -groupWidth) {
                    currentX += groupWidth; // 100% invisible continuous loop
                }
                servicesTrack.style.transform = `translate3d(${currentX.toFixed(2)}px, 0, 0)`;
            }

            requestAnimationFrame(animateTicker);
        }

        requestAnimationFrame(animateTicker);
    }

    /* ====================================================================
       6. POPUP MODALS (MAP & EXAMPLES)
       ==================================================================== */
    const mapModal = document.getElementById('mapModal');
    const openMapBtn = document.getElementById('openMapBtn');
    const mapFrame = document.getElementById('mapFrame');

    const examplesModal = document.getElementById('examplesModal');
    const openExamplesBtn = document.getElementById('examplesBtn');

    // Open Map
    if (openMapBtn && mapModal) {
        openMapBtn.addEventListener('click', (e) => {
            e.preventDefault();
            mapModal.classList.add('active');
            // Lazy load the iframe source
            if (mapFrame && mapFrame.dataset.lazySrc) {
                mapFrame.src = mapFrame.dataset.lazySrc;
                delete mapFrame.dataset.lazySrc;
            }
        });
    }

    // Open Examples
    if (openExamplesBtn && examplesModal) {
        openExamplesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            examplesModal.classList.add('active');
        });
    }

    // Generic Modal Close via [data-close-modal]
    document.addEventListener('click', (e) => {
        if (e.target.hasAttribute('data-close-modal')) {
            const activeModal = e.target.closest('.popup-modal');
            if (activeModal) {
                activeModal.classList.remove('active');
            }
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.popup-modal.active').forEach(m => m.classList.remove('active'));
            if (photoInspector && photoInspector.classList.contains('active')) {
                closeInspector();
            }
        }
    });

    // Booking button: pure decorative feedback (as requested: "чисто интерфейс")
    const bookingBtn = document.getElementById('bookingBtn');
    if (bookingBtn) {
        bookingBtn.addEventListener('click', () => {
            bookingBtn.style.transform = 'translate(2px, 2px) scale(0.97)';
            setTimeout(() => {
                bookingBtn.style.transform = '';
            }, 180);
        });
    }

    /* ====================================================================
       7. PHOTO INSPECTOR / LIGHTBOX (SMOOTH PHOTO EXAMINATION)
       ==================================================================== */
    const photoInspector = document.getElementById('photoInspectorModal');
    const inspectorImg = document.getElementById('inspectorImg');

    function openInspector(imgSrc) {
        if (!photoInspector || !inspectorImg || !imgSrc) return;
        inspectorImg.src = imgSrc;
        photoInspector.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeInspector() {
        if (!photoInspector) return;
        photoInspector.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Connect all clickable photos (improved hitboxes)
    // 1. Collage photos (.cl-photo)
    document.querySelectorAll('.cl-photo').forEach(photo => {
        photo.style.cursor = 'pointer';
        photo.addEventListener('click', (e) => {
            e.stopPropagation();
            const src = photo.dataset.src;
            if (src) openInspector(src);
        });
    });

    // 2. Bento cards in hero (.bento-card)
    document.querySelectorAll('.bento-card').forEach(card => {
        const img = card.querySelector('.bento-img');
        if (img) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                openInspector(img.src);
            });
        }
    });

    // 3. Examples modal tiles (.ex-tile)
    document.querySelectorAll('.ex-tile').forEach(tile => {
        const img = tile.querySelector('img');
        if (img) {
            tile.style.cursor = 'pointer';
            tile.addEventListener('click', (e) => {
                e.stopPropagation();
                openInspector(img.src);
            });
        }
    });

    // 4. Svyaz meme photo (.svyaz-meme-img)
    const svyazMeme = document.querySelector('.svyaz-meme-img');
    if (svyazMeme) {
        svyazMeme.addEventListener('click', (e) => {
            e.stopPropagation();
            openInspector(svyazMeme.src);
        });
    }

    // Close on backdrop, close button, viewport click, or [data-close-inspector]
    document.addEventListener('click', (e) => {
        if (e.target.hasAttribute('data-close-inspector') || e.target.closest('[data-close-inspector]')) {
            closeInspector();
        }
    });

    console.log('Lovecut site v4 initialized successfully.');
});
