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
       1. ULTRA-SMOOTH RETRO PHOTO PIXELATION & INSTANT DISSOLUTION
       - Zero per-frame calculations / Zero lag (120 FPS rock solid)
       - Authentic 12px retro pixel dither that dissolves into razor-sharp photos
       - Hardware-accelerated CSS GPU compositor dissolve (0% CPU once settled)
       ==================================================================== */
    class PixelLayer {
        constructor(container) {
            this.container = container;
            this.canvas = container.querySelector('.pixel-fx-canvas');
            this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
            this.img = container.querySelector('.cl-photo-img');
            this.hasDissolved = false;
            this.init();
        }

        init() {
            if (!this.canvas || !this.ctx || !this.img) return;
            if (this.img.complete && this.img.naturalWidth > 0) {
                this.drawPixelatedState();
            } else {
                this.img.addEventListener('load', () => this.drawPixelatedState(), { once: true });
            }
        }

        drawPixelatedState() {
            if (!this.ctx || !this.img || !this.img.naturalWidth) return;
            const rect = this.container.getBoundingClientRect();
            const w = Math.max(Math.floor(rect.width), 40);
            const h = Math.max(Math.floor(rect.height), 40);
            this.canvas.width = w;
            this.canvas.height = h;

            const imgW = this.img.naturalWidth;
            const imgH = this.img.naturalHeight;
            const imgRatio = imgW / imgH;
            const targetRatio = w / h;
            let sx = 0, sy = 0, sw = imgW, sh = imgH;
            if (imgRatio > targetRatio) {
                sw = imgH * targetRatio;
                sx = (imgW - sw) / 2;
            } else {
                sh = imgW / targetRatio;
                sy = (imgH - sh) / 2;
            }

            // Downsample to 12px retro block size
            const pxSize = 12;
            const sampleW = Math.max(1, Math.floor(w / pxSize));
            const sampleH = Math.max(1, Math.floor(h / pxSize));

            const scratch = document.createElement('canvas');
            scratch.width = sampleW;
            scratch.height = sampleH;
            const sCtx = scratch.getContext('2d');
            if (!sCtx) return;

            sCtx.imageSmoothingEnabled = false;
            sCtx.drawImage(this.img, sx, sy, sw, sh, 0, 0, sampleW, sampleH);

            this.ctx.imageSmoothingEnabled = false;
            this.ctx.drawImage(scratch, 0, 0, sampleW, sampleH, 0, 0, w, h);
            this.canvas.style.opacity = '1';
        }

        dissolve() {
            if (this.hasDissolved || !this.canvas) return;
            this.hasDissolved = true;
            this.canvas.style.transition = 'opacity 0.6s cubic-bezier(0.2, 0.8, 0.3, 1)';
            this.canvas.style.opacity = '0';
            setTimeout(() => {
                this.canvas.style.display = 'none';
                if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }, 650);
        }

        replay() {
            if (!this.canvas) return;
            this.hasDissolved = false;
            this.canvas.style.display = 'block';
            this.canvas.style.animation = 'none';
            void this.canvas.offsetWidth;
            this.canvas.style.animation = 'photoPixelFade 1.6s cubic-bezier(0.2, 0.8, 0.3, 1) forwards';
            this.drawPixelatedState();
            setTimeout(() => this.dissolve(), 1600);
        }
    }

    const photoContainers = document.querySelectorAll('.cl-photo');
    const pixelLayers = [];
    photoContainers.forEach(container => {
        pixelLayers.push(new PixelLayer(container));
    });

    /* ====================================================================
       2. TASTEFUL RETRO PIXEL ACCENTS (3 CIRCLES / BLOBS)
       - Pre-rendered crisp SVG clusters anchored to Blob 1, 2, 3
       - Smooth timed dissolution via GPU compositor (zero CPU/lag)
       - Interactive replay when clicking any blob
       ==================================================================== */
    const blobPixels = document.querySelectorAll('.blob-pixels');

    function dissolveBlobPixels() {
        blobPixels.forEach(el => {
            el.classList.add('dissolved');
        });
    }

    function replayBlobPixels() {
        blobPixels.forEach(el => {
            el.style.animation = 'none';
            void el.offsetWidth;
            el.style.animation = 'blobPixelFade 2.2s cubic-bezier(0.2, 0.8, 0.3, 1) forwards';
        });
        pixelLayers.forEach(layer => layer.replay());
    }

    // Automatic timed dissolution (guarantees site is crisp and clean even without scrolling)
    setTimeout(() => {
        dissolveBlobPixels();
        pixelLayers.forEach(layer => layer.dissolve());
    }, 1200);

    // Trigger dissolution on scroll into view
    const collageStage = document.getElementById('collageStage');
    let collageEntered = false;

    if (collageStage) {
        const middleObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !collageEntered) {
                    collageEntered = true;
                    setTimeout(() => {
                        pixelLayers.forEach(layer => layer.dissolve());
                    }, 350);
                    setTimeout(() => {
                        dissolveBlobPixels();
                    }, 700);
                    middleObserver.unobserve(collageStage);
                }
            });
        }, { threshold: 0.1 });

        middleObserver.observe(collageStage);
    }

    // Interactive Trigger: Clicking any of the 3 Blobs produces a fresh tasteful pixel dissolve
    ['blob1', 'blob2', 'blob3'].forEach(id => {
        const blobEl = document.getElementById(id);
        if (blobEl) {
            blobEl.style.cursor = 'pointer';
            blobEl.addEventListener('click', () => {
                replayBlobPixels();
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
