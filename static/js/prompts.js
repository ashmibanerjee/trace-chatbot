// Dynamically load prompt files from static/prompts and render cards
document.addEventListener('DOMContentLoaded', async function () {
  // List of prompt files to load from static/prompts/ (kept in sync with repo)
  const promptFiles = [
    'rec_base.jinja2',
    'rec_with_context.jinja2',
    'intent_classification.jinja2',
    'rec_baseline.jinja2',
    'cqs_variant1.jinja2',
    'cfe_combination.jinja2'
  ];

  // Short descriptions for each prompt file (shown in the card meta)
  const descriptions = {
    'rec_base.jinja2': 'Base template: core rules and strict output format used by recommendation agents.',
    'rec_with_context.jinja2': 'Context-aware recommendation prompt with sustainability decision criteria and explanation constraints.',
    'intent_classification.jinja2': 'Builds the user travel persona, intent, and ability to compromise from user input.',
    'rec_baseline.jinja2': 'Simple baseline recommendation prompt that extends the base template.',
    'cqs_variant1.jinja2': 'Clarifying questions and sustainability probes to infer locked vs. flexible preferences.',
    'cfe_combination.jinja2': 'Explanation Generator: produces final recommendation and alternative explanations.'
  };

  // Friendly titles for display (used as the card heading instead of raw filename)
  const titles = {
    'rec_base.jinja2': 'Recommender (Base Template)',
    'rec_with_context.jinja2': 'Context-Aware Recommender',
    'intent_classification.jinja2': 'Intent Classifier',
    'rec_baseline.jinja2': 'Recommender — Baseline',
    'cqs_variant1.jinja2': 'Clarifying Questions',
    'cfe_combination.jinja2': 'Explanation Generator'
  };

  const grid = document.getElementById('prompts-grid');
  if (!grid) return;

  // Helper to create safe element IDs from filenames
  const makeId = (name) => 'p_' + name.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').toLowerCase();

  // Fetch each file and render a card
  for (const fileName of promptFiles) {
    const url = `./static/prompts/${fileName}`;

    // Create card skeleton
    const card = document.createElement('div');
    card.className = 'prompt-card';

    const header = document.createElement('div');
    header.className = 'prompt-header';

    const titleWrap = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'prompt-title';
    // Use friendly title when available
    title.textContent = titles[fileName] || fileName;
    const meta = document.createElement('div');
    meta.className = 'prompt-meta';
    // Use the short description if available, otherwise a generic label
    meta.textContent = descriptions[fileName] || 'Prompt template';
    titleWrap.appendChild(title);
    titleWrap.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'prompt-actions';
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'button toggle-btn prompt-toggle';
    toggleBtn.setAttribute('aria-expanded', 'false');
    const idBase = makeId(fileName);
    const wrapperId = idBase + '_wrapper';
    toggleBtn.setAttribute('aria-controls', wrapperId);
    toggleBtn.textContent = 'View';
    actions.appendChild(toggleBtn);

    header.appendChild(titleWrap);
    header.appendChild(actions);
    card.appendChild(header);

    // Preview (short excerpt)
    const preview = document.createElement('div');
    preview.className = 'prompt-preview';
    preview.textContent = 'Loading…';
    card.appendChild(preview);

    // Code wrapper (initially hidden)
    const wrapper = document.createElement('div');
    wrapper.className = 'prompt-code-wrapper';
    wrapper.id = wrapperId;
    wrapper.setAttribute('aria-hidden', 'true');

    const pre = document.createElement('pre');
    const codeId = idBase + '_code';
    pre.className = 'prompt-code';
    pre.id = codeId;
    pre.setAttribute('tabindex', '-1');
    pre.textContent = '';

    wrapper.appendChild(pre);

    const wrapperActions = document.createElement('div');
    wrapperActions.className = 'prompt-actions';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'button copy-btn';
    copyBtn.setAttribute('data-target', codeId);
    copyBtn.textContent = 'Copy';
    wrapperActions.appendChild(copyBtn);
    wrapper.appendChild(wrapperActions);

    const status = document.createElement('div');
    status.className = 'prompts-status';
    status.setAttribute('aria-live', 'polite');
    wrapper.appendChild(status);

    card.appendChild(wrapper);

    grid.appendChild(card);

    // Fetch file content and populate preview + pre
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
      const text = await resp.text();
      // Preview: first 6 lines or first 400 chars
      const lines = text.split(/\r?\n/).slice(0, 6).join('\n');
      const previewText = lines.length > 0 ? lines : text.slice(0, 400);
      preview.textContent = previewText + (text.length > previewText.length ? '\n…' : '');
      pre.textContent = text;
    } catch (err) {
      preview.textContent = 'Failed to load prompt: ' + String(err);
      pre.textContent = '';
      status.textContent = 'Error loading file';
      console.error('Error loading prompt', fileName, err);
    }
  }

  // After building all cards, attach behaviour using event delegation
  // Helper to update the grid when any cards are expanded
  function updateGridExpandedState() {
    const anyExpanded = grid.querySelectorAll('.prompt-code-wrapper.expanded').length > 0;
    if (anyExpanded) grid.classList.add('has-expanded'); else grid.classList.remove('has-expanded');
  }

  // Toggle expand/collapse and copy handling
  grid.addEventListener('click', function (e) {
    const t = e.target;

    // Toggle button
    if (t.classList && t.classList.contains('prompt-toggle')) {
      const btn = t;
      const wrapper = document.getElementById(btn.getAttribute('aria-controls'));
      const card = btn.closest('.prompt-card');
      const preview = card.querySelector('.prompt-preview');
      const codeEl = card.querySelector('.prompt-code');
      const expanded = btn.getAttribute('aria-expanded') === 'true';

      // Update aria and visuals
      btn.setAttribute('aria-expanded', String(!expanded));
      if (!expanded) {
        if (preview) preview.classList.add('collapsed');
        wrapper.classList.add('expanded');
        wrapper.setAttribute('aria-hidden', 'false');
        btn.textContent = 'Collapse';
        if (codeEl) setTimeout(() => { codeEl.focus(); }, 120);
      } else {
        if (preview) preview.classList.remove('collapsed');
        wrapper.classList.remove('expanded');
        wrapper.setAttribute('aria-hidden', 'true');
        btn.textContent = 'View';
      }

      updateGridExpandedState();
      return;
    }

    // Copy button
    if (t.classList && t.classList.contains('copy-btn')) {
      const btn = t;
      const targetId = btn.getAttribute('data-target');
      const codeEl = document.getElementById(targetId);
      if (!codeEl) return;
      const text = codeEl.textContent;
      navigator.clipboard.writeText(text).then(() => {
        const statusEl = btn.closest('.prompt-card').querySelector('.prompts-status');
        if (statusEl) {
          statusEl.textContent = 'Copied to clipboard ✓';
          setTimeout(() => { statusEl.textContent = ''; }, 2200);
        }
      }).catch((err) => {
        console.error('Copy failed', err);
        const statusEl = btn.closest('.prompt-card').querySelector('.prompts-status');
        if (statusEl) {
          statusEl.textContent = 'Copy failed';
          setTimeout(() => { statusEl.textContent = ''; }, 2200);
        }
      });
      return;
    }
  });

  // Keyboard handling: Escape to collapse when focus is in a .prompt-code
  grid.addEventListener('keydown', function (e) {
    const el = e.target;
    if (e.key === 'Escape' && el.classList && el.classList.contains('prompt-code')) {
      const wrapper = el.closest('.prompt-code-wrapper');
      const card = wrapper.closest('.prompt-card');
      const toggle = card.querySelector('.prompt-toggle');
      const preview = card.querySelector('.prompt-preview');

      wrapper.classList.remove('expanded');
      wrapper.setAttribute('aria-hidden', 'true');
      if (preview) preview.classList.remove('collapsed');
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'View';
        toggle.focus();
      }

      updateGridExpandedState();
    }
  });

});

