/**
 * Game — 3 modes (easy / medium / hard) + session missions
 *
 * easy   — big letter + slots + label after wrongs
 * medium — slots only, no big letter cheat
 * hard   — image + TTS only
 */
import { CONFIG, getMode } from './config.js';
import { WordBank } from './words.js';
import { AudioManager } from './audio.js';
import { AnimationManager } from './animation.js';
import { InputManager } from './input.js';
import { UI } from './ui.js';
import { loadSave, patchSave, getRank } from './storage.js';

export class Game {
  constructor() {
    this.words = new WordBank();
    this.audio = new AudioManager();
    this.anim = new AnimationManager();
    this.ui = new UI();

    /** @type {'boot'|'start'|'playing'|'celebrating'|'milestone'|'victory'} */
    this.state = 'boot';
    this.current = null;
    this.cursor = 0;
    this.sessionStars = 0;
    this._transitionLock = false;
    this._wrongStreak = 0;
    this._labelVisible = false;
    this._milestonesHit = new Set();
    this._sessionTarget = CONFIG.goals.sessionTarget;

    /** @type {'easy'|'medium'|'hard'} */
    this.difficulty = CONFIG.gameplay.defaultDifficulty;

    this.input = new InputManager({
      onLetter: (letter) => this.handleLetter(letter),
      isActive: () => this.state === 'playing' && !this._transitionLock,
    });
  }

  _mode() {
    return getMode(this.difficulty);
  }

