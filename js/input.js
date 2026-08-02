/**
 * Input — physical QWERTY keyboard (no on-screen keyboard)
 * Single capture-phase listener + hidden input for reliable focus.
 */
export class InputManager {
  /**
   * @param {{ onLetter: (letter: string) => void, isActive: () => boolean }} handlers
   */
  constructor(handlers) {
    this.onLetter = handlers.onLetter;
    this.isActive = handlers.isActive;
    this.enabled = true;
    /** @type {HTMLInputElement | null} */
    this.catcher = null;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onCatcherInput = this._onCatcherInput.bind(this);
    this._keepFocus = this._keepFocus.bind(this);
    /** Prevent double-fire within same event tick */
    this._lastKeyTs = 0;
    this._lastLetter = '';
  }

  /**
   * @param {HTMLInputElement | null} [catcher]
   */
  start(catcher = null) {
    this.catcher = catcher;
    // ONE listener only (capture) — avoid double letter advances
    window.addEventListener('keydown', this._onKeyDown, true);

    if (this.catcher) {
      this.catcher.addEventListener('input', this._onCatcherInput);
      this.catcher.addEventListener('blur', this._keepFocus);
    }
  }

  stop() {
    window.removeEventListener('keydown', this._onKeyDown, true);
    if (this.catcher) {
      this.catcher.removeEventListener('input', this._onCatcherInput);
      this.catcher.removeEventListener('blur', this._keepFocus);
    }
  }

  setEnabled(value) {
    this.enabled = value;
  }

  focus() {
    if (!this.catcher) return;
    try {
      this.catcher.focus({ preventScroll: true });
    } catch {
      this.catcher.focus();
    }
  }

  _keepFocus() {
    if (!this.enabled || !this.isActive()) return;
    requestAnimationFrame(() => {
      if (this.enabled && this.isActive()) this.focus();
    });
  }

  /**
   * @param {string} letter
   */
  _emit(letter) {
    const now = performance.now();
    // Debounce identical letter within 40ms (repeat / multi-listener safety)
    if (letter === this._lastLetter && now - this._lastKeyTs < 40) return;
    this._lastLetter = letter;
    this._lastKeyTs = now;
    this.onLetter(letter);
  }

  /**
   * @param {KeyboardEvent} e
   */
  _onKeyDown(e) {
    if (!this.enabled || !this.isActive()) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.isComposing || e.keyCode === 229) return;
    if (e.repeat) return; // kids holding a key shouldn't spam
    if (e.key === 'Tab' || e.key === 'Escape') return;

    const letter = this._extractLetter(e);
    if (!letter) return;

    e.preventDefault();
    this._emit(letter);

    if (this.catcher) this.catcher.value = '';
  }

  /**
   * @param {Event} e
   */
  _onCatcherInput(e) {
    if (!this.enabled || !this.isActive()) return;
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    const raw = target.value || '';
    target.value = '';
    for (const ch of raw) {
      if (/[a-zA-Z]/.test(ch)) this._emit(ch.toLowerCase());
    }
  }

  /**
   * @param {KeyboardEvent} e
   * @returns {string | null}
   */
  _extractLetter(e) {
    if (e.key && e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      return e.key.toLowerCase();
    }
    const match = /^Key([A-Z])$/.exec(e.code || '');
    if (match) return match[1].toLowerCase();
    return null;
  }
}

export default InputManager;
