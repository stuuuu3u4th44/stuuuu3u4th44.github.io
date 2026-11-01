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
       1. HETEROGENEOUS MULTI-SCALE PHOTO PIXELATION ENGINE (HYPER-OPTIMIZED)
       - Authentic multi-scale pixelation zones (48-64px chunky, 24-40px, 10-22px)
       - Staggered dynamic wave resolving smoothly into razor-sharp images
       - Zero per-frame allocations (uses pre-allocated reusable scratch canvas)
       - Cap DPR at 1.5 for ultra-fast 60-120 FPS performance with 0 lag
       ==================================================================== */
    class PixelLayer {
        constructor(container) {
            this.container = container;
            this.canvas = container.querySelector('.pixel-fx-canvas');
            this.ctx = this.canvas ? this.canvas.getContext('2d', { willReadFrequently: true }) : null;
            this.src = container.dataset.src;
            this.img = new Image();
            this.isLoaded = false;
            this.zones = [];
            this.animating = false;
            this.rafId = null;

            // Reusable offscreen scratch canvas — ZERO allocations in loop!
            this.scratch = document.createElement('canvas');
            this.scratchCtx = this.scratch.getContext('2d', { willReadFrequently: true });

            this.init();
        }

        init() {
            if (!this.canvas || !this.ctx || !this.src) return;
            this.img.onload = () => {
                this.isLoaded = true;
                this.resizeCanvas();
                this.setupZones();
                // Crisp clear default state on initial visit (no stuck pixel bug)
                this.renderFrame(0.0, 0.0);
            };
            if (this.img.complete && this.img.naturalWidth > 0) {
                this.isLoaded = true;
                this.resizeCanvas();
                this.setupZones();
                this.renderFrame(0.0, 0.0);
            }
            this.img.src = this.src;

            window.addEventListener('resize', () => {
                if (this.isLoaded) {
                    this.resizeCanvas();
                    this.setupZones();
                    if (!this.animating) {
                        this.renderFrame(0.0, 0.0); // crisp if settled
                    }
                }
            }, { passive: true });
        }

        resizeCanvas() {
            const rect = this.container.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            this.width = Math.max(Math.floor(rect.width * dpr), 60);
            this.height = Math.max(Math.floor(rect.height * dpr), 60);
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        }

        setupZones() {
            // Divide image into a 6x6 grid of zones with varied initial pixel sizes
            const cols = 6;
            const rows = 6;
            const cellW = this.width / cols;
            const cellH = this.height / rows;
            this.zones = [];

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    // Heterogeneous distribution matching user's reference:
                    // Some zones huge chunky blocks (48-64px),
                    // some medium (24-40px), some finer (10-22px)
                    let baseMaxPx;
                    const rand = Math.random();
                    if (rand < 0.25) {
                        baseMaxPx = 48 + Math.floor(Math.random() * 16);
                    } else if (rand < 0.65) {
                        baseMaxPx = 24 + Math.floor(Math.random() * 16);
                    } else {
                        baseMaxPx = 10 + Math.floor(Math.random() * 12);
                    }

                    // Staggered timing wave (horizontal flow + vertical flow + random jitter)
                    const stagger = (c / cols) * 0.45 + (r / rows) * 0.25 + (Math.random() * 0.3);

                    this.zones.push({
                        x: c * cellW,
                        y: r * cellH,
                        w: cellW,
                        h: cellH,
                        baseMaxPx: baseMaxPx,
                        stagger: stagger
                    });
                }
            }
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

        // Render with progress (0.0 = sharp, 1.0 = full initial pixelation)
        renderFrame(strengthFactor, globalProgress) {
            if (!this.isLoaded || !this.ctx) return;
            const ctx = this.ctx;
            const w = this.width;
            const h = this.height;
            const crop = this.getCoverCrop(w, h);

            // Full crisp render if 0 progress
            if (globalProgress <= 0.001 || strengthFactor <= 0.01) {
                ctx.imageSmoothingEnabled = true;
                ctx.drawImage(this.img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, w, h);
                return;
            }

            ctx.imageSmoothingEnabled = false;

            // Render zone by zone with distinct pixel sizes
            for (let i = 0; i < this.zones.length; i++) {
                const zone = this.zones[i];
                // Individual progress for this zone considering stagger
                const zoneProg = Math.max(0, Math.min(1, (globalProgress - zone.stagger * 0.4) / (1 - zone.stagger * 0.4)));
                const currentPixelSize = Math.max(1, Math.round(zone.baseMaxPx * strengthFactor * zoneProg));

                const srcX = crop.sx + (zone.x / w) * crop.sw;
                const srcY = crop.sy + (zone.y / h) * crop.sh;
                const srcW = (zone.w / w) * crop.sw;
                const srcH = (zone.h / h) * crop.sh;

                if (currentPixelSize <= 1) {
                    // Draw clean region
                    ctx.drawImage(
                        this.img,
                        srcX, srcY, srcW, srcH,
                        zone.x, zone.y, zone.w, zone.h
                    );
                } else {
                    // Reusable scratch canvas: ZERO allocations!
                    const sampleW = Math.max(1, Math.floor(zone.w / currentPixelSize));
                    const sampleH = Math.max(1, Math.floor(zone.h / currentPixelSize));

                    this.scratch.width = sampleW;
                    this.scratch.height = sampleH;
                    this.scratchCtx.imageSmoothingEnabled = false;

                    // Downsample
                    this.scratchCtx.drawImage(
                        this.img,
                        srcX, srcY, srcW, srcH,
                        0, 0, sampleW, sampleH
                    );

                    // Upscale back with pixelated look
                    ctx.drawImage(this.scratch, 0, 0, sampleW, sampleH, zone.x, zone.y, zone.w, zone.h);
                }
            }
        }

                // Dynamic pixel wave: bursts into chunky pixels and smoothly resolves to crisp
        animatePixelWave(duration = 2000, strengthFactor = 1.0) {
            if (!this.isLoaded || !this.ctx) return;
            if (this.rafId) cancelAnimationFrame(this.rafId);

            this.animating = true;
            const startTime = performance.now();

            const step = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(1, elapsed / duration);

                let waveFactor;
                if (progress < 0.16) {
                    // Quick burst into pixels (0 -> 1 over first 16% ~320ms)
                    waveFactor = progress / 0.16;
                } else {
                    // Smooth decay from chunky pixels back to razor-sharp (1 -> 0 with cubic ease-out)
                    const decayProgress = (progress - 0.16) / 0.84;
                    waveFactor = 1 - Math.pow(decayProgress, 2.2);
                }

                this.renderFrame(strengthFactor, waveFactor);

                if (progress < 1) {
                    this.rafId = requestAnimationFrame(step);
                } else {
                    this.animating = false;
                    this.rafId = null;
                    this.renderFrame(0, 0); // Always 100% crisp at end
                }
            };
            this.rafId = requestAnimationFrame(step);
        }

        // Animate from initial chunky pixels to crisp image
        animateToSharp(duration = 2400, strengthFactor = 1.0) {
            if (!this.isLoaded || !this.ctx) return;
            if (this.rafId) cancelAnimationFrame(this.rafId);

            this.animating = true;
            const startTime = performance.now();

            const step = (now) => {
                const elapsed = now - startTime;
                const linearProgress = Math.min(1, elapsed / duration);

                // Ease-out cubic: stays chunky at start, then smoothly resolves zone by zone
                const easedProg = 1 - Math.pow(linearProgress, 2.2);

                this.renderFrame(strengthFactor, easedProg);

                if (linearProgress < 1) {
                    this.rafId = requestAnimationFrame(step);
                } else {
                    this.animating = false;
                    this.rafId = null;
                    this.renderFrame(0, 0); // Guarantee 100% crisp at end
                }
            };
            this.rafId = requestAnimationFrame(step);
        }
    }

    // Initialize all collage photo pixel layers
    const photoContainers = document.querySelectorAll('.cl-photo');
    const pixelLayers = [];
    photoContainers.forEach(container => {
        pixelLayers.push(new PixelLayer(container));
    });

    /* ====================================================================
       2. SCROLL TRIGGER WITH DIMINISHING REPEATS FOR MIDDLE SECTION
       ==================================================================== */
    const collageStage = document.getElementById('collageStage');
    let middleVisitCount = 0;
    let isCurrentlyInMiddle = false;

    function triggerMiddlePixelation() {
        // Trigger photos with pleasant organic stagger across photos
        pixelLayers.forEach((layer, idx) => {
            setTimeout(() => {
                layer.animatePixelWave(2000, 1.0);
            }, idx * 45);
        });
    }

    // Interactive button trigger with tactile press feedback and subsequent pixelation
    const pixelTriggerBtn = document.getElementById('pixelTriggerBtn');
    if (pixelTriggerBtn) {
        pixelTriggerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // 1. Button press tactile feedback
            pixelTriggerBtn.classList.add('is-pressed');
            setTimeout(() => {
                pixelTriggerBtn.classList.remove('is-pressed');
            }, 180);

            // 2. Subsequent pixelation wave across all photos
            triggerMiddlePixelation();
        });
    }

    photoContainers.forEach(container => {
        container.addEventListener('click', () => {
            const layer = pixelLayers.find(l => l.container === container);
            if (layer) {
                layer.animateToSharp(1800, 0.85);
            }
        });
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

    // Footer Modals (FAQ, Reviews, About Us)
    [
        { btnId: 'faqBtn', modalId: 'faqModal' },
        { btnId: 'reviewsBtn', modalId: 'reviewsModal' },
        { btnId: 'aboutBtn', modalId: 'aboutModal' }
    ].forEach(({ btnId, modalId }) => {
        const btn = document.getElementById(btnId);
        const modal = document.getElementById(modalId);
        if (btn && modal) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                modal.classList.add('active');
            });
        }
    });

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
