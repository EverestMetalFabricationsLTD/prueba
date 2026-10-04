document.addEventListener('DOMContentLoaded', () => {

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ─── Navbar, active link and scroll-top (one scroll handler) ────
    const navbar       = document.getElementById('navbar');
    const scrollTopBtn = document.getElementById('scroll-top');
    const sections     = document.querySelectorAll('section[id]');
    const navItems     = document.querySelectorAll('.nav-links a:not(.btn)');
    let ticking = false;

    const onScroll = () => {
        const y = window.scrollY;
        navbar.classList.toggle('scrolled', y > 50);
        scrollTopBtn.classList.toggle('visible', y > 500);

        let current = '';
        sections.forEach(section => {
            if (y >= section.offsetTop - 200) current = section.id;
        });
        navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('href') === `#${current}`);
        });
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });
    onScroll();

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });

    // ─── Scroll Lock Helper (prevents layout shift) ─────────────────
    const lockScroll = () => {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.paddingRight = `${scrollbarWidth}px`;
        navbar.style.paddingRight = `${scrollbarWidth}px`;
        document.body.style.overflow = 'hidden';
    };

    const unlockScroll = () => {
        document.body.style.paddingRight = '';
        navbar.style.paddingRight = '';
        document.body.style.overflow = '';
    };

    // ─── Mobile Menu Toggle ─────────────────────────────────────────
    const menuIcon = document.getElementById('menu-icon');
    const navLinks = document.querySelector('.nav-links');

    const setMenu = (open) => {
        navLinks.classList.toggle('active', open);
        const i = menuIcon.querySelector('i');
        i.classList.toggle('fa-bars', !open);
        i.classList.toggle('fa-xmark', open);
        menuIcon.setAttribute('aria-expanded', open);
        open ? lockScroll() : unlockScroll();
    };

    menuIcon.addEventListener('click', () => setMenu(!navLinks.classList.contains('active')));
    menuIcon.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setMenu(!navLinks.classList.contains('active'));
        }
    });
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) setMenu(false);
        });
    });

    // ─── Hero Title: word-by-word slide-in ─────────────────────────
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && !prefersReducedMotion) {
        heroTitle.innerHTML = heroTitle.innerHTML.replace(/(<[^>]+>.*?<\/[^>]+>|[^\s<]+)/g, (match) => {
            if (match.startsWith('<')) return match;
            return `<span class="hero-word">${match}</span>`;
        });
        heroTitle.querySelectorAll('.hero-word').forEach((word, i) => {
            word.style.animationDelay = `${0.5 + i * 0.12}s`;
        });
    }

    // ─── Particles Canvas ───────────────────────────────────────────
    // Only runs while the hero is on screen and the tab is visible.
    const canvas = document.getElementById('particles');
    if (canvas && !prefersReducedMotion) {
        const ctx = canvas.getContext('2d');
        const connectDistance = 110;
        const connectDistSq   = connectDistance * connectDistance;
        let W, H, particles = [];
        let running = false;
        let heroVisible = true;
        let rafId = null;

        const rand = (min, max) => Math.random() * (max - min) + min;

        const resize = () => {
            W = canvas.width  = canvas.offsetWidth;
            H = canvas.height = canvas.offsetHeight;
            const maxCount = W < 768 ? 35 : 70;
            const count = Math.min(Math.floor((W * H) / 14000), maxCount);
            particles = Array.from({ length: count }, () => ({
                x: rand(0, W), y: rand(0, H),
                r: rand(0.8, 2.4),
                vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3),
                alpha: rand(0.2, 0.6),
            }));
        };

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            for (const p of particles) {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
                if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(92,172,196,${p.alpha})`;
                ctx.fill();
            }

            ctx.lineWidth = 0.7;
            for (let i = 0; i < particles.length; i++) {
                const a = particles[i];
                for (let j = i + 1; j < particles.length; j++) {
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < connectDistSq) {
                        const dist = Math.sqrt(d2);
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(92,172,196,${0.12 * (1 - dist / connectDistance)})`;
                        ctx.stroke();
                    }
                }
            }
            rafId = requestAnimationFrame(draw);
        };

        const start = () => { if (!running) { running = true; draw(); } };
        const stop  = () => { running = false; cancelAnimationFrame(rafId); };
        const update = () => (heroVisible && !document.hidden) ? start() : stop();

        new IntersectionObserver(([entry]) => {
            heroVisible = entry.isIntersecting;
            update();
        }).observe(canvas);

        document.addEventListener('visibilitychange', update);

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resize, 200);
        }, { passive: true });

        resize();
        update();
    }

    // ─── Ripple on Buttons ──────────────────────────────────────────
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const rect   = this.getBoundingClientRect();
            const size   = Math.max(rect.width, rect.height);
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            Object.assign(ripple.style, {
                width: size + 'px', height: size + 'px',
                left: (e.clientX - rect.left - size / 2) + 'px',
                top:  (e.clientY - rect.top  - size / 2) + 'px',
            });
            this.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    });

    // ─── Scroll Reveal ([data-reveal] + stagger groups + cards) ────
    const revealOnce = (selector, className, threshold) => {
        const els = document.querySelectorAll(selector);
        if (!els.length) return;
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(className);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold });
        els.forEach(el => obs.observe(el));
    };

    revealOnce('[data-reveal]', 'revealed', 0.12);
    revealOnce('.gallery-bento, .faq-list, .footer-top, .about-features', 'revealed', 0.08);
    revealOnce('.service-card', 'visible', 0.1);

    // Gallery stagger delay (works for any number of photos)
    document.querySelectorAll('.gallery-bento .gal-item').forEach((item, i) => {
        item.style.setProperty('--gal-delay', `${Math.min(i * 0.05, 0.8)}s`);
    });

    // ─── FAQ Accordion ──────────────────────────────────────────────
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer   = item.querySelector('.faq-answer');

        const toggle = () => {
            const isOpen = item.classList.contains('active');
            faqItems.forEach(other => {
                other.classList.remove('active');
                other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                other.querySelector('.faq-answer').style.maxHeight = '';
            });
            if (!isOpen) {
                item.classList.add('active');
                question.setAttribute('aria-expanded', 'true');
                answer.style.maxHeight = `${answer.scrollHeight + 24}px`;
            }
        };
        question.addEventListener('click', toggle);
        question.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });
    });

    // ─── Lightbox (works with any [data-gallery] group) ─────────────
    const lightbox        = document.getElementById('lightbox');
    const lightboxImg     = document.getElementById('lightbox-img');
    const lightboxClose   = document.getElementById('lightbox-close');
    const lightboxPrev    = document.getElementById('lightbox-prev');
    const lightboxNext    = document.getElementById('lightbox-next');
    const lightboxCounter = document.getElementById('lightbox-counter');
    let group = [];
    let currentIndex = 0;
    let lastFocused = null;

    const showImage = (index) => {
        const el  = group[index];
        const img = el.querySelector('img');
        lightboxImg.src = el.dataset.full || img.src;
        lightboxImg.alt = img.alt;
        lightboxCounter.textContent = `${index + 1} / ${group.length}`;
        const single = group.length < 2;
        lightboxPrev.hidden = single;
        lightboxNext.hidden = single;
    };

    const openLightbox = (el) => {
        const container = el.closest('[data-gallery]');
        group = container ? [...container.querySelectorAll('[data-full]')] : [el];
        currentIndex = group.indexOf(el);
        lastFocused = el;
        showImage(currentIndex);
        lightbox.classList.add('active');
        lockScroll();
        lightboxClose.focus();
    };

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        unlockScroll();
        if (lastFocused) lastFocused.focus();
    };

    const navigate = (dir) => {
        if (group.length < 2) return;
        currentIndex = (currentIndex + dir + group.length) % group.length;
        lightboxImg.style.opacity = '0';
        setTimeout(() => {
            showImage(currentIndex);
            lightboxImg.style.opacity = '1';
        }, 180);
    };

    document.querySelectorAll('[data-gallery] [data-full]').forEach(el => {
        el.addEventListener('click', () => openLightbox(el));
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(el); }
        });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', () => navigate(-1));
    lightboxNext.addEventListener('click', () => navigate(1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) setMenu(false);
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape')     closeLightbox();
        if (e.key === 'ArrowLeft')  navigate(-1);
        if (e.key === 'ArrowRight') navigate(1);
    });

    // Touch swipe for lightbox
    let touchStartX = 0;
    lightbox.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) navigate(dx < 0 ? 1 : -1);
    });

    // ─── Scrollytelling ─────────────────────────────────────────────
    const scrollyImg     = document.getElementById('scrolly-img');
    const scrollyTag     = document.getElementById('scrolly-tag');
    const scrollyCounter = document.getElementById('scrolly-counter');
    const scrollyBar     = document.getElementById('scrolly-bar');
    const scrollySteps   = [...document.querySelectorAll('.scrolly-step')];
    const TOTAL          = scrollySteps.length;

    if (scrollyImg && TOTAL > 0) {
        let currentSrc = scrollyImg.getAttribute('src');
        const preloaded = new Set([currentSrc]);

        const preload = (src) => {
            if (!src || preloaded.has(src)) return;
            preloaded.add(src);
            new Image().src = src;
        };

        const swapImage = (step) => {
            const newSrc = step.dataset.img;
            const idx    = parseInt(step.dataset.idx, 10);

            scrollyCounter.textContent = `${String(idx).padStart(2, '0')} / ${String(TOTAL).padStart(2, '0')}`;
            scrollyBar.style.width = `${(idx / TOTAL) * 100}%`;
            scrollyTag.textContent = step.dataset.tag || '';
            const title = step.querySelector('h3');
            scrollyImg.alt = title ? title.textContent : 'Project image';

            // load the next one ahead of time so the swap is smooth
            const next = scrollySteps[idx];
            if (next) preload(next.dataset.img);

            if (newSrc === currentSrc) return;
            currentSrc = newSrc;

            scrollyImg.classList.add('fade-out');
            setTimeout(() => {
                scrollyImg.onload = () => scrollyImg.classList.remove('fade-out');
                scrollyImg.src = newSrc;
                if (scrollyImg.complete) scrollyImg.classList.remove('fade-out');
            }, 260);
        };

        swapImage(scrollySteps[0]);

        const mq = window.matchMedia('(max-width: 860px)');
        let stepObserver = null;

        const buildObserver = () => {
            if (stepObserver) stepObserver.disconnect();
            const options = mq.matches
                ? { threshold: 0.2, rootMargin: '-5% 0px -50% 0px' }    // mobile: image on top
                : { threshold: 0.5, rootMargin: '-10% 0px -40% 0px' };  // desktop: side by side
            stepObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        scrollySteps.forEach(s => s.classList.remove('active'));
                        entry.target.classList.add('active');
                        swapImage(entry.target);
                    }
                });
            }, options);
            scrollySteps.forEach(step => stepObserver.observe(step));
        };

        buildObserver();
        // Rebuild the observer when crossing the breakpoint (no page reload)
        mq.addEventListener('change', buildObserver);
    }
});
