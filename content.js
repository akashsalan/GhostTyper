(() => {
  // Prevent double-injection
  if (window.__gt_loaded) return;
  window.__gt_loaded = true;

  // ═══════════════════════════════════════════
  //  STATE
  // ═══════════════════════════════════════════
  let panelVisible = false;
  let typingActive = false;
  let stopRequested = false;
  let panelEl = null;
  let shadowRoot = null;

  // ═══════════════════════════════════════════
  //  LISTEN FOR TOGGLE FROM BACKGROUND
  // ═══════════════════════════════════════════
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'TOGGLE_PANEL') togglePanel();
  });

  // ═══════════════════════════════════════════
  //  PANEL CREATION (Shadow DOM = invisible to page JS)
  // ═══════════════════════════════════════════
  function createPanel() {
    // Host element — generic div, no suspicious IDs
    panelEl = document.createElement('div');
    panelEl.style.cssText = 'all:initial; position:fixed; z-index:2147483647; top:0; right:0; bottom:0; left:0; pointer-events:none;';
    document.documentElement.appendChild(panelEl);

    // Shadow DOM — completely isolated, page cannot see inside
    shadowRoot = panelEl.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = getPanelCSS();
    shadowRoot.appendChild(style);

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = getPanelHTML();
    shadowRoot.appendChild(panel);

    // Wire up events
    wireEvents(panel);
    loadSettings(panel);
  }

  function getPanelHTML() {
    return `
      <div class="panel-header">
        <div class="panel-title">👻 Ghost Typer</div>
        <button class="close-btn" data-action="close">✕</button>
      </div>

      <div class="panel-body">
        <div class="field">
          <label>Code</label>
          <textarea data-id="code" placeholder="Paste your code here..." spellcheck="false"></textarea>
          <div class="char-info"><span data-id="chars">0</span> chars</div>
        </div>

        <div class="divider"></div>

        <div class="field">
          <label>Speed</label>
          <div class="slider-row">
            <input type="range" data-id="wpm" min="10" max="100" value="35" step="5">
            <span data-id="wpm-label" class="slider-val">35 WPM</span>
          </div>
        </div>

        <div class="field">
          <label>Typos</label>
          <select data-id="errors">
            <option value="none">No mistakes</option>
            <option value="rare">Rare</option>
            <option value="low" selected>Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div class="field">
          <label>Thinking Pauses</label>
          <select data-id="pauses">
            <option value="none">None</option>
            <option value="light">Light</option>
            <option value="natural" selected>Natural</option>
            <option value="heavy">Heavy (beginner)</option>
          </select>
        </div>

        <div class="field">
          <label>Line Break Delay</label>
          <select data-id="newline">
            <option value="short">Short</option>
            <option value="natural" selected>Natural</option>
            <option value="long">Long</option>
          </select>
        </div>

        <div class="toggle-field">
          <div>
            <label>Burst Typing</label>
            <div class="desc">Common words typed faster</div>
          </div>
          <label class="switch"><input type="checkbox" data-id="burst" checked><span class="track"></span></label>
        </div>

        <div class="toggle-field">
          <div>
            <label>Warmup</label>
            <div class="desc">Start slow, speed up gradually</div>
          </div>
          <label class="switch"><input type="checkbox" data-id="warmup" checked><span class="track"></span></label>
        </div>
      </div>

      <div class="panel-footer">
        <button class="btn-start" data-action="start">▶ Start Typing</button>
        <button class="btn-stop hidden" data-action="stop">■ Stop</button>
        <div class="hint">Press <kbd>Alt+G</kbd> to toggle · <kbd>Esc</kbd> to emergency stop</div>
      </div>
    `;
  }

  function getPanelCSS() {
    return `
      * { box-sizing: border-box; margin: 0; padding: 0; }

      .panel {
        position: fixed;
        top: 16px; right: 16px;
        width: 340px;
        max-height: calc(100vh - 32px);
        background: #0f1219;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 14px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        font-size: 13px;
        color: #e2e8f0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        pointer-events: auto;
        animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes slideIn {
        from { opacity: 0; transform: translateY(-12px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 16px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }

      .panel-title {
        font-weight: 700;
        font-size: 15px;
        background: linear-gradient(135deg, #a5b4fc, #c4b5fd);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .close-btn {
        background: none;
        border: none;
        color: #64748b;
        font-size: 16px;
        cursor: pointer;
        width: 28px; height: 28px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
      }
      .close-btn:hover { background: rgba(255,255,255,0.06); color: #e2e8f0; }

      .panel-body {
        padding: 12px 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: 400px;
      }

      .panel-body::-webkit-scrollbar { width: 3px; }
      .panel-body::-webkit-scrollbar-track { background: transparent; }
      .panel-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }

      .field { display: flex; flex-direction: column; gap: 5px; }

      label {
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }

      textarea {
        width: 100%;
        height: 100px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px;
        padding: 10px;
        color: #e2e8f0;
        font-family: 'Cascadia Code', 'Fira Code', 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.5;
        resize: none;
        outline: none;
        transition: border-color 0.2s;
      }
      textarea:focus { border-color: #6366f1; }
      textarea::placeholder { color: #334155; }

      .char-info { font-size: 11px; color: #475569; text-align: right; }

      .divider { height: 1px; background: rgba(255,255,255,0.05); }

      select {
        width: 100%;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px;
        padding: 8px 10px;
        color: #e2e8f0;
        font-size: 12px;
        cursor: pointer;
        outline: none;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2364748b'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 10px center;
      }
      select option { background: #1e293b; }
      select:focus { border-color: #6366f1; }

      .slider-row { display: flex; align-items: center; gap: 10px; }

      input[type="range"] {
        -webkit-appearance: none;
        flex: 1;
        height: 4px;
        border-radius: 4px;
        background: rgba(255,255,255,0.08);
        outline: none;
      }
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px; height: 16px;
        border-radius: 50%;
        background: #6366f1;
        cursor: pointer;
        box-shadow: 0 0 6px rgba(99,102,241,0.4);
      }

      .slider-val {
        font-size: 12px;
        font-weight: 600;
        color: #818cf8;
        min-width: 55px;
        text-align: right;
      }

      .toggle-field {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .desc { font-size: 11px; color: #475569; margin-top: 2px; font-weight: 400; text-transform: none; letter-spacing: 0; }

      .switch { position: relative; width: 34px; height: 18px; flex-shrink: 0; }
      .switch input { opacity: 0; width: 0; height: 0; position: absolute; }
      .track {
        position: absolute; cursor: pointer; inset: 0;
        background: rgba(255,255,255,0.08);
        border-radius: 18px;
        transition: background 0.2s;
      }
      .track::before {
        content: "";
        position: absolute; height: 12px; width: 12px;
        left: 3px; bottom: 3px;
        background: white; border-radius: 50%;
        transition: transform 0.2s;
      }
      .switch input:checked + .track { background: #6366f1; }
      .switch input:checked + .track::before { transform: translateX(16px); }

      .panel-footer {
        padding: 12px 16px;
        border-top: 1px solid rgba(255,255,255,0.06);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .btn-start {
        width: 100%;
        background: linear-gradient(135deg, #6366f1, #7c3aed);
        color: white; border: none; border-radius: 8px;
        padding: 11px; font-size: 13px; font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(99,102,241,0.3);
        transition: all 0.2s;
      }
      .btn-start:hover { filter: brightness(1.1); transform: translateY(-1px); }
      .btn-start:active { transform: translateY(1px); }

      .btn-stop {
        width: 100%;
        background: #dc2626;
        color: white; border: none; border-radius: 8px;
        padding: 11px; font-size: 13px; font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(220,38,38,0.3);
        transition: all 0.2s;
      }
      .btn-stop:hover { filter: brightness(1.15); }

      .hidden { display: none !important; }

      .hint {
        font-size: 11px;
        color: #475569;
        text-align: center;
      }

      kbd {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 3px;
        padding: 1px 5px;
        font-size: 10px;
      }
    `;
  }

  // ═══════════════════════════════════════════
  //  WIRE UI EVENTS
  // ═══════════════════════════════════════════
  function q(sel) { return shadowRoot.querySelector(`[data-id="${sel}"]`); }
  function qa(sel) { return shadowRoot.querySelector(`[data-action="${sel}"]`); }

  function wireEvents(panel) {
    // Close
    qa('close').addEventListener('click', () => togglePanel());

    // Char count
    q('code').addEventListener('input', () => {
      shadowRoot.querySelector('[data-id="chars"]').textContent = q('code').value.length;
      saveSettings();
    });

    // WPM slider
    q('wpm').addEventListener('input', () => {
      q('wpm-label').textContent = q('wpm').value + ' WPM';
      saveSettings();
    });

    // Save on any change
    ['errors', 'pauses', 'newline'].forEach(id => {
      q(id).addEventListener('change', saveSettings);
    });
    ['burst', 'warmup'].forEach(id => {
      q(id).addEventListener('change', saveSettings);
    });

    // Start
    qa('start').addEventListener('click', () => {
      const code = q('code').value;
      if (!code) return;

      const config = {
        code,
        wpm: parseInt(q('wpm').value),
        errorRate: q('errors').value,
        pauseLevel: q('pauses').value,
        newlineDelay: q('newline').value,
        burstTyping: q('burst').checked,
        warmupEffect: q('warmup').checked
      };

      // Hide panel, start typing
      hidePanel();
      stopRequested = false;
      typingActive = true;
      startTypingSequence(config);
    });

    // Stop
    qa('stop').addEventListener('click', () => {
      stopRequested = true;
    });
  }

  function saveSettings() {
    chrome.storage.local.set({
      _gt: {
        code: q('code').value,
        wpm: q('wpm').value,
        errors: q('errors').value,
        pauses: q('pauses').value,
        newline: q('newline').value,
        burst: q('burst').checked,
        warmup: q('warmup').checked
      }
    });
  }

  function loadSettings(panel) {
    chrome.storage.local.get('_gt', (r) => {
      const s = r._gt;
      if (!s) return;
      if (s.code)    { q('code').value = s.code; shadowRoot.querySelector('[data-id="chars"]').textContent = s.code.length; }
      if (s.wpm)     { q('wpm').value = s.wpm; q('wpm-label').textContent = s.wpm + ' WPM'; }
      if (s.errors)  q('errors').value = s.errors;
      if (s.pauses)  q('pauses').value = s.pauses;
      if (s.newline)  q('newline').value = s.newline;
      if (s.burst !== undefined)  q('burst').checked = s.burst;
      if (s.warmup !== undefined) q('warmup').checked = s.warmup;
    });
  }

  // ═══════════════════════════════════════════
  //  SHOW / HIDE PANEL
  // ═══════════════════════════════════════════
  function togglePanel() {
    if (panelVisible) {
      hidePanel();
    } else {
      showPanel();
    }
  }

  function showPanel() {
    if (!panelEl) createPanel();
    panelEl.style.display = '';
    panelVisible = true;

    // If typing is active, show stop button
    if (typingActive) {
      qa('start').classList.add('hidden');
      qa('stop').classList.remove('hidden');
    } else {
      qa('start').classList.remove('hidden');
      qa('stop').classList.add('hidden');
    }
  }

  function hidePanel() {
    if (panelEl) panelEl.style.display = 'none';
    panelVisible = false;
  }

  // ESC to stop typing (not toggle panel to avoid conflicts)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && typingActive) {
      stopRequested = true;
    }
  });

  // ═══════════════════════════════════════════
  //  TYPING ENGINE
  // ═══════════════════════════════════════════
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function wpmToBaseDelay(wpm) {
    return 60000 / (wpm * 5);
  }

  function getErrorProb(rate) {
    return { none: 0, rare: 0.005, low: 0.01, medium: 0.02, high: 0.04 }[rate] || 0.01;
  }

  function getPauseConfig(level) {
    const configs = {
      none:    { sC: 0,    bC: 0,    sM: 0,    bM: 0 },
      light:   { sC: 0.008, bC: 0.002, sM: 400,  bM: 1000 },
      natural: { sC: 0.02,  bC: 0.005, sM: 600,  bM: 2000 },
      heavy:   { sC: 0.04,  bC: 0.01,  sM: 1000, bM: 3500 }
    };
    return configs[level] || configs.natural;
  }

  function getNewlineDelay(level) {
    return { short: [100, 250], natural: [300, 700], long: [600, 1500] }[level] || [300, 700];
  }

  const nearbyKeys = {
    'a':'sq','b':'vn','c':'xv','d':'sf','e':'wr','f':'dg','g':'fh',
    'h':'gj','i':'uo','j':'hk','k':'jl','l':'k;','m':'n,','n':'bm',
    'o':'ip','p':'o[','q':'wa','r':'et','s':'ad','t':'ry','u':'yi',
    'v':'cb','w':'qe','x':'zc','y':'tu','z':'xa'
  };

  function getNearbyTypo(char) {
    const lower = char.toLowerCase();
    const nb = nearbyKeys[lower];
    if (nb) {
      const t = nb[Math.floor(Math.random() * nb.length)];
      return char === char.toUpperCase() ? t.toUpperCase() : t;
    }
    return 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  }

  const commonWords = ['the','int','var','let','const','for','if','else','return','function','class','import','from','def','print','console','log','true','false','null','void','string','public','private','static','new','this','self'];

  function isCommon(text, i) {
    for (const w of commonWords) {
      if (i >= w.length && text.substring(i - w.length, i).toLowerCase() === w) return true;
    }
    return false;
  }

  // ─── Floating banner (temporary) ───
  function showBanner(text, bg) {
    // Use inline style only so it leaves absolutely no trace
    let b = document.getElementById('__gt_b');
    if (!b) {
      b = document.createElement('div');
      b.id = '__gt_b';
      b.style.cssText = `position:fixed;top:16px;left:50%;transform:translateX(-50%);padding:10px 22px;border-radius:50px;font-family:system-ui,sans-serif;font-size:13px;font-weight:600;color:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.4);z-index:2147483647;pointer-events:none;transition:opacity 0.3s;`;
      document.body.appendChild(b);
    }
    b.textContent = text;
    b.style.background = bg || 'linear-gradient(135deg,#6366f1,#7c3aed)';
    b.style.opacity = '1';
  }

  function hideBanner() {
    const b = document.getElementById('__gt_b');
    if (b) { b.style.opacity = '0'; setTimeout(() => b.remove(), 300); }
  }

  // ─── MAIN ───
  async function startTypingSequence(config) {
    showBanner('Click the text box now! Starting in 3...', 'linear-gradient(135deg,#6366f1,#7c3aed)');

    for (let i = 3; i > 0; i--) {
      if (stopRequested) { hideBanner(); typingActive = false; return; }
      showBanner(`Click the text box now! Starting in ${i}...`);
      await sleep(1000);
    }

    showBanner('Typing...', '#10b981');
    await sleep(600);
    hideBanner();

    if (stopRequested) { typingActive = false; return; }

    await typeText(config);
    typingActive = false;
  }

  async function typeText(config) {
    const { code, wpm, errorRate, pauseLevel, newlineDelay, burstTyping, warmupEffect } = config;

    let el = document.activeElement;

    if (!el || el === document.body) {
      const targets = document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"], .docs-texteventtarget-iframe');
      if (targets.length > 0) { el = targets[0]; el.focus(); await sleep(100); }
      else { el = document.activeElement || document.body; }
    }

    const baseDelay = wpmToBaseDelay(wpm);
    const errProb = getErrorProb(errorRate);
    const pauses = getPauseConfig(pauseLevel);
    const [nlMin, nlMax] = getNewlineDelay(newlineDelay);

    const chars = code.split('');
    const total = chars.length;

    for (let i = 0; i < total; i++) {
      if (stopRequested) {
        showBanner('Stopped.', '#ef4444');
        await sleep(1200);
        hideBanner();
        return;
      }

      const ch = chars[i];
      let delay = baseDelay;

      // Warmup
      if (warmupEffect) {
        const p = i / total;
        if (p < 0.15) delay *= 1.8 - (p / 0.15) * 0.8;
      }

      // Burst
      if (burstTyping && isCommon(code, i)) delay *= 0.6;

      // Symbols are slower
      if (ch.match(/[^a-zA-Z0-9\s]/)) delay *= 1.4;

      // Natural variance ±40%
      delay *= (0.6 + Math.random() * 0.8);

      // Thinking pauses
      if (Math.random() < pauses.sC) delay += pauses.sM + Math.random() * pauses.sM;
      else if (Math.random() < pauses.bC) delay += pauses.bM + Math.random() * pauses.bM;

      // Post-statement pause
      if (i > 0 && [';', '{', '}', ')', ']'].includes(chars[i - 1])) delay += 100 + Math.random() * 300;

      await sleep(Math.max(delay, 15));

      // Re-target (Google Docs handling)
      const docsIframe = document.querySelector('.docs-texteventtarget-iframe');
      if (docsIframe && docsIframe.contentDocument) {
        el = docsIframe.contentDocument.activeElement || docsIframe.contentDocument.body;
      } else if (document.activeElement && document.activeElement !== document.body) {
        el = document.activeElement;
      }

      // Error sim
      if (errProb > 0 && Math.random() < errProb && ch.match(/[a-zA-Z]/)) {
        insertChar(el, getNearbyTypo(ch));
        await sleep(200 + Math.random() * 400);
        doBackspace(el);
        await sleep(80 + Math.random() * 150);
      }

      insertChar(el, ch);

      if (ch === '\n') await sleep(nlMin + Math.random() * (nlMax - nlMin));
      if (ch === ' ')  await sleep(Math.random() * 40);
    }

    showBanner('✅ Done!', '#10b981');
    await sleep(2000);
    hideBanner();
  }

  // ─── CHAR INSERTION ───
  function kc(c) { return c === '\n' ? 13 : c === '\t' ? 9 : c === ' ' ? 32 : c.toUpperCase().charCodeAt(0); }

  function insertChar(el, ch) {
    const std = el.tagName === 'TEXTAREA' || el.tagName === 'INPUT';

    if (std) {
      const s = el.selectionStart, e = el.selectionEnd, v = el.value;
      el.value = v.substring(0, s) + ch + v.substring(e);
      el.selectionStart = el.selectionEnd = s + ch.length;
    }

    const k = kc(ch);
    const ev = { key: ch === '\n' ? 'Enter' : ch, code: ch === '\n' ? 'Enter' : ch === ' ' ? 'Space' : `Key${ch.toUpperCase()}`, keyCode: k, which: k, bubbles: true, cancelable: true };

    el.dispatchEvent(new KeyboardEvent('keydown', ev));
    el.dispatchEvent(new KeyboardEvent('keypress', ev));
    el.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: ch, bubbles: true, cancelable: true }));

    try {
      const te = document.createEvent('TextEvent');
      te.initTextEvent('textInput', true, true, window, ch, 9, 'en-US');
      el.dispatchEvent(te);
    } catch(e) {}

    if (!std) {
      ch === '\n' ? document.execCommand('insertLineBreak') : document.execCommand('insertText', false, ch);
    }

    el.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: ch, bubbles: true }));
    if (std) el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', ev));
  }

  function doBackspace(el) {
    const std = el.tagName === 'TEXTAREA' || el.tagName === 'INPUT';
    if (std) {
      const s = el.selectionStart;
      if (s > 0) { const v = el.value; el.value = v.substring(0, s - 1) + v.substring(s); el.selectionStart = el.selectionEnd = s - 1; }
    }
    const ev = { key: 'Backspace', code: 'Backspace', keyCode: 8, which: 8, bubbles: true, cancelable: true };
    el.dispatchEvent(new KeyboardEvent('keydown', ev));
    el.dispatchEvent(new InputEvent('beforeinput', { inputType: 'deleteContentBackward', bubbles: true, cancelable: true }));
    if (!std) document.execCommand('delete');
    el.dispatchEvent(new InputEvent('input', { inputType: 'deleteContentBackward', bubbles: true }));
    if (std) el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', ev));
  }

})();