  async init() {
    const canvas = document.getElementById('fx-canvas');
    if (canvas instanceof HTMLCanvasElement) {
      this.anim.init(canvas);
    }

    const save = loadSave();
    this.difficulty = getMode(save.difficulty).id;
    this.audio.setMuted(save.muted);
    this.ui.setMuteUI(save.muted);
    this.ui.setDifficultyUI(this.difficulty);
    this.ui.renderCollection(save);

    try {
      await this.words.load();
      this.words.setDifficulty(this.difficulty);
    } catch (err) {
      console.error(err);
      this.ui.setEncouragement('Oops, data kata gagal dimuat. Muat ulang ya!');
      return;
    }

    this.ui.onStart(() => this.startMission());
    this.ui.onReplay(() => this.startMission());
    this.ui.onHome(() => this.goHome());
    this.ui.onMute(() => this.toggleMute());
    this.ui.onDifficulty((mode) => this.setDifficulty(mode));

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

  /**
   * @param {'easy'|'medium'|'hard'|string} mode
   */
  setDifficulty(mode) {
    if (this.state === 'playing' || this.state === 'celebrating') return;
    this.difficulty = getMode(mode).id;
    this.words.setDifficulty(this.difficulty);
    this.ui.setDifficultyUI(this.difficulty);
    patchSave({ difficulty: this.difficulty });
    this.audio.playClick();
  }

  toggleMute() {
    const muted = this.audio.toggleMute();
    this.ui.setMuteUI(muted);
    patchSave({ muted });
    if (!muted) {
      this.audio.unlock();
      this.audio.playClick();
    }
  }

  goHome() {
    this._transitionLock = false;
    this.state = 'start';
    this.ui.renderCollection(loadSave());
    this.ui.showStart();
  }

  startMission() {
    if (
      this.state === 'playing' ||
      this.state === 'celebrating' ||
      this.state === 'milestone'
    ) {
      return;
    }

    this.audio.unlock();
    this.audio.playClick();

    this.sessionStars = 0;
    this._milestonesHit = new Set();
    this._wrongStreak = 0;
    this._labelVisible = false;
    this._transitionLock = false;

    this.words.setDifficulty(this.difficulty);
    this.ui.setDifficultyUI(this.difficulty);
    this.ui.showGame();
    this.ui.applyModeLayout();
    this.ui.setSessionStars(0, this._sessionTarget);
    this.state = 'playing';
    this.loadNextWord();
    this.input.focus();
  }

  loadNextWord() {
    this._transitionLock = false;
    this._wrongStreak = 0;
    this._labelVisible = false;
    this.current = this.words.next();
    if (!this.current) return;

    this.cursor = 0;
    this.ui.applyModeLayout();
    this.ui.setWord(this.current, this.sessionStars, {
      showLabel: false,
    });
    this.ui.setEncouragement(this._goalEncouragement());
    this.state = 'playing';
    this.input.focus();

    setTimeout(() => {
      this.speakCurrentWord();
      this.input.focus();
    }, CONFIG.timing.speakDelayAfterLoadMs);
  }

  _goalEncouragement() {
    const left = this._sessionTarget - this.sessionStars;
    const mode = this._mode();
    if (this.sessionStars === 0 && mode.id === 'hard') {
      return 'Dengar baik-baik, lalu ketik!';
    }
    if (left <= 2 && left > 0) {
      return left === 1
        ? '1 bintang lagi juara! 🏆'
        : `${left} bintang lagi! Ayo!`;
    }
    if (this.sessionStars === 0) {
      return `Kejar ${this._sessionTarget} bintang ya!`;
    }
    return this.words.randomEncouragement();
  }

  speakCurrentWord() {
    if (!this.current) return;
    this.audio.unlock();
    this.audio.speakWord(this.current.display);
  }

  /**
   * @param {string} letter
   */
  handleLetter(letter) {
    if (!this.current || this.state !== 'playing' || this._transitionLock) return;

    const target = this.current.word[this.cursor];
    if (!target) return;

    this.input.focus();

    if (letter === target) {
      this._onCorrect();
    } else {
      this._onWrong();
    }
  }

  _onCorrect() {
    if (!this.current) return;
    this._wrongStreak = 0;
    const index = this.cursor;
    this.cursor += 1;

    const mode = this._mode();
    if (mode.showSlots) {
      this.ui.renderSlots(this.current.word, this.cursor);
    }
    if (mode.showLetterProgress) {
      this.ui.setProgress(this.cursor, this.current.word.length);
    }
    // Hard: still update invisible progress if needed for internal state only
    if (!mode.showLetterProgress && !mode.showSlots) {
      // no visual letter UI — sound is the feedback
    } else if (mode.showBigLetter) {
      /* renderSlots already updates big letter */
    }

    const slot = mode.showSlots ? this.ui.popLetter(index) : null;
    this.audio.playCorrect();
    if (slot) {
      this.anim.sparkleAt(slot);
    } else if (mode.id === 'hard' && this.ui.els.imageWrap) {
      this.anim.sparkleAt(this.ui.els.imageWrap);
    }

    if (this.cursor < this.current.word.length) {
      const left = this._sessionTarget - this.sessionStars;
      this.ui.setEncouragement(
        left <= 3 ? this._goalEncouragement() : 'Ya! Lanjut~'
      );
    }

    if (this.cursor >= this.current.word.length) {
      this._onWordComplete();
    }
  }

  _onWrong() {
    this._wrongStreak += 1;
    this.ui.shakeWord();
    this.audio.playWrong();

    const mode = this._mode();
    const revealAt = mode.showLabelAfterWrongs;

    // Word name reveal (easy / medium only if configured)
    if (
      revealAt > 0 &&
      this._wrongStreak >= revealAt &&
      !this._labelVisible &&
      this.current
    ) {
      this._labelVisible = true;
      this.ui.setWordLabel(this.current.display, true);
      this.ui.setEncouragement(`Ini katanya: ${this.current.display}`);
      this.speakCurrentWord();
      return;
    }

    // Easy: after N wrongs, name the letter to find
    const letterHintAt = mode.hintLetterAfterWrongs;
    if (letterHintAt > 0 && this._wrongStreak >= letterHintAt && this.current) {
      const need = this.current.word[this.cursor]?.toUpperCase() || '';
      this.ui.setEncouragement(`Cari huruf ${need} di keyboard~`);
      if (this._wrongStreak === letterHintAt || this._wrongStreak % 5 === 0) {
        this.speakCurrentWord();
      }
      return;
    }

    // Medium / hard: never name the letter
    if (mode.id === 'hard') {
      this.ui.setEncouragement(
        this._wrongStreak >= 3
          ? 'Dengar lagi suaranya ya~'
          : this.words.randomEncouragement()
      );
      if (this._wrongStreak === 3 || this._wrongStreak % 4 === 0) {
        this.speakCurrentWord();
      }
      return;
    }

    this.ui.setEncouragement(this.words.randomEncouragement());
    if (this._wrongStreak >= 4 && this._wrongStreak % 3 === 0) {
      this.speakCurrentWord();
    }
  }

  _onWordComplete() {
    this.state = 'celebrating';
    this._transitionLock = true;
    this.sessionStars += 1;

    const save = patchSave({
      totalStars: loadSave().totalStars + 1,
    });

    this.ui.setSessionStars(this.sessionStars, this._sessionTarget, {
      pop: true,
    });

    const praise = this.words.randomPraise();
    this.ui.showPraise(praise);
    this.anim.celebrate();
    this.audio.playCelebration();
    this.audio.playSparkle();
    this.audio.speakPraise(praise);

    const hitMissionEnd = this.sessionStars >= this._sessionTarget;
    const milestone = this._checkMilestone();

    setTimeout(() => {
      this.ui.hidePraise();

      if (hitMissionEnd) {
        this._finishMission(save);
        return;
      }

      if (milestone) {
        this._showMilestoneThenContinue(milestone);
        return;
      }

      setTimeout(() => this.loadNextWord(), CONFIG.timing.nextWordDelayMs);
    }, CONFIG.timing.celebrationMs);
  }

  _checkMilestone() {
    const list = CONFIG.goals.milestones.filter(
      (m) => m.at < this._sessionTarget
    );
    for (const m of list) {
      if (this.sessionStars === m.at && !this._milestonesHit.has(m.at)) {
        this._milestonesHit.add(m.at);
        return m;
      }
    }
    return null;
  }

  /**
   * @param {{ at: number, title: string, subtitle: string, trophy: string }} m
   */
  _showMilestoneThenContinue(m) {
    this.state = 'milestone';
    this.ui.showMilestone(m);
    this.audio.playSparkle();
    this.audio.speakPraise(m.title);

    setTimeout(() => {
      this.ui.hideMilestone();
      setTimeout(() => this.loadNextWord(), CONFIG.timing.nextWordDelayMs);
    }, CONFIG.timing.milestoneMs);
  }

  /**
   * @param {{ totalStars: number, missionsWon: number }} save
   */
  _finishMission(save) {
    this.state = 'victory';
    this._transitionLock = true;

    const updated = patchSave({
      missionsWon: (save.missionsWon || 0) + 1,
      totalStars: save.totalStars,
    });

    this.anim.celebrate();
    setTimeout(() => this.anim.celebrate(), 400);

    this.ui.renderVictory({
      sessionStars: this.sessionStars,
      totalStars: updated.totalStars,
      target: this._sessionTarget,
    });
    this.ui.showVictory();
    this.ui.renderCollection(updated);

    this.audio.playCelebration();
    const rank = getRank(updated.totalStars);
    this.audio.speakPraise('Juara! Hebat sekali!');
    setTimeout(() => {
      if (rank.next) {
        this.audio.speak(
          `${rank.starsToNext} bintang lagi jadi ${rank.next.label}`
        );
      }
    }, 2200);
  }
}

export default Game;
