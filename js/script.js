/* =========================================================
   Aashirbad Foundation - Front-end interactions
   Handles navigation, animations, form helpers, and donation UI
   ========================================================= */
const App = (() => {
    const selectors = {
        navToggle: '.nav-toggle',
        navLinks: '#primary-navigation',
        fadeElements: '.fade-in',
        smoothScrollLinks: 'a[href^="#"]',
        amountButtons: '.amount',
        frequencyButtons: '.toggle-group .toggle',
        amountInput: '#donor-amount',
        frequencyInput: '#donation-frequency',
        purposeButtons: '.donation-choice',
        purposeInput: '#donation-purpose',
        forms: 'form[data-feedback]',
        testimonialSlider: '.testimonial-slider',
        quoteRotator: '.quote-rotator'
    };
    let autoplayTimers = [];

    const setupSlider = (root, options) => {
        const {
            slideSelector,
            dotSelector,
            prevSelector,
            nextSelector,
            autoplayMs = 6500
        } = options;

        const slides = Array.from(root.querySelectorAll(slideSelector));
        if (!slides.length) return;

        const dots = dotSelector ? Array.from(root.querySelectorAll(dotSelector)) : [];
        const prev = prevSelector ? root.querySelector(prevSelector) : null;
        const next = nextSelector ? root.querySelector(nextSelector) : null;
        let current = 0;
        let timer;
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const prefersReducedMotion = () => motionQuery.matches;

        const showSlide = (index) => {
            current = (index + slides.length) % slides.length;
            slides.forEach((slide, idx) => {
                slide.classList.toggle('active', idx === current);
                const dot = dots[idx];
                if (dot) {
                    dot.classList.toggle('active', idx === current);
                    dot.setAttribute('aria-current', idx === current ? 'true' : 'false');
                }
            });
        };

        const startAutoplay = () => {
            if (prefersReducedMotion()) return;
            if (timer || !autoplayMs || slides.length <= 1) return;
            if (autoplayMs && slides.length > 1) {
                timer = window.setInterval(() => showSlide(current + 1), autoplayMs);
                autoplayTimers.push(timer);
            }
        };

        const stopAutoplay = () => {
            if (timer) {
                window.clearInterval(timer);
                autoplayTimers = autoplayTimers.filter((id) => id !== timer);
                timer = undefined;
            }
        };

        prev?.addEventListener('click', () => {
            stopAutoplay();
            showSlide(current - 1);
            startAutoplay();
        });
        next?.addEventListener('click', () => {
            stopAutoplay();
            showSlide(current + 1);
            startAutoplay();
        });
        dots.forEach((dot, idx) => {
            dot.addEventListener('click', () => {
                stopAutoplay();
                showSlide(idx);
                startAutoplay();
            });
        });

        root.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                stopAutoplay();
                showSlide(current - 1);
                startAutoplay();
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                stopAutoplay();
                showSlide(current + 1);
                startAutoplay();
            }
        });

        root.addEventListener('mouseenter', stopAutoplay);
        root.addEventListener('focusin', stopAutoplay);
        root.addEventListener('mouseleave', startAutoplay);
        root.addEventListener('focusout', startAutoplay);

        showSlide(0);
        startAutoplay();

        motionQuery.addEventListener('change', () => {
            stopAutoplay();
            startAutoplay();
        });
    };

    const initNav = () => {
        const toggle = document.querySelector(selectors.navToggle);
        const navLinks = document.querySelector(selectors.navLinks);
        if (!toggle || !navLinks) return;

        toggle.addEventListener('click', () => {
            const expanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', (!expanded).toString());
            navLinks.classList.toggle('open');
        });

        navLinks.addEventListener('click', (event) => {
            if (event.target instanceof HTMLAnchorElement) {
                navLinks.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });

        setActiveNav();
    };

    const setActiveNav = () => {
        const navLinks = document.querySelectorAll('#primary-navigation a');
        if (!navLinks.length) return;
        const current = window.location.pathname.split('/').pop() || 'index.html';
        navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            const isHome = href === 'index.html' && (current === '' || current === 'index.html');
            if (href === current || isHome) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
            }
        });
    };

    const initFadeIn = () => {
        const fadeEls = document.querySelectorAll(selectors.fadeElements);
        if (!fadeEls.length) return;
        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.2 }
        );
        fadeEls.forEach((el) => observer.observe(el));
    };

    const initSmoothScroll = () => {
        document.querySelectorAll(selectors.smoothScrollLinks).forEach((anchor) => {
            anchor.addEventListener('click', (event) => {
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    event.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    };

    const initDonationForm = () => {
        const amountButtons = document.querySelectorAll(selectors.amountButtons);
        const amountInput = document.querySelector(selectors.amountInput);
        const frequencyButtons = document.querySelectorAll(selectors.frequencyButtons);
        const frequencyInput = document.querySelector(selectors.frequencyInput);
        const purposeButtons = document.querySelectorAll(selectors.purposeButtons);
        const purposeInput = document.querySelector(selectors.purposeInput);
        if (!amountInput) return;

        purposeButtons.forEach((button) => {
            button.addEventListener('click', () => {
                purposeButtons.forEach((btn) => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                });
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
                if (purposeInput) {
                    purposeInput.value = button.getAttribute('data-purpose') || button.textContent.trim();
                }
                const suggestedAmount = button.getAttribute('data-amount');
                if (suggestedAmount && amountInput) {
                    amountInput.value = suggestedAmount;
                    amountButtons.forEach((btn) => {
                        const isMatch = btn.getAttribute('data-amount') === suggestedAmount;
                        btn.classList.toggle('active', isMatch);
                        btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
                    });
                }
                const suggestedFrequency = button.getAttribute('data-frequency');
                if (suggestedFrequency && frequencyButtons.length && frequencyInput) {
                    frequencyButtons.forEach((freqBtn) => {
                        const isActive =
                            freqBtn.getAttribute('data-frequency') === suggestedFrequency;
                        freqBtn.classList.toggle('active', isActive);
                        freqBtn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                    });
                    frequencyInput.value = suggestedFrequency;
                }
            });
        });

        amountButtons.forEach((button) => {
            button.addEventListener('click', () => {
                amountButtons.forEach((btn) => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                });
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
                amountInput.value = button.getAttribute('data-amount') || amountInput.value;
            });
        });

        frequencyButtons.forEach((button) => {
            button.addEventListener('click', () => {
                frequencyButtons.forEach((btn) => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                });
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
                if (frequencyInput) {
                    frequencyInput.value = button.getAttribute('data-frequency') || 'once';
                }
            });
        });
    };

    const initForms = () => {
        const forms = document.querySelectorAll(selectors.forms);
        if (!forms.length) return;

        forms.forEach((form) => {
            const requiredFields = Array.from(form.querySelectorAll('[required]'));
            requiredFields.forEach((field) => {
                field.addEventListener('input', () => {
                    if (
                        (field instanceof HTMLInputElement ||
                            field instanceof HTMLTextAreaElement) &&
                        field.value.trim()
                    ) {
                        field.classList.remove('invalid');
                        field.removeAttribute('aria-invalid');
                    }
                });
            });

            form.addEventListener('submit', (event) => {
                const isExternal = form.hasAttribute('data-external');
                const feedback = form.querySelector('.form-feedback');
                const setFeedback = (message) => {
                    if (feedback) {
                        feedback.textContent = message;
                    }
                };

                const invalid = requiredFields.some((field) => {
                    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
                        if (!field.value.trim()) {
                            field.classList.add('invalid');
                            field.setAttribute('aria-invalid', 'true');
                            return true;
                        }
                        field.classList.remove('invalid');
                        field.removeAttribute('aria-invalid');
                    }
                    return false;
                });
                if (invalid) {
                    event.preventDefault();
                    setFeedback('Please complete the required fields.');
                    return;
                }

                if (isExternal) {
                    setFeedback('Submitting…');
                    return;
                }

                event.preventDefault();
                const message = form.getAttribute('data-feedback') || 'Thank you!';
                setFeedback(
                    `${message} \nEmail us any time at info@aashirbadfoundation.org.`
                );
                form.reset();
                const amountButtons = form.querySelectorAll('.amount');
                amountButtons.forEach((btn) => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                });
                const toggles = form.querySelectorAll('.toggle');
                toggles.forEach((btn, index) => {
                    const isActive = index === 0;
                    btn.classList.toggle('active', isActive);
                    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                });
                const freqInput = form.querySelector('#donation-frequency');
                if (freqInput && toggles.length) {
                    freqInput.value = toggles[0].getAttribute('data-frequency') || 'once';
                }
            });
        });
    };

    const initTestimonialSlider = () => {
        const slider = document.querySelector(selectors.testimonialSlider);
        if (slider) {
            setupSlider(slider, {
                slideSelector: '.testimonial-slide',
                dotSelector: '.slider-dot',
                prevSelector: '.prev',
                nextSelector: '.next',
                autoplayMs: 6500
            });
        }

        const rotators = document.querySelectorAll(selectors.quoteRotator);
        rotators.forEach((rotator) =>
            setupSlider(rotator, {
                slideSelector: '.quote-slide',
                dotSelector: '.rotator-dot',
                autoplayMs: 7000
            })
        );
    };

    const setDynamicYear = () => {
        const yearTarget = document.getElementById('year');
        if (yearTarget) {
            yearTarget.textContent = new Date().getFullYear().toString();
        }
    };

    const init = () => {
        setDynamicYear();
        initNav();
        initFadeIn();
        initSmoothScroll();
        initDonationForm();
        initForms();
        initTestimonialSlider();
    };

    return { init };
})();

window.addEventListener('DOMContentLoaded', App.init);
