/**
 * Game — core loop: start → picture + voice → type → celebrate → next
 * No-fail design: wrong keys never remove progress or show failure.
 */
import { CONFIG } from './config.js';
import { WordBank } from './words.js';
import { AudioManager } from './audio.js';
import { AnimationManager } from './animation.js';
import { InputManager } from './input.js';
import { UI } from './ui.js';

export class Game {
  constructor() {
    this.words = new WordBank();
    this.audio = new AudioManager();
    this.anim = new AnimationManager();
    this.ui = new UI();

    /** @type {'boot' | 'start' | 'playing' | 'celebrating'} */
    this.state = 'boot';
    this.current = null;
    this.cursor = 0;
    this.completed = 0;
    this._transitionLock = false;
    this._wrongStreak = 0;

    this.input = new InputManager({
      onLetter: (letter) => this.handleLetter(letter),
      isActive: () => this.state === 'playing' && !this._transitionLock,
    });
  }

  async init() {
    const canvas = document.getElementById('fx-canvas');
    if (canvas instanceof HTMLCanvasElement) {
      this.anim.init(canvas);
    }

    try {
      await this.words.load();
    } catch (err) {
      console.error(err);
      this.ui.setEncouragement('Oops, data kata gagal dimuat. Muat ulang ya!');
      return;
    }

    this.ui.onStart(() => this.start());
    this.ui.onSpeak(() => {
      this.audio.unlock();
      this.speakCurrentWord();
      this.input.focus();
    });
    this.ui.onImageClick(() => {
      if (this.state !== 'playing') return;
      this.audio.unlock();
      this.speakCurrentWord();
      this.input.focus();
    });
    // Kids often click the letter boxes — guide them to keyboard
    this.ui.onSlotsClick(() => {
      if (this.state !== 'playing') return;
      this.audio.unlock();
      this.ui.setEncouragement('Ketik di keyboard laptop ya! ⌨️');
      this.speakCurrentWord();
      this.input.focus();
    });

    this.input.start(this.ui.getKeyCatcher());
    this.ui.showStart();
    this.state = 'start';
  }

  start() {
    if (this.state === 'playing' || this.state === 'celebrating') return;

    this.audio.unlock();
    this.audio.playClick();
    this.completed = 0;
    this.ui.showGame();
    this.state = 'playing';
    this.loadNextWord();
    // Focus key catcher so every keystroke is received
    this.input.focus();
  }

  loadNextWord() {
    this._transitionLock = false;
    this._wrongStreak = 0;
    this.current = this.words.next();
    if (!this.current) return;

    this.cursor = 0;
    this.ui.setWord(this.current, this.completed);
    this.ui.setEncouragement(this.words.randomEncouragement());
    this.state = 'playing';
    this.input.focus();

    // Speak word via browser TTS
    setTimeout(() => {
      this.speakCurrentWord();
      this.input.focus();
    }, CONFIG.timing.speakDelayAfterLoadMs);
  }

  speakCurrentWord() {
    if (!this.current) return;
    // Always unlock first so TTS works after gesture
    this.audio.unlock();
    this.audio.speakWord(this.current.display);
  }

  /**
   * @param {string} letter lowercase a-z
   */
  handleLetter(letter) {
    if (!this.current || this.state !== 'playing' || this._transitionLock) return;

    const target = this.current.word[this.cursor];
    if (!target) return;

    // Always keep focus for next key
    this.input.focus();

    if (letter === target) {
      this._onCorrect();
    } else {
      this._onWrong(letter);
    }
  }

  _onCorrect() {
    if (!this.current) return;
    this._wrongStreak = 0;
    const index = this.cursor;
    this.cursor += 1;

    this.ui.renderSlots(this.current.word, this.cursor);
    this.ui.setProgress(this.cursor, this.current.word.length);

    const slot = this.ui.popLetter(index);
    this.audio.playCorrect();
    if (slot) this.anim.sparkleAt(slot);

    if (this.cursor < this.current.word.length) {
      this.ui.setEncouragement('Ya! Lanjut~');
    }

    if (this.cursor >= this.current.word.length) {
      this._onWordComplete();
    }
  }

  /**
   * @param {string} [_letter]
   */
  _onWrong(_letter) {
    this._wrongStreak += 1;
    this.ui.shakeWord();
    this.audio.playWrong();

    // Helpful, never shaming
    if (this._wrongStreak >= 3 && this.current) {
      const need = this.current.word[this.cursor]?.toUpperCase() || '';
      this.ui.setEncouragement(`Cari huruf ${need} di keyboard~`);
      // Soft re-speak so they hear the word again
      if (this._wrongStreak === 3 || this._wrongStreak % 5 === 0) {
        this.speakCurrentWord();
      }
    } else {
      this.ui.setEncouragement(this.words.randomEncouragement());
    }
  }

  _onWordComplete() {
    this.state = 'celebrating';
    this._transitionLock = true;
    this.completed += 1;
    this.ui.setCompleted(this.completed);

    const praise = this.words.randomPraise();
    this.ui.showPraise(praise);
    this.anim.celebrate();
    this.audio.playCelebration();
    this.audio.playSparkle();
    this.audio.speakPraise(praise);

    setTimeout(() => {
      this.ui.hidePraise();
      setTimeout(() => this.loadNextWord(), CONFIG.timing.nextWordDelayMs);
    }, CONFIG.timing.celebrationMs);
  }
}

export default Game;
