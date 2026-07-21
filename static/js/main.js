/**
 * main.js — Interactive behaviors for the Collab-REC project website
 * Handles: navbar toggle, scroll-to-top, accordion, BibTeX copy
 */

(function () {
  'use strict';

  /* ---- 1. Navbar Mobile Toggle ---- */
  const navToggle = document.getElementById('nav-toggle');
  const navLinks  = document.getElementById('nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- 2. Scroll-to-Top Button ---- */
  const scrollTopBtn = document.getElementById('scroll-top');

  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      const visible = window.scrollY > 400;
      scrollTopBtn.classList.toggle('is-visible', visible);
    }, { passive: true });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- 3. Accordion ---- */
  document.querySelectorAll('.accordion__trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion__item');
      const isOpen = item.classList.contains('is-open');

      // Close all siblings
      trigger.closest('.accordion').querySelectorAll('.accordion__item').forEach(el => {
        el.classList.remove('is-open');
        el.querySelector('.accordion__trigger').setAttribute('aria-expanded', 'false');
      });

      // Toggle current
      if (!isOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---- 4. BibTeX Copy Button ---- */
  const copyBtn = document.getElementById('copy-bibtex');

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const bibtexContent = document.getElementById('bibtex-content');
      if (!bibtexContent) return;

      const text = bibtexContent.textContent.trim();
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = '✓ Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = 'Copy BibTeX';
          copyBtn.classList.remove('copied');
        }, 2500);
      }).catch(() => {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        copyBtn.textContent = '✓ Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = 'Copy BibTeX';
          copyBtn.classList.remove('copied');
        }, 2500);
      });
    });
  }

  /* ---- 5. Smooth active nav highlighting on scroll ---- */
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.navbar__links a[href^="#"]');

  if (sections.length && navAnchors.length) {
    const observerOptions = {
      rootMargin: '-40% 0px -55% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navAnchors.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, observerOptions);

    sections.forEach(s => observer.observe(s));
  }

  /* ---- 6. Plot tab switcher (model tabs in Results) ---- */
  document.querySelectorAll('.plot-tabs').forEach(tabGroup => {
    tabGroup.querySelectorAll('.plot-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        // Deactivate all tabs in this group
        tabGroup.querySelectorAll('.plot-tab').forEach(t => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });

        // Activate clicked tab
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');

        // Find the sibling .plot-panels and switch panels
        const panelsContainer = tabGroup.nextElementSibling;
        if (!panelsContainer || !panelsContainer.classList.contains('plot-panels')) return;

        const targetId = tab.getAttribute('aria-controls');
        panelsContainer.querySelectorAll('.plot-panel').forEach(panel => {
          panel.classList.toggle('is-active', panel.id === targetId);
        });
      });
    });
  });

})();

