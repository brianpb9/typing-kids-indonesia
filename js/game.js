/**
 * Game — modes, full word (easy/medium), hard timer, tutorial, categories
 */
import { CONFIG, getMode } from './config.js';
import { WordBank } from './words.js';
import { AudioManager } from './audio.js';
import { AnimationManager } from './animation.js';
import { InputManager } from './input.js';
import { UI } from './ui.js';
import { loadSave, patchSave, getRank } from './storage.js';
import { preloadImages } from './preload.js';
import { getStrings } from './i18n.js';

export class Game {
  constructor() {
    this.words = new WordBank();
    this.audio = new AudioManager();
    this.anim = new AnimationManager();
    this.ui = new UI();

    /** @type {'boot'|'start'|'playing'|'celebrating'|'milestone'|'victory'|'tutorial'} */
    this.state = 'boot';
    this.current = null;
    this.cursor = 0;
    this.sessionStars = 0;
    this._transitionLock = false;
    this._wrongStreak = 0;
    this._milestonesHit = new Set();
    this._sessionTarget = CONFIG.goals.sessionTarget;

    /** @type {'easy'|'medium'|'hard'} */
    this.difficulty = CONFIG.gameplay.defaultDifficulty;
    this.category = CONFIG.gameplay.defaultCategory || 'all';
    /** @type {'id'|'en'} */
    this.language = 'id';

    this._tutorialStep = 0;
    this._timerId = 0;
    this._timerLeft = 0;
    this._timerActive = false;
    this._hardBonusUsed = false;
    this._sessionWordsDone = 0; // successful words this mission
    this._sessionModeLabel = '';
    this._sessionThemeLabel = '';

    this.input = new InputManager({
      onLetter: (letter) => this.handleLetter(letter),
      isActive: () => this.state === 'playing' && !this._transitionLock,
    });
  }

  _mode() {
    return getMode(this.difficulty);
  }

  _t() {
    return this.ui.t || getStrings(this.language);
  }

