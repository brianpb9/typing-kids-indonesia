/**
 * Input — physical QWERTY + on-screen keyboard
 * Capture-phase listener + hidden input + aggressive re-focus while playing
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
    this._onVisibility = this._onVisibility.bind(this);
    this._onPointer = this._onPointer.bind(this);
    this._lastKeyTs = 0;
    this._lastLetter = '';
    this._focusTimer = 0;
  }

  /**
   * @param {HTMLInputElement | null} [catcher]
   */
  start(catcher = null) {
    this.catcher = catcher;
    window.addEventListener('keydown', this._onKeyDown, true);
    document.addEventListener('visibilitychange', this._onVisibility);
    document.addEventListener('pointerdown', this._onPointer, true);

    if (this.catcher) {
      this.catcher.addEventListener('input', this._onCatcherInput);
      this.catcher.addEventListener('blur', this._keepFocus);
    }

    // Aggressive re-focus while active (helps laptop trackpad clicks)
    this._focusTimer = window.setInterval(() => {
      if (!this.enabled || !this.isActive()) return;
      if (!this.catcher) return;
      if (document.activeElement === this.catcher) return;
      // Don't steal focus from class input / buttons / a11y toggles
      const ae = document.activeElement;
      if (
        ae instanceof HTMLInputElement &&
        ae !== this.catcher &&
        ae.id !== 'key-catcher'
      ) {
        return;
      }
      if (
        ae instanceof HTMLElement &&
        (ae.tagName === 'BUTTON' ||
          ae.tagName === 'SUMMARY' ||
          ae.tagName === 'TEXTAREA' ||
          ae.isContentEditable)
      ) {
        return;
      }
      this.focus();
    }, 800);
  }

  stop() {
    window.removeEventListener('keydown', this._onKeyDown, true);
    document.removeEventListener('visibilitychange', this._onVisibility);
    document.removeEventListener('pointerdown', this._onPointer, true);
    if (this._focusTimer) {
      clearInterval(this._focusTimer);
      this._focusTimer = 0;
    }
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

  /**
   * On-screen keyboard press
   * @param {string} letter
   */
  virtualKey(letter) {
    if (!this.enabled || !this.isActive()) return;
    const ch = String(letter || '').toLowerCase();
    if (!/^[a-z]$/.test(ch)) return;
    this._emit(ch);
    this.focus();
  }

  _keepFocus() {
    if (!this.enabled || !this.isActive()) return;
    requestAnimationFrame(() => {
      if (this.enabled && this.isActive()) this.focus();
    });
  }

  _onVisibility() {
    if (document.visibilityState === 'visible' && this.isActive()) {
      this.focus();
    }
  }

  _onPointer(e) {
    if (!this.enabled || !this.isActive()) return;
    const t = e.target;
    if (!(t instanceof Element)) return;
    // Clicking game area (not interactive controls) → refocus catcher
    if (
      t.closest('#game-screen') &&
      !t.closest('button') &&
      !t.closest('input') &&
      !t.closest('.osk-key')
    ) {
      this.focus();
    }
  }

  /**
   * @param {string} letter
   */
  _emit(letter) {
    const now = performance.now();
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
    if (e.repeat) return;
    if (e.key === 'Tab' || e.key === 'Escape') return;

    // Don't capture when typing in non-game fields
    const ae = document.activeElement;
    if (
      ae instanceof HTMLInputElement &&
      ae.id !== 'key-catcher' &&
      ae.type !== 'hidden'
    ) {
      return;
    }

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
