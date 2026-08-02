/**
 * UI — DOM updates for screens, word display, progress, encouragement
 */
export class UI {
  constructor() {
    this.els = {
      startScreen: document.getElementById('start-screen'),
      gameScreen: document.getElementById('game-screen'),
      startBtn: document.getElementById('start-btn'),
      wordImage: document.getElementById('word-image'),
      wordLabel: document.getElementById('word-label'),
      wordSlots: document.getElementById('word-slots'),
      progressFill: document.getElementById('progress-fill'),
      progressLabel: document.getElementById('progress-label'),
      encouragement: document.getElementById('encouragement'),
      praiseOverlay: document.getElementById('praise-overlay'),
      praiseText: document.getElementById('praise-text'),
      speakBtn: document.getElementById('speak-btn'),
      completedCount: document.getElementById('completed-count'),
      imageWrap: document.getElementById('image-wrap'),
      targetLetter: document.getElementById('target-letter'),
      targetHint: document.getElementById('target-hint'),
      keyCatcher: document.getElementById('key-catcher'),
      gameCard: document.querySelector('.game-card'),
    };
  }

  showStart() {
    this.els.startScreen?.classList.remove('hidden');
    this.els.gameScreen?.classList.add('hidden');
    this.els.startScreen?.setAttribute('aria-hidden', 'false');
    this.els.gameScreen?.setAttribute('aria-hidden', 'true');
  }

  showGame() {
    this.els.startScreen?.classList.add('hidden');
    this.els.gameScreen?.classList.remove('hidden');
    this.els.startScreen?.setAttribute('aria-hidden', 'true');
    this.els.gameScreen?.setAttribute('aria-hidden', 'false');
  }

  /**
   * @param {{ image: string, display: string, word: string }} word
   * @param {number} completed
   */
  setWord(word, completed) {
    const img = this.els.wordImage;
    if (img) {
      img.classList.remove('image-enter', 'float-idle');
      void img.offsetWidth;
      img.src = word.image;
      img.alt = word.display;
      img.classList.add('image-enter');
      setTimeout(() => img.classList.add('float-idle'), 450);
    }

    // Soft label (helps if TTS is quiet) — kids still type letter-by-letter
    if (this.els.wordLabel) {
      this.els.wordLabel.textContent = word.display;
    }

    this.renderSlots(word.word, 0);
    this.setProgress(0, word.word.length);
    this.setCompleted(completed);
    this.hidePraise();
    this.setTargetLetter(word.word[0] || '');
  }

  /**
   * Big letter the child should type next (critical for ages 5–6)
   * @param {string} letter
   */
  setTargetLetter(letter) {
    const el = this.els.targetLetter;
    const hint = this.els.targetHint;
    const hintKey = document.getElementById('hint-key');
    if (!el) return;

    if (!letter) {
      el.textContent = '★';
      el.classList.add('done');
      if (hint) hint.textContent = 'Selesai!';
      return;
    }

    const up = letter.toUpperCase();
    el.textContent = up;
    el.classList.remove('done');
    el.classList.remove('target-pop');
    void el.offsetWidth;
    el.classList.add('target-pop');
    if (hint) hint.textContent = 'Ketik huruf ini';
    if (hintKey) hintKey.textContent = up;
  }

  /**
   * @param {string} word
   * @param {number} filledCount
   */
  renderSlots(word, filledCount) {
    const container = this.els.wordSlots;
    if (!container) return;

    container.innerHTML = '';
    const letters = word.toUpperCase().split('');

    letters.forEach((letter, i) => {
      const slot = document.createElement('span');
      slot.className = 'letter-slot';
      slot.dataset.index = String(i);
      // Not a button — keyboard only (kids often try to click)
      slot.setAttribute('aria-hidden', 'true');

      if (i < filledCount) {
        slot.textContent = letter;
        slot.classList.add('filled');
      } else if (i === filledCount) {
        slot.innerHTML = '<span class="slot-dash"></span>';
        slot.classList.add('current');
        slot.setAttribute('aria-current', 'true');
      } else {
        slot.innerHTML = '<span class="slot-dash"></span>';
        slot.classList.add('empty');
      }

      container.appendChild(slot);
    });

    // Update big target letter
    if (filledCount < word.length) {
      this.setTargetLetter(word[filledCount]);
    } else {
      this.setTargetLetter('');
    }
  }

  /**
   * @param {number} index
   */
  popLetter(index) {
    const slot = this.els.wordSlots?.querySelector(`[data-index="${index}"]`);
    if (slot) {
      slot.classList.add('pop');
      setTimeout(() => slot.classList.remove('pop'), 400);
    }
    return slot;
  }

  shakeWord() {
    const el = this.els.wordSlots;
    const target = this.els.targetLetter;
    if (el) {
      el.classList.remove('shake');
      void el.offsetWidth;
      el.classList.add('shake');
      setTimeout(() => el.classList.remove('shake'), 400);
    }
    if (target) {
      target.classList.remove('shake');
      void target.offsetWidth;
      target.classList.add('shake');
      setTimeout(() => target.classList.remove('shake'), 400);
    }
  }

  /**
   * @param {number} current
   * @param {number} total
   */
  setProgress(current, total) {
    const pct = total ? Math.round((current / total) * 100) : 0;
    if (this.els.progressFill) {
      this.els.progressFill.style.width = `${pct}%`;
    }
    if (this.els.progressLabel) {
      this.els.progressLabel.textContent = `${current} / ${total}`;
    }
  }

  setCompleted(n) {
    if (this.els.completedCount) {
      this.els.completedCount.textContent = String(n);
    }
  }

  setEncouragement(text) {
    if (this.els.encouragement) {
      this.els.encouragement.textContent = text;
      this.els.encouragement.classList.remove('fade-in');
      void this.els.encouragement.offsetWidth;
      this.els.encouragement.classList.add('fade-in');
    }
  }

  showPraise(text) {
    if (this.els.praiseText) this.els.praiseText.textContent = text;
    this.els.praiseOverlay?.classList.add('visible');
    this.els.imageWrap?.classList.add('celebrate-bounce');
  }

  hidePraise() {
    this.els.praiseOverlay?.classList.remove('visible');
    this.els.imageWrap?.classList.remove('celebrate-bounce');
  }

  /**
   * @param {() => void} handler
   */
  onStart(handler) {
    this.els.startBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handler();
    });

    window.addEventListener('keydown', (e) => {
      if (this.els.startScreen?.classList.contains('hidden')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler();
      }
    });
  }

  /**
   * Speak button
   * @param {() => void} handler
   */
  onSpeak(handler) {
    const btn = this.els.speakBtn;
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handler();
    });
  }

  /**
   * When kids click letter slots (thinking they're buttons)
   * @param {() => void} handler
   */
  onSlotsClick(handler) {
    this.els.wordSlots?.addEventListener('click', handler);
    this.els.targetLetter?.addEventListener('click', handler);
  }

  /**
   * Click image to hear word again
   * @param {() => void} handler
   */
  onImageClick(handler) {
    this.els.wordImage?.addEventListener('click', handler);
    this.els.imageWrap?.addEventListener('click', (e) => {
      if (e.target === this.els.speakBtn || this.els.speakBtn?.contains(/** @type {Node} */ (e.target))) {
        return;
      }
      handler();
    });
  }

  getKeyCatcher() {
    return this.els.keyCatcher instanceof HTMLInputElement ? this.els.keyCatcher : null;
  }
}

export default UI;
