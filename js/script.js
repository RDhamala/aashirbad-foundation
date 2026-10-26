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
        obfuscatedEmails: '[data-email-user][data-email-domain]'
    };

    const prefersReducedMotion = () =>
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const initNav = () => {
        const toggle = document.querySelector(selectors.navToggle);
        const navLinks = document.querySelector(selectors.navLinks);
        if (!toggle || !navLinks) return;

        const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
        // Keep the visible state, aria-expanded, and the accessible name in
        // step. The label used to stay "Open navigation" while the menu was open.
        const setOpen = (open) => {
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
            navLinks.classList.toggle('open', open);
        };

        toggle.addEventListener('click', () => {
            setOpen(!isOpen());
        });

        navLinks.addEventListener('click', (event) => {
            if (event.target instanceof HTMLAnchorElement) {
                setOpen(false);
            }
        });

        // Escape closes the menu and returns focus to the toggle.
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && isOpen()) {
                setOpen(false);
                toggle.focus();
            }
        });

        // A click anywhere outside the open menu closes it.
        document.addEventListener('click', (event) => {
            if (!isOpen()) return;
            const target = event.target;
            if (target instanceof Node && !navLinks.contains(target) && !toggle.contains(target)) {
                setOpen(false);
            }
        });

        setActiveNav();
    };

    const setActiveNav = () => {
        const navLinks = document.querySelectorAll('#primary-navigation a');
        if (!navLinks.length) return;
        // Nav hrefs are clean paths ("/", "/about"). Compare normalised paths so
        // this keeps working whether the URL arrives as /about, /about.html, or
        // with a trailing slash.
        const normalise = (value) =>
            '/' + (value || '')
                .replace(/^.*?:\/\/[^/]+/, '')
                .replace(/[?#].*$/, '')
                .replace(/\.html$/, '')
                .replace(/^\/+|\/+$/g, '');
        const current = normalise(window.location.pathname);
        navLinks.forEach((link) => {
            const href = normalise(link.getAttribute('href'));
            const isHome = href === '/' && (current === '/' || current === '/index');
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
        // Without IntersectionObserver the elements would stay at opacity 0.
        if (!('IntersectionObserver' in window)) {
            fadeEls.forEach((el) => el.classList.add('visible'));
            return;
        }
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
                const href = anchor.getAttribute('href');
                if (!href || href === '#') return;
                let target = null;
                try {
                    target = document.querySelector(href);
                } catch {
                    return;
                }
                if (!target) return;
                event.preventDefault();
                target.scrollIntoView({
                    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                    block: 'start'
                });
                // Move focus with the scroll so keyboard and screen reader users
                // land where sighted users do. This is what makes the skip link
                // actually skip.
                const focusable = /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(target.tagName);
                if (!focusable && !target.hasAttribute('tabindex')) {
                    target.setAttribute('tabindex', '-1');
                }
                target.focus({ preventScroll: true });
                if (window.history && typeof window.history.pushState === 'function') {
                    window.history.pushState(null, '', href);
                }
            });
        });
    };

    const resetFrequency = (frequencyButtons, frequencyInput) => {
        frequencyButtons.forEach((btn, index) => {
            const isActive = index === 0;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        if (frequencyInput && frequencyButtons.length) {
            frequencyInput.value = frequencyButtons[0].getAttribute('data-frequency') || 'once';
        }
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
            // Simple bot traps: hidden honeypot + time-to-submit guard
            if (!form.dataset.startTime) {
                form.dataset.startTime = String(Date.now());
            }
            if (!form.querySelector('[data-trap="true"]')) {
                const honeypot = document.createElement('input');
                honeypot.type = 'text';
                honeypot.name = 'company';
                honeypot.tabIndex = -1;
                honeypot.autocomplete = 'off';
                honeypot.setAttribute('aria-hidden', 'true');
                honeypot.dataset.trap = 'true';
                honeypot.hidden = true;
                form.appendChild(honeypot);
            }
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
                const setFeedback = (message, type = 'info') => {
                    if (feedback) {
                        feedback.textContent = message;
                        feedback.classList.remove('success', 'error', 'info', 'visible');
                        if (message && message.trim()) {
                            feedback.classList.add('visible', type);
                        }
                    }
                };

                // filter, not some: some() short-circuits on the first empty
                // field, so only that one got marked and the rest of the
                // missing fields stayed unstyled.
                const missing = requiredFields.filter((field) => {
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
                if (missing.length) {
                    event.preventDefault();
                    setFeedback('Please complete the required fields.', 'error');
                    missing[0].focus();
                    return;
                }

                event.preventDefault();

                const trapField = form.querySelector('[data-trap="true"]');
                if (trapField instanceof HTMLInputElement && trapField.value.trim()) {
                    setFeedback('Please verify you are human.', 'error');
                    return;
                }

                const startedAt = Number(form.dataset.startTime || Date.now());
                const elapsedMs = Date.now() - startedAt;
                const tooFast = elapsedMs < 1200;
                if (tooFast) {
                    setFeedback('Please take a moment before submitting.', 'error');
                    form.dataset.startTime = String(Date.now());
                    return;
                }

                const formData = new FormData(form);
                formData.append('_elapsed_ms', String(elapsedMs));
                formData.append('_page_path', window.location.pathname);

                const handleSuccess = () => {
                    const message = form.getAttribute('data-feedback') || 'Thank you!';
                    setFeedback(
                        `${message} \nEmail us any time at info@aashirbadfoundation.org.`
                    , 'success');
                    form.reset();
                    form.dataset.startTime = String(Date.now());
                    // form.reset() puts the hidden frequency input back to "once"
                    // but leaves the toggle buttons showing the old choice.
                    // Reset both so the form and what it displays agree.
                    const amountButtons = form.querySelectorAll('.amount');
                    amountButtons.forEach((btn) => {
                        btn.classList.remove('active');
                        btn.setAttribute('aria-pressed', 'false');
                    });
                    resetFrequency(
                        form.querySelectorAll('.toggle'),
                        form.querySelector('#donation-frequency')
                    );
                };

                if (isExternal) {
                    setFeedback('Submitting…', 'info');
                    fetch(form.action, {
                        method: form.method || 'POST',
                        body: formData,
                        headers: { Accept: 'application/json' }
                    })
                        .then((response) => {
                            if (response.ok) {
                                handleSuccess();
                            } else {
                                setFeedback(
                                    'There was an issue submitting. Please email us instead.',
                                    'error'
                                );
                            }
                        })
                        .catch(() => {
                            setFeedback(
                                'There was an issue submitting. Please email us instead.',
                                'error'
                            );
                        });
                    return;
                }

                handleSuccess();
            });
        });
    };

    const setDynamicYear = () => {
        const yearTarget = document.getElementById('year');
        if (yearTarget) {
            yearTarget.textContent = new Date().getFullYear().toString();
        }
    };

    const initObfuscatedEmails = () => {
        const blocks = document.querySelectorAll(selectors.obfuscatedEmails);
        if (!blocks.length) return;

        blocks.forEach((block) => {
            let user = block.getAttribute('data-email-user') || '';
            let domain = block.getAttribute('data-email-domain') || '';
            const reversed = block.getAttribute('data-reversed') === 'true';
            if (reversed) {
                user = user.split('').reverse().join('');
                domain = domain.split('').reverse().join('');
            }
            if (!user || !domain) return;
            const email = `${user}@${domain}`;

            const display = block.querySelector('[data-email-display]');
            const link = block.querySelector('[data-email-link]');
            const status = block.querySelector('[data-email-status]');
            const copyBtn = block.querySelector('[data-email-copy]');

            const setStatus = (message) => {
                if (!status) return;
                status.textContent = message;
                status.classList.toggle('visible', Boolean(message));
            };

            if (link) {
                link.setAttribute('href', `mailto:${email}`);
                link.textContent = email;
            }

            if (copyBtn) {
                copyBtn.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText(email);
                        setStatus('Email copied');
                        copyBtn.textContent = 'Copied';
                        window.setTimeout(() => {
                            copyBtn.textContent = 'Copy';
                            setStatus('');
                        }, 2000);
                    } catch {
                        setStatus('Copy unavailable. Use info@aashirbadfoundation.org');
                    }
                });
            }

            const revealBtn = block.querySelector('[data-email-reveal]');
            if (revealBtn) {
                revealBtn.addEventListener('click', () => {
                    if (display) {
                        display.innerHTML = `<a href="mailto:${email}">${email}</a>`;
                        display.classList.add('visible');
                    }
                    revealBtn.style.display = 'none';
                });
            }
        });
    };

    const init = () => {
        setDynamicYear();
        initNav();
        initFadeIn();
        initSmoothScroll();
        initDonationForm();
        initForms();
        initObfuscatedEmails();
    };

    return { init };
})();

window.addEventListener('DOMContentLoaded', App.init);
