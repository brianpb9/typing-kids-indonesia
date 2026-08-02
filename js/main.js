/**
 * Typing Kids Indonesia — entry point
 */
import { Game } from './game.js';
import { CONFIG } from './config.js';

async function boot() {
  document.title = `${CONFIG.app.name} — ${CONFIG.app.subtitle}`;

  const game = new Game();
  // Debug handle only on local hosts
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
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
