/**
 * Typing Kids Indonesia — entry point
 */
import { Game } from './game.js';
import { CONFIG } from './config.js';

async function boot() {
  document.title = `${CONFIG.app.name} — ${CONFIG.app.subtitle}`;

  const game = new Game();
  // Expose for future parent dashboard / debugging (optional)
  window.__typingKids = { game, config: CONFIG };

  await game.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
