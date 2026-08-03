/**
 * Typing Kids Indonesia — entry point
 */
import { Game } from './game.js';
import { CONFIG } from './config.js';

async function boot() {
  document.title = `${CONFIG.app.name} — ${CONFIG.app.subtitle}`;

  const game = new Game();
  // Debug handle on local / e2e hosts (Playwright uses 127.0.0.1)
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const e2e =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      new URLSearchParams(window.location.search).has('e2e');
    if (e2e) {
      window.__typingKids = { game, config: CONFIG };
    }
  }

  await game.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
