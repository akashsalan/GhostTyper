document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const codeInput = document.getElementById('codeInput');
  const statusMsg = document.getElementById('statusMsg');
  const wpmSlider = document.getElementById('wpmSlider');
  const wpmValue = document.getElementById('wpmValue');
  const errorSelect = document.getElementById('errorSelect');
  const pauseSelect = document.getElementById('pauseSelect');
  const newlineSelect = document.getElementById('newlineSelect');
  const burstToggle = document.getElementById('burstToggle');
  const warmupToggle = document.getElementById('warmupToggle');
  const charCount = document.getElementById('charCount');

  // WPM display
  wpmSlider.addEventListener('input', () => {
    wpmValue.textContent = wpmSlider.value + ' WPM';
    saveState();
  });

  // Char count
  codeInput.addEventListener('input', () => {
    charCount.textContent = codeInput.value.length;
    saveState();
  });

  // Load saved state
  chrome.storage.local.get(['savedCode', 'wpm', 'errorRate', 'pauseLevel', 'newlineDelay', 'burstTyping', 'warmupEffect'], (result) => {
    if (result.savedCode) { codeInput.value = result.savedCode; charCount.textContent = result.savedCode.length; }
    if (result.wpm) { wpmSlider.value = result.wpm; wpmValue.textContent = result.wpm + ' WPM'; }
    if (result.errorRate) errorSelect.value = result.errorRate;
    if (result.pauseLevel) pauseSelect.value = result.pauseLevel;
    if (result.newlineDelay) newlineSelect.value = result.newlineDelay;
    if (result.burstTyping !== undefined) burstToggle.checked = result.burstTyping;
    if (result.warmupEffect !== undefined) warmupToggle.checked = result.warmupEffect;
  });

  const saveState = () => {
    chrome.storage.local.set({
      savedCode: codeInput.value,
      wpm: wpmSlider.value,
      errorRate: errorSelect.value,
      pauseLevel: pauseSelect.value,
      newlineDelay: newlineSelect.value,
      burstTyping: burstToggle.checked,
      warmupEffect: warmupToggle.checked
    });
  };

  [errorSelect, pauseSelect, newlineSelect].forEach(el => el.addEventListener('change', saveState));
  [burstToggle, warmupToggle].forEach(el => el.addEventListener('change', saveState));

  // Stop button
  stopBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { action: 'STOP_TYPING' });
      stopBtn.classList.add('hidden');
      startBtn.classList.remove('hidden');
      startBtn.disabled = false;
      showStatus('Typing stopped.', 'var(--error)');
    } catch(e) {}
  });

  // Start button
  startBtn.addEventListener('click', async () => {
    const code = codeInput.value;
    if (!code) {
      showStatus('Paste some code first!', 'var(--error)');
      return;
    }

    const config = {
      code: code,
      wpm: parseInt(wpmSlider.value),
      errorRate: errorSelect.value,
      pauseLevel: pauseSelect.value,
      newlineDelay: newlineSelect.value,
      burstTyping: burstToggle.checked,
      warmupEffect: warmupToggle.checked
    };

    startBtn.disabled = true;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error("No active tab");

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      chrome.tabs.sendMessage(tab.id, { action: 'START_TYPING', payload: config }, (response) => {
        if (chrome.runtime.lastError) {
          showStatus('Cannot inject on this page.', 'var(--error)');
          startBtn.disabled = false;
        } else {
          // Show stop button
          startBtn.classList.add('hidden');
          stopBtn.classList.remove('hidden');
          showStatus('Typing started on the page!', 'var(--success)');
        }
      });
    } catch (err) {
      showStatus('Failed: ' + err.message, 'var(--error)');
      startBtn.disabled = false;
    }
  });

  function showStatus(msg, color) {
    statusMsg.textContent = msg;
    statusMsg.style.color = color;
    statusMsg.classList.remove('hidden');
    setTimeout(() => statusMsg.classList.add('hidden'), 3000);
  }
});
