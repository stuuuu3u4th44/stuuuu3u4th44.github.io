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
       1. MULTI-SCALE PIXELATION CANVAS ENGINE
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
            this.init();
        }

        init() {
            if (!this.canvas || !this.ctx || !this.src) return;
            this.img.crossOrigin = 'anonymous';
            this.img.onload = () => {
                this.isLoaded = true;
                this.resizeCanvas();
                this.setupZones();
                // Draw initial strong pixelated state
                this.renderFrame(1.0, 1.0);
            };
            this.img.src = this.src;

            // Handle window resize
            window.addEventListener('resize', () => {
                if (this.isLoaded) {
                    this.resizeCanvas();
                    this.renderFrame(0.0, 0.0); // crisp if idle
                }
            });
        }

        resizeCanvas() {
            const rect = this.container.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.width = Math.max(Math.floor(rect.width * dpr), 60);
            this.height = Math.max(Math.floor(rect.height * dpr), 60);
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        }

        setupZones() {
            // Divide image into a grid of zones with varied initial pixel sizes
            const cols = 6;
            const rows = 6;
            const cellW = this.width / cols;
            const cellH = this.height / rows;
            this.zones = [];

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    // Heterogeneous distribution: some zones huge chunky blocks (48px),
                    // some medium (20px), some finer, with staggered completion delays
                    let baseMaxPx;
                    const rand = Math.random();
                    if (rand < 0.25) {
                        baseMaxPx = 48 + Math.floor(Math.random() * 16); // 48-64px giant blocks
                    } else if (rand < 0.65) {
                        baseMaxPx = 24 + Math.floor(Math.random() * 16); // 24-40px chunky blocks
                    } else {
                        baseMaxPx = 10 + Math.floor(Math.random() * 12); // 10-22px medium blocks
                    }

                    // Staggered timing wave (mix of horizontal flow + random jitter)
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

        // Render with progress (0.0 = sharp, 1.0 = full initial pixelation)
        renderFrame(strengthFactor, globalProgress) {
            if (!this.isLoaded || !this.ctx) return;
            const ctx = this.ctx;
            const w = this.width;
            const h = this.height;

            // Full crisp render if 0 progress
            if (globalProgress <= 0.001 || strengthFactor <= 0.01) {
                ctx.imageSmoothingEnabled = true;
                ctx.drawImage(this.img, 0, 0, w, h);
                return;
            }

            ctx.imageSmoothingEnabled = false;

            // Render zone by zone with distinct pixel sizes
            for (const zone of this.zones) {
                // Individual progress for this zone considering stagger
                const zoneProg = Math.max(0, Math.min(1, (globalProgress - zone.stagger * 0.4) / (1 - zone.stagger * 0.4)));
                const currentPixelSize = Math.max(1, Math.round(zone.baseMaxPx * strengthFactor * zoneProg));

                if (currentPixelSize <= 1) {
                    // Draw clean region
                    ctx.drawImage(
                        this.img,
                        (zone.x / w) * this.img.naturalWidth,
                        (zone.y / h) * this.img.naturalHeight,
                        (zone.w / w) * this.img.naturalWidth,
                        (zone.h / h) * this.img.naturalHeight,
                        zone.x, zone.y, zone.w, zone.h
                    );
                } else {
                    // Draw chunky pixelated block for this zone
                    const sampleW = Math.max(1, Math.floor(zone.w / currentPixelSize));
                    const sampleH = Math.max(1, Math.floor(zone.h / currentPixelSize));

                    // Use temporary offscreen canvas or 1x1 steps
                    const offCanvas = document.createElement('canvas');
                    offCanvas.width = sampleW;
                    offCanvas.height = sampleH;
                    const offCtx = offCanvas.getContext('2d');
                    offCtx.imageSmoothingEnabled = false;

                    // Downsample
                    offCtx.drawImage(
                        this.img,
                        (zone.x / w) * this.img.naturalWidth,
                        (zone.y / h) * this.img.naturalHeight,
                        (zone.w / w) * this.img.naturalWidth,
                        (zone.h / h) * this.img.naturalHeight,
                        0, 0, sampleW, sampleH
                    );

                    // Upscale back with pixelated look
                    ctx.drawImage(offCanvas, 0, 0, sampleW, sampleH, zone.x, zone.y, zone.w, zone.h);
                }
            }
        }

        // Animate from initial chunky pixels to crisp image
        animateToSharp(duration, strengthFactor) {
            this.animating = true;
            const startTime = performance.now();

            const step = (now) => {
                const elapsed = now - startTime;
                const linearProgress = Math.min(1, elapsed / duration);
                
                // Ease-out cubic: stays pixelated at start, then resolves
                const easedProg = 1 - Math.pow(linearProgress, 2.2);

                this.renderFrame(strengthFactor, easedProg);

                if (linearProgress < 1) {
                    requestAnimationFrame(step);
                } else {
                    this.animating = false;
                    this.renderFrame(0, 0); // Guarantee 100% crisp at end
                }
            };
            requestAnimationFrame(step);
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
    const messyCircles = [
        document.getElementById('blob1'),
        document.getElementById('blob2'),
        document.getElementById('blob3')
    ].filter(Boolean);

    let middleVisitCount = 0;
    let isCurrentlyInMiddle = false;

    function triggerMiddlePixelation(isFirstTime) {
        middleVisitCount++;
        // Diminishing strength each time: 1.0 -> 0.45 -> 0.25 -> 0.12
        const strength = isFirstTime ? 1.0 : Math.max(0.12, 1.0 / (middleVisitCount * 1.5));
        const duration = isFirstTime ? 2400 : Math.max(800, 2400 / (middleVisitCount * 1.2));

        // Trigger photos
        pixelLayers.forEach((layer, idx) => {
            setTimeout(() => {
                layer.animateToSharp(duration, strength);
            }, idx * 45); // slight stagger across photos
        });

        // Trigger 3 messy circles (pixel-fade appearance)
        messyCircles.forEach((circle, idx) => {
            circle.style.opacity = '0';
            circle.style.filter = `blur(${Math.round(8 * strength)}px)`;
            circle.style.transform = `scale(${0.92 + (idx % 2 ? 0.05 : -0.05)})`;

            setTimeout(() => {
                circle.style.transition = `opacity ${duration}ms ease, filter ${duration}ms ease, transform ${duration}ms cubic-bezier(0.2, 0.9, 0.3, 1)`;
                circle.style.opacity = '1';
                circle.style.filter = 'blur(0px)';
                circle.style.transform = idx === 0 ? 'rotate(-3deg)' : (idx === 1 ? 'rotate(2deg)' : 'rotate(4deg)');
            }, 180 + idx * 160);
        });
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
        }, { threshold: 0.22 });

        middleObserver.observe(collageStage);
    }

    /* ====================================================================
       3. ONE-TIME WEAK PIXEL FLASH AT PAGE START (HERO)
       ==================================================================== */
    function runHeroIntroPixel() {
        const headerImgs = document.querySelectorAll('.bento-img');
        if (!headerImgs.length) return;

        // Apply weak pixelation / contrast on load
        headerImgs.forEach(img => {
            img.style.imageRendering = 'pixelated';
            img.style.filter = 'contrast(1.3) brightness(0.85)';
        });

        setTimeout(() => {
            headerImgs.forEach(img => {
                img.style.transition = 'filter 1.2s ease';
                img.style.filter = 'none';
                setTimeout(() => {
                    img.style.imageRendering = 'auto';
                }, 1200);
            });
        }, 500);
    }
    // Run once on load
    runHeroIntroPixel();

    /* ====================================================================
       4. ONE-TIME WEAK PIXEL FLASH AT VERY END (FOOTER)
       ==================================================================== */
    const footerSection = document.getElementById('footerSection');
    let footerFlashDone = false;

    if (footerSection) {
        const footerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !footerFlashDone) {
                    footerFlashDone = true;
                    const footerBoxes = document.querySelectorAll('.footer-box');
                    footerBoxes.forEach(box => {
                        box.style.filter = 'contrast(1.4) brightness(0.75) blur(1px)';
                    });

                    setTimeout(() => {
                        footerBoxes.forEach(box => {
                            box.style.transition = 'filter 0.9s ease';
                            box.style.filter = 'none';
                        });
                    }, 400);
                }
            });
        }, { threshold: 0.35 });

        footerObserver.observe(footerSection);
    }

    /* ====================================================================
       5. SERVICES TICKER HOVER/TOUCH PAUSE CONTROL
       ==================================================================== */
    const servicesSection = document.getElementById('servicesSection');
    const servicesTrack = document.getElementById('servicesTrack');

    if (servicesSection && servicesTrack) {
        const pauseTicker = () => {
            servicesTrack.style.animationPlayState = 'paused';
        };
        const resumeTicker = () => {
            servicesTrack.style.animationPlayState = 'running';
        };

        servicesSection.addEventListener('mouseenter', pauseTicker);
        servicesSection.addEventListener('mouseleave', resumeTicker);
        servicesSection.addEventListener('touchstart', pauseTicker, { passive: true });
        servicesSection.addEventListener('touchend', resumeTicker, { passive: true });
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

    console.log('Lovecut site v3 initialized successfully.');
});
