// Background service worker
// When the user presses Alt+G, first make sure the content script is injected, then send the toggle message.
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-panel') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    // Try to inject the content script first (in case the tab was open before the extension loaded).
    // If it's already injected, the guard at the top of content.js prevents double-init.
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (e) {
      // Injection can fail on chrome:// or edge:// pages — silently ignore
      console.warn('Cannot inject on this page:', e.message);
      return;
    }

    // Small delay to let the script initialize
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_PANEL' }).catch(() => {
        // If it still fails, nothing we can do on this page
      });
    }, 100);
  }
});
