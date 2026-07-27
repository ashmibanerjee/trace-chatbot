/**
 * prompts.js — Dynamically load, render, and filter prompt cards.
 */
(function () {
  'use strict';

  /* ─── Prompt Metadata ─────────────────────────────────────────────────── */
  const PROMPTS = [
    {
      file:        'intent_classification.jinja2',
      title:       'Intent Classifier',
      description: 'Builds the user travel persona, intent, and ability to compromise from the user\'s query and clarifying answers.',
      category:    'intent',
      icon:        'fa-user-circle',
      accent:      'hsl(280, 60%, 52%)',
      accentBg:    'hsl(280, 70%, 93%)',
    },
    {
      file:        'cqs_variant1.jinja2',
      title:       'Clarifying Questions',
      description: 'Probes locked vs. flexible sustainability preferences; ensures every valid request gets at least one trade-off question.',
      category:    'clarification',
      icon:        'fa-comments',
      accent:      'hsl(204, 86%, 45%)',
      accentBg:    'hsl(204, 86%, 94%)',
    },
    {
      file:        'rec_base.jinja2',
      title:       'Recommender — Base Template',
      description: 'Shared foundation: strict output format, core rules, and prohibited outputs used by all recommendation agents.',
      category:    'recommender',
      icon:        'fa-layer-group',
      accent:      'hsl(35, 90%, 45%)',
      accentBg:    'hsl(35, 90%, 93%)',
    },
    {
      file:        'rec_baseline.jinja2',
      title:       'Recommender — Baseline',
      description: 'Simple baseline prompt that extends the base template to generate a destination recommendation from the user\'s query.',
      category:    'recommender',
      icon:        'fa-map-pin',
      accent:      'hsl(35, 90%, 45%)',
      accentBg:    'hsl(35, 90%, 93%)',
    },
    {
      file:        'rec_with_context.jinja2',
      title:       'Context-Aware Recommender',
      description: 'Sustainability-first recommendation prompt with strict decision criteria, explanation constraints, and trade-off handling.',
      category:    'recommender',
      icon:        'fa-leaf',
      accent:      'hsl(142, 60%, 40%)',
      accentBg:    'hsl(142, 60%, 92%)',
    },
    {
      file:        'cfe_combination.jinja2',
      title:       'Explanation Generator',
      description: 'Produces the final recommendation and a counterfactual alternative; respects the user\'s inferred sustainability stance.',
      category:    'explanation',
      icon:        'fa-code-branch',
      accent:      'hsl(340, 82%, 52%)',
      accentBg:    'hsl(340, 82%, 94%)',
    },
  ];

  /* ─── DOM helper ──────────────────────────────────────────────────────── */
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (k === 'className') node.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else node.setAttribute(k, v);
      });
    }
    children.forEach((c) => {
      if (typeof c === 'string') node.appendChild(document.createTextNode(c));
      else if (c instanceof Node) node.appendChild(c);
    });
    return node;
  }

  /* ─── Card Builder ────────────────────────────────────────────────────── */
  function buildCard(prompt) {
    const idBase    = 'p_' + prompt.file.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    const wrapperId = idBase + '_wrapper';
    const codeId    = idBase + '_code';

    /* ── Icon ── */
    const iconEl = el('div', {
      className: 'prompt-icon',
      style: { background: prompt.accentBg, color: prompt.accent },
      'aria-hidden': 'true',
    });
    iconEl.innerHTML = `<i class="fas ${prompt.icon}"></i>`;

    /* ── Title + badge row ── */
    const titleEl = el('div', { className: 'prompt-title' }, prompt.title);

    const badgeEl = el('span', {
      className: 'prompt-badge',
      style: { background: prompt.accentBg, color: prompt.accent },
    }, prompt.category.charAt(0).toUpperCase() + prompt.category.slice(1));

    const titleRow = el('div', { className: 'prompt-title-row' }, titleEl, badgeEl);

    /* ── Description ── */
    const metaEl = el('div', { className: 'prompt-meta' }, prompt.description);

    const titleWrap = el('div', { className: 'prompt-title-wrap' }, titleRow, metaEl);

    /* ── Toggle button ── */
    const toggleBtn = el('button', {
      className:       'prompt-toggle-btn',
      'aria-expanded': 'false',
      'aria-controls': wrapperId,
    });
    toggleBtn.innerHTML =
      '<span class="toggle-label">View</span><i class="fas fa-chevron-down toggle-icon" aria-hidden="true"></i>';

    /* ── Header ── */
    const header = el('div', { className: 'prompt-card-header' }, iconEl, titleWrap, toggleBtn);

    /* ── Preview (first 7 lines) ── */
    const preview = el('pre', { className: 'prompt-preview' }, 'Loading…');

    /* ── Code block ── */
    const pre = el('pre', { className: 'prompt-code', id: codeId, tabindex: '-1' });

    /* ── Copy button + status ── */
    const copyBtn = el('button', {
      className:     'prompt-copy-btn',
      'data-target': codeId,
    });
    copyBtn.innerHTML = '<i class="fas fa-copy" aria-hidden="true"></i> Copy';

    const copyStatus = el('span', { className: 'prompt-copy-status', 'aria-live': 'polite' });
    const wrapperActions = el('div', { className: 'prompt-wrapper-actions' }, copyBtn, copyStatus);

    /* ── Inner div: SINGLE grid child so grid-template-rows animation works ── */
    const inner = el('div', { className: 'prompt-code-inner' }, pre, wrapperActions);

    /* ── Collapsible wrapper ── */
    const wrapper = el('div', {
      className:     'prompt-code-wrapper',
      id:            wrapperId,
      'aria-hidden': 'true',
    }, inner);

    /* ── Card (top-border accent via CSS var) ── */
    const card = el('div', {
      className:       'prompt-card',
      'data-category': prompt.category,
      'data-file':     prompt.file,
      style:           { '--prompt-accent': prompt.accent },
    }, header, preview, wrapper);

    return { card, preview, pre, toggleBtn, wrapper, copyBtn, copyStatus };
  }

  /* ─── Toggle ──────────────────────────────────────────────────────────── */
  function handleToggle(btn, wrapper, preview) {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    const label = btn.querySelector('.toggle-label');
    const icon  = btn.querySelector('.toggle-icon');
    if (!expanded) {
      preview.classList.add('is-collapsed');
      wrapper.classList.add('is-expanded');
      wrapper.setAttribute('aria-hidden', 'false');
      if (label) label.textContent = 'Collapse';
      if (icon)  icon.style.transform = 'rotate(180deg)';
    } else {
      preview.classList.remove('is-collapsed');
      wrapper.classList.remove('is-expanded');
      wrapper.setAttribute('aria-hidden', 'true');
      if (label) label.textContent = 'View';
      if (icon)  icon.style.transform = '';
    }
  }

  /* ─── Copy ────────────────────────────────────────────────────────────── */
  function handleCopy(btn, statusEl) {
    const codeEl = document.getElementById(btn.dataset.target);
    if (!codeEl) return;
    navigator.clipboard.writeText(codeEl.textContent).then(() => {
      btn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Copied!';
      if (statusEl) statusEl.textContent = '✓ Copied';
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-copy" aria-hidden="true"></i> Copy';
        if (statusEl) statusEl.textContent = '';
      }, 2000);
    }).catch(() => {
      if (statusEl) {
        statusEl.textContent = 'Copy failed';
        setTimeout(() => { statusEl.textContent = ''; }, 2000);
      }
    });
  }

  /* ─── Filter ──────────────────────────────────────────────────────────── */
  function applyFilter(grid, filter) {
    grid.querySelectorAll('.prompt-card').forEach((card) => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.style.display = show ? '' : 'none';
    });
  }

  /* ─── Init ────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', async function () {
    const grid = document.getElementById('prompts-grid');
    if (!grid) return;

    /* Build all card skeletons first */
    const cardRefs = PROMPTS.map((prompt) => {
      const refs = buildCard(prompt);
      grid.appendChild(refs.card);
      return { prompt, ...refs };
    });

    /* Fetch content in parallel */
    await Promise.all(cardRefs.map(async ({ prompt, preview, pre }) => {
      try {
        const resp = await fetch(`./static/prompts/${prompt.file}`);
        if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
        const text  = await resp.text();
        const lines = text.split(/\r?\n/);
        preview.textContent = lines.slice(0, 7).join('\n') + (lines.length > 7 ? '\n…' : '');
        pre.textContent     = text;
      } catch (err) {
        preview.textContent = 'Failed to load: ' + String(err);
        console.error('Prompt load error:', prompt.file, err);
      }
    }));

    /* Wire events */
    cardRefs.forEach(({ toggleBtn, wrapper, preview, copyBtn, copyStatus }) => {
      toggleBtn.addEventListener('click', () => handleToggle(toggleBtn, wrapper, preview));
      copyBtn.addEventListener('click',   () => handleCopy(copyBtn, copyStatus));
    });

    /* Escape to collapse */
    grid.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const codeEl = e.target.closest('.prompt-code');
      if (!codeEl) return;
      const wrapper  = codeEl.closest('.prompt-code-wrapper');
      const card     = wrapper && wrapper.closest('.prompt-card');
      const toggle   = card && card.querySelector('.prompt-toggle-btn');
      const preview  = card && card.querySelector('.prompt-preview');
      if (wrapper && toggle && preview) {
        handleToggle(toggle, wrapper, preview);
        toggle.focus();
      }
    });

    /* Filter tabs */
    document.querySelectorAll('.prompt-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.prompt-filter-btn').forEach((b) => {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
        applyFilter(grid, btn.dataset.filter);
      });
    });
  });

})();