  async init() {
    const canvas = document.getElementById('fx-canvas');
    if (canvas instanceof HTMLCanvasElement) {
      this.anim.init(canvas);
    }

    const save = loadSave();
    this.difficulty = getMode(save.difficulty).id;
    this.category = save.category || 'all';
    this.language = save.language === 'en' ? 'en' : 'id';
    this.audio.setMuted(save.muted);
    this.ui.setMuteUI(save.muted);
    this.ui.applyLanguage(this.language);
    this.ui.setDifficultyUI(this.difficulty);
    this.ui.setCategoryUI(this.category);
    this.ui.renderCollection(save);
    this._applySpeechLang();

    try {
      await this._loadWordsForLanguage();
    } catch (err) {
      console.error(err);
      this.ui.setEncouragement(this._t().loadError);
      return;
    }

    this.ui.onStart(() => this.requestStart());
    this.ui.onReplay(() => this.startMission());
    this.ui.onHome(() => this.goHome());
    this.ui.onMute(() => this.toggleMute());
    this.ui.onDifficulty((mode) => this.setDifficulty(mode));
    this.ui.onCategory((cat) => this.setCategory(cat));
    this.ui.onLanguage((lang) => this.setLanguage(lang));
    this.ui.onTutorial(
      () => this._tutorialNext(),
      () => this._tutorialFinish(true)
    );
    this.ui.onHelp(() => this.openHelp());

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
      this.ui.setEncouragement(this._t().keyboardHint);
      this.speakCurrentWord();
      this.input.focus();
    });

    this.input.start(this.ui.getKeyCatcher());
    this.ui.showStart();
    this.state = 'start';
  }

  _applySpeechLang() {
    const pack = CONFIG.languages?.[this.language];
    const t = getStrings(this.language);
    this.audio.setSpeechLang(
      pack?.speechLang || t.speechLang,
      t.speechFallback
    );
  }

  async _loadWordsForLanguage() {
    const pack = CONFIG.languages?.[this.language];
    const path = pack?.wordsPath || getStrings(this.language).wordsPath;
    await this.words.load(path);
    this.words.setDifficulty(this.difficulty);
    this.words.setCategory(this.category);
    preloadImages(this.words.imageUrls(30)).catch(() => {});
  }

  /**
   * @param {'id'|'en'|string} lang
   */
  async setLanguage(lang) {
    if (this.state === 'playing' || this.state === 'celebrating') return;
    const next = lang === 'en' ? 'en' : 'id';
    if (next === this.language) return;

    this.language = next;
    this.ui.applyLanguage(this.language);
    this.ui.setDifficultyUI(this.difficulty);
    this.ui.setCategoryUI(this.category);
    this.ui.renderCollection(loadSave());
    this._applySpeechLang();
    patchSave({ language: this.language });
    this.audio.playClick();

    try {
      await this._loadWordsForLanguage();
    } catch (err) {
      console.error(err);
      this.ui.setEncouragement(this._t().loadError);
    }
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
    preloadImages(this.words.imageUrls(20)).catch(() => {});
  }

  /**
   * @param {string} categoryId
   */
  setCategory(categoryId) {
    if (this.state === 'playing' || this.state === 'celebrating') return;
    this.category = categoryId || 'all';
    this.words.setCategory(this.category);
    this.ui.setCategoryUI(this.category);
    patchSave({ category: this.category });
    this.audio.playClick();
    preloadImages(this.words.imageUrls(20)).catch(() => {});
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
    this._stopTimer();
    this._transitionLock = false;
    this.state = 'start';
    this.ui.hideTimer();
    this.ui.renderCollection(loadSave());
    this.ui.showStart();
  }

  /** Start button — maybe show tutorial first */
  requestStart() {
    if (
      this.state === 'playing' ||
      this.state === 'celebrating' ||
      this.state === 'milestone' ||
      this.state === 'tutorial'
    ) {
      return;
    }
    const save = loadSave();
    const done =
      this.language === 'en' ? save.tutorialDoneEn : save.tutorialDone;
    if (!done) {
      this._openTutorial(false);
      return;
    }
    this.startMission();
  }

  /** Help button — re-open tutorial without forcing start */
  openHelp() {
    if (this.state === 'playing' || this.state === 'celebrating') {
      // Pause soft: stop timer, show help
      this._stopTimer();
    }
    this._openTutorial(true);
  }

  /**
   * @param {boolean} helpOnly if true, return to previous screen after
   */
  _openTutorial(helpOnly) {
    this._tutorialStep = 0;
    this._tutorialHelpOnly = helpOnly;
    this._prevState = this.state;
    this.state = 'tutorial';
    this.audio.unlock();
    this.audio.playClick();
    this._showTutorialStep();
  }

  _showTutorialStep() {
    const steps = this._t().tutorial;
    const s = steps[this._tutorialStep];
    if (!s) {
      this._tutorialFinish(false);
      return;
    }
    const isLast = this._tutorialStep >= steps.length - 1;
    this.ui.showTutorialStep({
      ...s,
      nextLabel: isLast
        ? this._tutorialHelpOnly
          ? this._t().parentClose || s.nextLabel
          : s.nextLabel
        : s.nextLabel,
      step: this._tutorialStep,
      total: steps.length,
    });
  }

  _tutorialNext() {
    this.audio.playClick();
    this._tutorialStep += 1;
    if (this._tutorialStep >= this._t().tutorial.length) {
      this._tutorialFinish(false);
      return;
    }
    this._showTutorialStep();
  }

  /**
   * @param {boolean} _skipped
   */
  _tutorialFinish(_skipped) {
    if (this.language === 'en') {
      patchSave({ tutorialDoneEn: true });
    } else {
      patchSave({ tutorialDone: true });
    }
    this.ui.hideTutorial();
    this.audio.playClick();

    if (this._tutorialHelpOnly) {
      this._tutorialHelpOnly = false;
      // Resume game screen if we were playing
      if (this._prevState === 'playing' && this.current) {
        this.state = 'playing';
        this.ui.showGame();
        const mode = this._mode();
        if ((mode.timerSeconds || 0) > 0 && this._timerLeft > 0) {
          this._startTimer(this._timerLeft);
        }
        this.input.focus();
      } else {
        this.state = 'start';
        this.ui.showStart();
      }
      return;
    }
    this.startMission();
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
    this._sessionWordsDone = 0;
    this._milestonesHit = new Set();
    this._wrongStreak = 0;
    this._transitionLock = false;
    this._hardBonusUsed = false;
    this._stopTimer();

    this.words.setDifficulty(this.difficulty);
    this.words.setCategory(this.category);
    // Progressive: start with shorter words
    if (CONFIG.gameplay.progressiveDifficulty) {
      const mode = this._mode();
      const startMax = Math.min(mode.minLetters + 1, mode.maxLetters);
      this.words.refillProgressive(startMax);
    }
    if (this.words.lastPoolUsedFallback?.()) {
      this.category = 'all';
      this.words.setCategory('all');
      this.ui.setCategoryUI('all');
    }

    this.ui.setDifficultyUI(this.difficulty);
    this.ui.setCategoryUI(this.category);
    this.ui.showGame();
    this.ui.applyModeLayout();
    this.ui.setSessionStars(0, this._sessionTarget);
    this._sessionModeLabel = this._t().modes[this.difficulty]?.name || this.difficulty;
    this._sessionThemeLabel =
      this._t().categories[this.category] || this.category;

    if (this.words.lastPoolUsedFallback?.()) {
      this.ui.setEncouragement(this._t().poolFallback);
    }

    this.state = 'playing';
    preloadImages(this.words.imageUrls(40)).catch(() => {});
    this.loadNextWord();
    this.input.focus();
  }

  /** Progressive max letters based on stars earned this mission */
  _preferMaxLetters() {
    const mode = this._mode();
    if (!CONFIG.gameplay.progressiveDifficulty) return mode.maxLetters;
    // Ramp: +1 letter length every 2 stars
    const ramp = mode.minLetters + Math.floor(this.sessionStars / 2) + 1;
    return Math.min(Math.max(ramp, mode.minLetters), mode.maxLetters);
  }

  loadNextWord() {
    this._stopTimer();
    this._transitionLock = false;
    this._wrongStreak = 0;
    this._hardBonusUsed = false;

    if (CONFIG.gameplay.progressiveDifficulty) {
      this.words.refillProgressive(this._preferMaxLetters());
    }

    this.current = this.words.next();
    if (!this.current) return;

    this.cursor = 0;
    const mode = this._mode();
    this.ui.applyModeLayout();
    this.ui.setWord(this.current, this.sessionStars, {
      showFullWord: Boolean(mode.showFullWord),
    });
    this.ui.setEncouragement(this._goalEncouragement());
    this.state = 'playing';
    this.input.focus();

    preloadImages(this.words.imageUrls(12)).catch(() => {});

    setTimeout(() => {
      this.speakCurrentWord();
      this.input.focus();
    }, CONFIG.timing.speakDelayAfterLoadMs);

    if ((mode.timerSeconds || 0) > 0) {
      this._startTimer(mode.timerSeconds);
    } else {
      this.ui.hideTimer();
    }
  }

  _startTimer(seconds) {
    this._stopTimer();
    this._timerLeft = seconds;
    this._timerActive = true;
    this.ui.setTimer(this._timerLeft, { urgent: false });

    this._timerId = window.setInterval(() => {
      if (!this._timerActive || this.state !== 'playing') return;
      this._timerLeft -= 1;

      // One-time bonus near end if child has progress
      const bonusAt = CONFIG.gameplay.hardBonusTriggerAt ?? 5;
      const bonusSec = CONFIG.gameplay.hardBonusSeconds ?? 10;
      if (
        !this._hardBonusUsed &&
        this.cursor > 0 &&
        this._timerLeft === bonusAt
      ) {
        this._hardBonusUsed = true;
        this._timerLeft += bonusSec;
        this.ui.setEncouragement(this._t().bonusTime);
        this.audio.playSparkle();
      }

      const urgent = this._timerLeft <= 8;
      this.ui.setTimer(this._timerLeft, { urgent });
      if (this._timerLeft <= 0) {
        this._onTimeout();
      }
    }, 1000);
  }

  _stopTimer() {
    this._timerActive = false;
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = 0;
    }
  }

  /** Hard mode: time ran out — no-fail soft skip */
  _onTimeout() {
    if (this.state !== 'playing' || this._transitionLock) return;
    this._stopTimer();
    this._transitionLock = true;
    this.state = 'celebrating';

    this.ui.setEncouragement(this._t().timeout);
    this.audio.playWrong();
    this.ui.shakeWord();

    setTimeout(() => {
      this.ui.hidePraise();
      setTimeout(() => this.loadNextWord(), CONFIG.timing.nextWordDelayMs);
    }, 1400);
  }

  _goalEncouragement() {
    const t = this._t();
    const left = this._sessionTarget - this.sessionStars;
    const mode = this._mode();
    if (this.sessionStars === 0 && mode.id === 'hard') {
      return t.hardStart;
    }
    if (left <= 2 && left > 0) {
      return left === 1 ? t.oneStarLeft : t.nStarsLeft(left);
    }
    if (this.sessionStars === 0) {
      return t.chaseStars(this._sessionTarget);
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
        left <= 3 ? this._goalEncouragement() : this._t().yesContinue
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

    const letterHintAt = mode.hintLetterAfterWrongs;
    if (letterHintAt > 0 && this._wrongStreak >= letterHintAt && this.current) {
      const need = this.current.word[this.cursor]?.toUpperCase() || '';
      this.ui.setEncouragement(this._t().findLetter(need));
      if (this._wrongStreak === letterHintAt || this._wrongStreak % 5 === 0) {
        this.speakCurrentWord();
      }
      return;
    }

    if (mode.id === 'hard') {
      this.ui.setEncouragement(
        this._wrongStreak >= 3
          ? this._t().hardRetry
          : this.words.randomEncouragement()
      );
      if (this._wrongStreak === 3 || this._wrongStreak % 4 === 0) {
        this.speakCurrentWord();
      }
      return;
    }

    // Easy / medium: full word already visible — gentle nudge
    this.ui.setEncouragement(this.words.randomEncouragement());
    if (this._wrongStreak >= 4 && this._wrongStreak % 3 === 0) {
      this.speakCurrentWord();
    }
  }

  _onWordComplete() {
    this._stopTimer();
    this.state = 'celebrating';
    this._transitionLock = true;
    this.sessionStars += 1;
    this._sessionWordsDone += 1;

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
    const t = this._t();
    const list = (t.milestones || []).filter(
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
    this._stopTimer();
    this.state = 'victory';
    this._transitionLock = true;

    const updated = patchSave({
      missionsWon: (save.missionsWon || 0) + 1,
      totalStars: save.totalStars,
    });

    this.anim.celebrate();
    setTimeout(() => this.anim.celebrate(), 400);

    const t = this._t();
    const rank = getRank(updated.totalStars, t.ranks);
    this.ui.renderVictory({
      sessionStars: this.sessionStars,
      totalStars: updated.totalStars,
      target: this._sessionTarget,
    });
    this.ui.renderParentSummary({
      words: this._sessionWordsDone,
      mode: this._sessionModeLabel,
      theme: this._sessionThemeLabel,
      lang: this.language === 'en' ? 'English' : 'Bahasa Indonesia',
      rank: `${rank.emoji} ${rank.label}`,
      total: updated.totalStars,
    });
    this.ui.showVictory();
    this.ui.renderCollection(updated);

    this.audio.playCelebration();
    this.audio.speakPraise(t.victorySpeech);
    setTimeout(() => {
      if (rank.next) {
        this.audio.speak(
          t.victorySpeechRank(rank.starsToNext, rank.next.label)
        );
      }
    }, 2200);
  }
}

export default Game;
