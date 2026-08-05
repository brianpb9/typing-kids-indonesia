/**
 * Typing Kids Indonesia — entry point
 */
import { Game } from './game.js';
import { CONFIG } from './config.js';

async function boot() {
  document.title = `${CONFIG.app.name} — ${CONFIG.app.subtitle}`;

  const game = new Game();
  // Debug handle ONLY on loopback hosts (Playwright runs on 127.0.0.1).
  // A ?e2e URL param alone must never expose internals on a public host.
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
