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
        forms: 'form[data-feedback]'
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
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
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
        if (!amountInput) return;

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
                    if ((field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) && field.value.trim()) {
                        field.classList.remove('invalid');
                        field.removeAttribute('aria-invalid');
                    }
                });
            });

            form.addEventListener('submit', (event) => {
                event.preventDefault();
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
                    const feedback = form.querySelector('.form-feedback');
                    if (feedback) {
                        feedback.textContent = 'Please complete the required fields.';
                    }
                    return;
                }

                const feedback = form.querySelector('.form-feedback');
                if (feedback) {
                    feedback.textContent = form.getAttribute('data-feedback') || 'Thank you!';
                }
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
    };

    return { init };
})();

const loadPartials = () => {
    const targets = document.querySelectorAll('[data-include]');
    if (!targets.length) {
        return Promise.resolve();
    }

    const loads = Array.from(targets).map((node) => {
        const file = node.getAttribute('data-include');
        return fetch(file)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${file}`);
                }
                return response.text();
            })
            .then((html) => {
                node.outerHTML = html;
            })
            .catch((error) => console.error(error));
    });

    return Promise.all(loads);
};

window.addEventListener('DOMContentLoaded', () => {
    loadPartials().then(App.init).catch((error) => {
        console.error(error);
        App.init();
    });
});
