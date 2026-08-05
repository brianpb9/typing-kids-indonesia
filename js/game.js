/**
 * Game — modes, OSK, daily/weekly, achievements, mastery, classroom, certificate
 */
import { CONFIG, getMode } from './config.js';
import { WordBank, nextMaxLetters } from './words.js';
import { AudioManager } from './audio.js';
import { AnimationManager } from './animation.js';
import { InputManager } from './input.js';
import { UI } from './ui.js';
import {
  loadSave,
  patchSave,
  getRank,
  recordPlayDay,
  recordMastery,
  addSessionStats,
  accuracyPct,
  masteryStats,
  isLetterMasteryId,
  isCharMasteryId,
  pushClassScore,
  unlockAchievements,
  buildShareText,
  classBoardCsv,
} from './storage.js';
import { preloadImages, preloadAudio } from './preload.js';
import {
  whenIdle,
  warmFetch,
  imagePathsFromWords,
  swCacheUrls,
} from './cache.js';
import { getStrings } from './i18n.js';
import { getDailyMission, dateKey, applyDailyToSave } from './daily.js';
import { getWeeklyMission, applyWeeklyToSave } from './weekly.js';
import {
  generateClassCode,
  normalizeCode,
  resolveClassroom,
  classShareUrl,
  classCodeFromUrl,
} from './classroom.js';
import { BADGES, evaluateAchievements, getBadge } from './achievements.js';
import { letterSpeakName } from './letters.js';
import { track } from './analytics.js';
import { renderCertificate, shareCertificate } from './certificate.js';
import { getFriendship } from './friendship.js';

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

    /** @type {'easy'|'medium'|'hard'|'letters'} */
    this.difficulty = CONFIG.gameplay.defaultDifficulty;
    this.category = CONFIG.gameplay.defaultCategory || 'all';
    /** @type {'id'|'en'} */
    this.language = 'id';

    this._tutorialStep = 0;
    this._timerId = 0;
    this._timerLeft = 0;
    this._timerActive = false;
    this._hardBonusUsed = false;
    this._sessionWordsDone = 0;
    this._sessionModeLabel = '';
    this._sessionThemeLabel = '';
    this._combo = 0;
    this._sessionBestCombo = 0;
    /** @type {'normal'|'daily'|'weekly'|'class'} */
    this._missionKind = 'normal';
    this._classCode = '';
    this._lastShareText = '';
    this._sessionKeys = 0;
    this._sessionWrong = 0;
    this._sessionStartMs = 0;
    this._certData = null;
    /** @type {'mini'|'full'} */
    this._missionLength =
      CONFIG.gameplay.defaultMissionLength === 'mini' ? 'mini' : 'full';
    /** Wrong keys on current word (for perfect-word bonus) */
    this._wordWrongs = 0;
    /** Adaptive difficulty: wrongs on the last completed word */
    this._lastWordWrongs = 0;
    /** Adaptive difficulty: consecutive 0-wrong word completions */
    this._fluentStreak = 0;
    this._prevFriendshipId = '';
    /** @type {string|null} active friend companion this mission */
    this._friend = null;
    /** Pending gameplay timeouts (cancelled on goHome) */
    this._pendingTimers = new Set();

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
    this._classCode = save.classCode || '';
    this.audio.setMuted(save.muted);
    this.ui.setMuteUI(save.muted);
    this.ui.applyLanguage(this.language);
    this.ui.setDifficultyUI(this.difficulty);
    this.ui.setCategoryUI(this.category);
    this.ui.applyA11y(save.a11y);
    this.ui.setPlayerName(save.playerName || '');
    this.ui.renderCollection(save);
    this._refreshParentDash();
    this._applySpeechLang();
    this._refreshDailyUI();
    this._refreshWeeklyUI();
    this._refreshClassUI();

    this.audio.onSpeakingChange = (on) => this.ui.setSpeakingPulse(on);
    this.audio.loadVoicePack().catch(() => {});

    const urlCode = classCodeFromUrl();
    if (urlCode) this._joinClass(urlCode, { silent: true });

    // Parental gate must be active even if word data fails to load
    // (offline first-run) — bind before _loadWordsForLanguage
    this._bindParentGate();

    try {
      await this._loadWordsForLanguage();
    } catch (err) {
      console.error(err);
      this.ui.showLoadError(this._t().loadError, () => this._retryLoadWords());
      return;
    }

    this._afterWordsLoaded();
  }

  /** "Coba lagi" path — re-fetch word data after a failed init load */
  async _retryLoadWords() {
    this.ui.hideLoadError();
    try {
      await this._loadWordsForLanguage();
    } catch (err) {
      console.error(err);
      this.ui.showLoadError(this._t().loadError, () => this._retryLoadWords());
      return;
    }
    this._afterWordsLoaded();
  }

  /**
   * Parent dashboard stays behind the parental gate — intercept the
   * <details> toggle and ask the multiplication question first.
   * Bound once in init() before words load, so the gate is active even
   * when word data fails to load (offline first-run).
   */
  _bindParentGate() {
    const parentDash = this.ui.els.parentDash;
    parentDash?.querySelector('summary')?.addEventListener('click', (e) => {
      if (parentDash.open || this.ui.gatePassed()) return; // closing is free
      e.preventDefault();
      this.ui.requireGate(() => {
        parentDash.open = true;
      });
    });
  }

  /** Second half of init — runs once word data is available */
  _afterWordsLoaded() {
    // Offline warm: shell SW already installed; media warmed in background
    whenIdle(() => {
      try {
        navigator.serviceWorker?.controller?.postMessage({ type: 'WARM_MEDIA' });
      } catch {
        /* ignore */
      }
      this.audio.warmVoiceCache(0).catch(() => {});
      this._warmAllImages().catch(() => {});
    }, 1200);

    this.ui.setMissionLengthUI(this._missionLength);
    this._applyMissionLengthTarget();
    this._refreshStickerBook();
    this.ui.setStationUI('meadow');
    {
      const s = loadSave();
      const stickers = Object.entries(s.mastery || {}).filter(
        ([id, m]) =>
          !isLetterMasteryId(id) && !isCharMasteryId(id) && (m?.count || 0) >= 1
      ).length;
      this._prevFriendshipId = getFriendship(s.totalStars || 0, stickers).id;
    }

    this.ui.onStart(() => this.requestStart());
    this.ui.onReplay(() => this.startMission());
    this.ui.onHome(() => this.goHome());
    this.ui.onBack(() => this.goHome());
    this.ui.onMute(() => this.toggleMute());

    // Escape / Backspace-long not used — Esc returns home during play
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (
        this.state === 'playing' ||
        this.state === 'celebrating' ||
        this.state === 'milestone' ||
        this.state === 'victory'
      ) {
        e.preventDefault();
        this.goHome();
      }
    });
    this.ui.onDifficulty((mode) => this.setDifficulty(mode));
    this.ui.onCategory((cat) => this.setCategory(cat));
    this.ui.onLanguage((lang) => this.setLanguage(lang));
    this.ui.onTutorial(
      () => this._tutorialNext(),
      () => this._tutorialFinish(true)
    );
    this.ui.onHelp(() => this.openHelp());
    this.ui.onDaily(() => this.startDailyMission());
    this.ui.onWeekly(() => this.startWeeklyMission());
    this.ui.onShare(() =>
      this.ui.requireGate(() => this.shareParentSummary())
    );
    this.ui.onMissionLength((len) => this.setMissionLength(len));
    this.ui.onStation((st) => this.pickStation(st));
    this.ui.onCert(() => this.ui.requireGate(() => this.shareCertificate()));
    this.ui.onChildName((name) => {
      patchSave({ childName: name });
    });
    this.ui.onOsk((letter) => this.input.virtualKey(letter));
    this.ui.onA11y({
      onContrast: (v) => this._setA11y({ highContrast: v }),
      onLarge: (v) => this._setA11y({ largeText: v }),
      onAnalytics: (v) => {
        patchSave({ analyticsOptIn: v });
        this._refreshParentDash();
      },
    });
    this.ui.onEraseData(() => this.eraseAllData());
    this.ui.onClassroom({
      onJoin: (code) => this._joinClass(code),
      onCreate: () => this._createClass(),
      onShare: () => this.ui.requireGate(() => this._shareClass()),
      onClear: () => this._clearClass(),
      onExport: () => this._exportClassCsv(),
      onPlay: () => this.startClassMission(),
    });

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
    this.audio.setLangCode(this.language);
    this.audio.setSpeechLang(
      pack?.speechLang || t.speechLang,
      t.speechFallback
    );
  }

  _setA11y(partial) {
    const save = loadSave();
    const a11y = { ...save.a11y, ...partial };
    patchSave({ a11y });
    this.ui.applyA11y(a11y);
  }

  _refreshParentDash() {
    const save = loadSave();
    const t = this._t();
    const m = masteryStats(save.mastery);
    const totalWords = this.words.words?.length || 100;
    const badgeLabels = BADGES.map((b) => ({
      id: b.id,
      emoji: b.emoji,
      title: t[b.titleId] || b.id,
      unlocked: (save.achievements || []).includes(b.id),
    }));
    this.ui.renderParentDash({
      totalStars: save.totalStars || 0,
      missionsWon: save.missionsWon || 0,
      accuracy: accuracyPct(save.stats),
      masteryLine: t.masteryLine(m.mastered, m.seen, totalWords),
      playMin: Math.round((save.stats?.playMs || 0) / 60000),
      achievements: save.achievements || [],
      analyticsOptIn: Boolean(save.analyticsOptIn),
      a11y: save.a11y || {},
      childName: save.childName || '',
      badgeLabels,
    });
    this.ui.renderCollection(save);
  }

  _refreshDailyUI() {
    if (!CONFIG.features.dailyChallenge) {
      this.ui.els.dailyCard?.classList.add('hidden');
      return;
    }
    const mission = getDailyMission();
    const save = loadSave();
    const day = mission.key;
    const daily =
      save.daily?.key === day
        ? save.daily
        : { key: day, completed: false, stars: 0 };
    const t = this._t();
    this.ui.renderDaily({
      desc: t.dailyDesc(
        t.categories[mission.category] || mission.category,
        t.modes[mission.mode]?.name || mission.mode,
        mission.target
      ),
      done: Boolean(daily.completed),
    });
  }

  _refreshWeeklyUI() {
    if (!CONFIG.features.weeklyChallenge) {
      this.ui.els.weeklyCard?.classList.add('hidden');
      return;
    }
    const mission = getWeeklyMission();
    const save = loadSave();
    const weekly =
      save.weekly?.key === mission.key
        ? save.weekly
        : { key: mission.key, completed: false, stars: 0 };
    const t = this._t();
    this.ui.renderWeekly({
      desc: t.weeklyDesc(
        t.categories[mission.category] || mission.category,
        t.modes[mission.mode]?.name || mission.mode,
        mission.target
      ),
      done: Boolean(weekly.completed),
    });
  }

  _refreshClassUI() {
    if (!CONFIG.features.multiplayer) {
      this.ui.els.classPanel?.classList.add('hidden');
      return;
    }
    this.ui.renderClassroom({ code: this._classCode || null });
    if (this._classCode) {
      const save = loadSave();
      this.ui.renderClassBoard(save.classBoard?.[this._classCode] || []);
    } else {
      this.ui.renderClassBoard([]);
    }
  }

  async _loadWordsForLanguage() {
    const pack = CONFIG.languages?.[this.language];
    const path = pack?.wordsPath || getStrings(this.language).wordsPath;
    await this.words.load(path);
    this.words.setLanguage(this.language);
    this.words.setDifficulty(this.difficulty);
    this.words.setCategory(this.category);
    // Priority: first batch for current pool
    preloadImages(this.words.imageUrls(30)).catch(() => {});
  }

  /** Warm all word images for offline play */
  async _warmAllImages() {
    const paths = imagePathsFromWords(this.words.words || []);
    if (!paths.length) return;
    swCacheUrls(paths);
    // Decode via Image() for smoother first paint
    await preloadImages(paths, 8);
    // Also fetch so SW stores response bodies
    await warmFetch(paths, { concurrency: 6 });
  }

  async setLanguage(lang) {
    if (this.state === 'playing' || this.state === 'celebrating') return;
    const next = lang === 'en' ? 'en' : 'id';
    if (next === this.language) return;
    this.language = next;
    this.ui.applyLanguage(this.language);
    this.ui.setDifficultyUI(this.difficulty);
    this.ui.setCategoryUI(this.category);
    this._applySpeechLang();
    this._refreshDailyUI();
    this._refreshWeeklyUI();
    this._refreshClassUI();
    this._refreshParentDash();
    patchSave({ language: this.language });
    this.audio.playClick();
    try {
      await this._loadWordsForLanguage();
    } catch (err) {
      console.error(err);
      this.ui.setEncouragement(this._t().loadError);
    }
  }

  setDifficulty(mode) {
    if (this.state === 'playing' || this.state === 'celebrating') return;
    this.difficulty = getMode(mode).id;
    this.words.setDifficulty(this.difficulty);
    this.ui.setDifficultyUI(this.difficulty);
    patchSave({ difficulty: this.difficulty });
    this.audio.playClick();
    preloadImages(this.words.imageUrls(20)).catch(() => {});
  }

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
    this._clearPendingTimers();
    this.audio.stopSpeech();
    this._transitionLock = false;
    this.state = 'start';
    this.current = null;
    this.cursor = 0;
    this.ui.closeGate();
    this.ui.hideTimer();
    this.ui.hidePraise();
    this.ui.hideMilestone();
    this.ui.hidePoppuSay();
    this.ui.setCombo(0);
    this.ui.setOskTarget('');
    this._refreshParentDash();
    this._refreshDailyUI();
    this._refreshWeeklyUI();
    this._refreshClassUI();
    this._refreshStickerBook();
    this.audio.playClick();
    this.ui.showStart();
  }

  /**
   * GDPR-K erasure from the gated parent dashboard: wipe every
   * localStorage key owned by this app, then restart on the start screen.
   */
  eraseAllData() {
    this._stopTimer();
    this._clearPendingTimers();
    this.audio.stopSpeech();
    try {
      const doomed = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('typingKids')) doomed.push(k);
      }
      doomed.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* private mode — in-memory state is dropped by the reload anyway */
    }
    // Fresh boot without query string = clean start screen
    window.location.assign(window.location.pathname);
  }

  /**
   * @param {'mini'|'full'} length
   */
  setMissionLength(length) {
    if (this.state === 'playing' || this.state === 'celebrating') return;
    this._missionLength = length === 'mini' ? 'mini' : 'full';
    this._applyMissionLengthTarget();
    this.ui.setMissionLengthUI(this._missionLength);
    this.audio.playClick();
  }

  _applyMissionLengthTarget() {
    if (this._missionKind === 'daily' || this._missionKind === 'weekly' || this._missionKind === 'class') {
      return; // those set their own targets
    }
    const mini = CONFIG.gameplay.miniTarget || 5;
    const full = CONFIG.gameplay.fullTarget || CONFIG.goals.sessionTarget || 10;
    this._sessionTarget =
      this._missionLength === 'mini' ? mini : full;
    if (this.difficulty === 'letters') {
      this._sessionTarget =
        this._missionLength === 'mini' ? mini : full;
    }
    this.ui.setSessionTarget(this._sessionTarget);
  }

  _refreshStickerBook() {
    if (!CONFIG.features.stickers) return;
    const save = loadSave();
    this.ui.renderStickerBook({
      words: this.words.words || [],
      mastery: save.mastery || {},
      onTap: (w) => {
        this.audio.unlock();
        if (isCharMasteryId(w.id)) {
          // Friend sticker — play that friend's voice, Poppu as fallback
          const fid = w.id.replace(/^char-/, '');
          this.audio.playVoiceReaction('leveldone', fid).then((ok) => {
            if (!ok) this.audio.playVoiceReaction('leveldone');
          });
        } else {
          this.audio.speakWord(w.display, w.id);
        }
        this.audio.playClick();
      },
    });
  }

  _randomPoppuEncourage() {
    const list = this._t().poppuEncourage || [];
    if (!list.length) return this._t().encouragementDefault;
    return list[Math.floor(Math.random() * list.length)];
  }

  /**
   * World map station → mode + start
   * @param {'abc'|'meadow'|'castle'} station
   */
  pickStation(station) {
    if (
      this.state === 'playing' ||
      this.state === 'celebrating' ||
      this.state === 'milestone' ||
      this.state === 'tutorial'
    ) {
      return;
    }
    this.ui.setStationUI(station);
    this.audio.playClick();
    if (station === 'abc') {
      this.setDifficulty('letters');
      this.setMissionLength(this._missionLength === 'full' ? 'full' : 'mini');
    } else if (station === 'castle') {
      this.setDifficulty('hard');
    } else {
      this.setDifficulty('easy');
    }
    // Auto-start for map magic (after optional tutorial)
    this.requestStart();
  }

  /**
   * Canon friend for the current mission context (null → Poppu only).
   * letters→Peeky, easy→Puffy, hard→Orby, daily→Zaza (CONFIG.friendsByStation).
   */
  _activeFriendId() {
    const map = CONFIG.friendsByStation || {};
    if (this._missionKind === 'daily') return map.daily || null;
    if (this._missionKind !== 'normal') return null;
    return map[this.difficulty] || null;
  }

  requestStart() {
    if (
      this.state === 'playing' ||
      this.state === 'celebrating' ||
      this.state === 'milestone' ||
      this.state === 'tutorial'
    ) {
      return;
    }

    // Free play — never auto-override with class code (use "Main kelas")
    this._missionKind = 'normal';
    this._applyMissionLengthTarget();

    const save = loadSave();
    const done =
      this.language === 'en' ? save.tutorialDoneEn : save.tutorialDone;
    if (!done) {
      this._openTutorial(false);
      return;
    }
    this.startMission();
  }

  /** Explicit class mission (does not run on free "Mulai Misi") */
  startClassMission() {
    if (!this._canStartMission()) return;
    if (!this._classCode) {
      this.ui.setClassMsg(this._t().classNeedCode || '');
      return;
    }
    const cls = resolveClassroom(this._classCode);
    if (!cls) return;
    this._missionKind = 'class';
    this._applyMissionParams(cls.mode, cls.category, cls.target);
    const save = loadSave();
    this._maybeTutorialThenStart(save);
  }

  startDailyMission() {
    if (!this._canStartMission()) return;
    const mission = getDailyMission();
    const save = loadSave();
    // Allow replay after complete (still marks daily done once)
    this._missionKind = 'daily';
    this._applyMissionParams(mission.mode, mission.category, mission.target);
    this._maybeTutorialThenStart(save);
  }

  startWeeklyMission() {
    if (!this._canStartMission()) return;
    const mission = getWeeklyMission();
    const save = loadSave();
    // Allow replay after complete
    this._missionKind = 'weekly';
    this._applyMissionParams(mission.mode, mission.category, mission.target);
    this._maybeTutorialThenStart(save);
  }

  _canStartMission() {
    return !(
      this.state === 'playing' ||
      this.state === 'celebrating' ||
      this.state === 'milestone' ||
      this.state === 'tutorial'
    );
  }

  _applyMissionParams(mode, category, target) {
    this.difficulty = mode;
    this.category = category;
    this._sessionTarget = target;
    this.ui.setSessionTarget(target);
    this.ui.setDifficultyUI(this.difficulty);
    this.ui.setCategoryUI(this.category);
    this.words.setDifficulty(this.difficulty);
    this.words.setCategory(this.category);
    patchSave({ difficulty: this.difficulty, category: this.category });
  }

  _maybeTutorialThenStart(save) {
    const done =
      this.language === 'en' ? save.tutorialDoneEn : save.tutorialDone;
    if (!done) {
      this._openTutorial(false);
      return;
    }
    this.startMission();
  }

  _joinClass(raw, opts = {}) {
    const code = normalizeCode(raw);
    const cls = resolveClassroom(code);
    if (!cls) return;
    this._classCode = cls.code;
    patchSave({ classCode: cls.code });
    // Class params apply only via "Main kelas" (startClassMission) —
    // free-play difficulty/category/target stay untouched here
    this._refreshClassUI();
    if (!opts.silent) {
      this.audio.playClick();
      this.ui.setClassMsg(this._t().classActive(cls.code));
    }
  }

  _createClass() {
    this._joinClass(generateClassCode());
  }

  async _shareClass() {
    if (!this._classCode) return;
    const url = classShareUrl(this._classCode);
    const text = `${this._t().classActive(this._classCode)}\n${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: this._t().classTitle, text, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        this.ui.setClassMsg(this._t().classCopied);
      } else {
        this.ui.setClassMsg(url);
      }
    } catch {
      try {
        await navigator.clipboard?.writeText(text);
        this.ui.setClassMsg(this._t().classCopied);
      } catch {
        this.ui.setClassMsg(url);
      }
    }
    this.audio.playClick();
  }

  async _exportClassCsv() {
    if (!this._classCode) return;
    const csv = classBoardCsv(this._classCode);
    try {
      await navigator.clipboard?.writeText(csv);
      this.ui.setClassMsg(this._t().classExported);
    } catch {
      this.ui.setClassMsg(csv.slice(0, 80) + '…');
    }
    this.audio.playClick();
  }

  _clearClass() {
    this._classCode = '';
    this._missionKind = 'normal';
    // Back to the player's own mini/full pick (not the class target)
    this._applyMissionLengthTarget();
    patchSave({ classCode: '' });
    this._refreshClassUI();
    this.ui.setClassMsg('');
    this.audio.playClick();
  }

  openHelp() {
    if (this.state === 'playing' || this.state === 'celebrating') {
      this._stopTimer();
    }
    this._openTutorial(true);
  }

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
    // Voice-narrated tutorial: pre-readers can't read the steps, so each
    // step is spoken aloud in the active language (respects mute).
    this.audio.speak(`${s.title}. ${s.body}`);
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

  _tutorialFinish(_skipped) {
    this._clearPendingTimers();
    this.audio.stopSpeech();
    if (this.language === 'en') patchSave({ tutorialDoneEn: true });
    else patchSave({ tutorialDone: true });
    this.ui.hideTutorial();
    this.audio.playClick();

    if (this._tutorialHelpOnly) {
      this._tutorialHelpOnly = false;
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
    this._combo = 0;
    this._sessionBestCombo = 0;
    this._sessionKeys = 0;
    this._sessionWrong = 0;
    this._sessionStartMs = Date.now();
    this._transitionLock = false;
    this._hardBonusUsed = false;
    // Adaptive difficulty resets per mission
    this._lastWordWrongs = 0;
    this._fluentStreak = 0;
    this.ui.setKbHintBoost(false);
    this._stopTimer();

    if (this._missionKind === 'normal') {
      this._applyMissionLengthTarget();
    }
    this.ui.setSessionTarget(this._sessionTarget);
    this.ui.buildJourney(this._sessionTarget);
    this.ui.setCombo(0);

    this.words.setDifficulty(this.difficulty);
    this.words.setCategory(this.category);
    if (
      CONFIG.gameplay.progressiveDifficulty &&
      this.difficulty !== 'letters'
    ) {
      const mode = this._mode();
      const startMax = Math.min(mode.minLetters + 1, mode.maxLetters);
      this.words.refillProgressive(startMax);
    } else {
      this.words.refillProgressive?.(this._mode().maxLetters);
      // force refill for letters
      this.words.setDifficulty(this.difficulty);
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
    this._sessionModeLabel =
      this._t().modes[this.difficulty]?.name || this.difficulty;
    this._sessionThemeLabel =
      this._t().categories[this.category] || this.category;

    if (this.words.lastPoolUsedFallback?.()) {
      this.ui.setEncouragement(this._t().poolFallback);
    }

    this.state = 'playing';
    track('mission_start', {
      mode: this.difficulty,
      kind: this._missionKind,
    });

    // Friend companion for this context (corner buddy + voice pool)
    this._friend = this._activeFriendId();
    this.audio.setActiveFriend(this._friend);
    this.ui.setCompanion(this._friend);

    preloadImages(this.words.imageUrls(40)).catch(() => {});
    this.loadNextWord();
    if (this._friend) {
      const name = this._t().friendNames?.[this._friend] || this._friend;
      this.ui.setEncouragement(
        this._t().friendJoin ? this._t().friendJoin(name) : name
      );
    }
    this.input.focus();
  }

  _preferMaxLetters() {
    const mode = this._mode();
    if (mode.id === 'letters') return 1;
    if (!CONFIG.gameplay.progressiveDifficulty) return mode.maxLetters;
    const ramp = mode.minLetters + Math.floor(this.sessionStars / 2) + 1;
    const base = Math.min(Math.max(ramp, mode.minLetters), mode.maxLetters);
    // Gentle adaptation on top of the star ramp (see nextMaxLetters)
    return nextMaxLetters(base, this._lastWordWrongs, this._fluentStreak, mode);
  }

  /**
   * Adaptive difficulty bookkeeping — runs when a word completes, before
   * loadNextWord resets _wordWrongs. Struggling (≥3 wrong) steps the next
   * word down 1 letter and (easy only) re-shows the keyboard hint for one
   * word; 2 consecutive 0-wrong words let the ramp run 1 letter ahead.
   */
  _updateAdaptation() {
    const mode = this._mode();
    if (!CONFIG.gameplay.progressiveDifficulty || mode.id === 'letters') return;
    const wrongs = this._wordWrongs;
    if (wrongs >= 3) {
      this._fluentStreak = 0;
      this.ui.setKbHintBoost(mode.id === 'easy');
    } else {
      this._fluentStreak = wrongs === 0 ? this._fluentStreak + 1 : 0;
      this.ui.setKbHintBoost(false);
    }
    this._lastWordWrongs = wrongs;
  }

  _preloadUpcoming() {
    const n = CONFIG.gameplay.preloadVoiceCount || 5;
    const ids = this.words.peekIds?.(n) || [];
    const paths = this.audio.packPathsForIds(ids);
    preloadAudio(paths).catch(() => {});
    preloadImages(this.words.imageUrls(12)).catch(() => {});
  }

  loadNextWord() {
    if (
      this.state !== 'playing' &&
      this.state !== 'celebrating' &&
      this.state !== 'milestone'
    ) {
      return;
    }
    this._stopTimer();
    this._transitionLock = false;
    this._wrongStreak = 0;
    this._hardBonusUsed = false;

    if (
      CONFIG.gameplay.progressiveDifficulty &&
      this.difficulty !== 'letters'
    ) {
      this.words.refillProgressive(this._preferMaxLetters());
    }

    this.current = this.words.next();
    if (!this.current) return;

    this.cursor = 0;
    this._wordWrongs = 0;
    const mode = this._mode();
    this.ui.applyModeLayout();
    this.ui.setWord(this.current, this.sessionStars, {
      showFullWord: Boolean(mode.showFullWord),
      dimTypedLetters: Boolean(mode.dimTypedLetters),
    });
    this.ui.setOskTarget(
      mode.oskHint === false ? '' : this.current.word[0] || ''
    );
    this.ui.setEncouragement(this._goalEncouragement());
    this.ui.showPoppuSay(
      this._t().poppuStart
        ? this._t().poppuStart(this.current.display)
        : this.current.display,
      2000
    );
    this.state = 'playing';
    this.input.focus();
    this._preloadUpcoming();

    this._defer(() => {
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
        this.audio.speakPhrase('bonus', this._t().bonusTime);
      }

      const urgent = this._timerLeft <= 8;
      this.ui.setTimer(this._timerLeft, { urgent });
      if (this._timerLeft <= 0) this._onTimeout();
    }, 1000);
  }

  _stopTimer() {
    this._timerActive = false;
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = 0;
    }
  }

  /**
   * Gameplay timeout — tracked so goHome() can cancel pending callbacks.
   * The callback no-ops once the game has left the play states.
   * @param {() => void} fn
   * @param {number} ms
   */
  _defer(fn, ms) {
    const id = setTimeout(() => {
      this._pendingTimers.delete(id);
      if (
        this.state !== 'playing' &&
        this.state !== 'celebrating' &&
        this.state !== 'milestone'
      ) {
        return;
      }
      fn();
    }, ms);
    this._pendingTimers.add(id);
    return id;
  }

  /** Cancel all pending gameplay timeouts. */
  _clearPendingTimers() {
    for (const id of this._pendingTimers) clearTimeout(id);
    this._pendingTimers.clear();
  }

  _onTimeout() {
    if (this.state !== 'playing' || this._transitionLock) return;
    this._stopTimer();
    this._transitionLock = true;
    this.state = 'celebrating';
    this._combo = 0;
    this.ui.setCombo(0);

    this.ui.setEncouragement(this._t().timeout);
    this.audio.playWrong();
    this.audio.speakPhrase('timeout', this._t().timeout);
    this.ui.shakeWord();

    this._defer(() => {
      this.ui.hidePraise();
      this._defer(() => this.loadNextWord(), CONFIG.timing.nextWordDelayMs);
    }, 1400);
  }

  _goalEncouragement() {
    const t = this._t();
    const left = this._sessionTarget - this.sessionStars;
    const mode = this._mode();
    if (this.sessionStars === 0 && mode.id === 'hard') return t.hardStart;
    if (this.sessionStars === 0 && mode.id === 'letters') {
      return t.typeThisLetter;
    }
    if (left <= 2 && left > 0) {
      return left === 1 ? t.oneStarLeft : t.nStarsLeft(left);
    }
    if (this.sessionStars === 0) return t.chaseStars(this._sessionTarget);
    return this.words.randomEncouragement();
  }

  speakCurrentWord() {
    if (!this.current) return;
    this.audio.unlock();
    if (this.current.isLetter || this.difficulty === 'letters') {
      const name = letterSpeakName(this.current.word, this.language);
      this.audio.speakLetter(name);
      return;
    }
    this.audio.speakWord(this.current.display, this.current.id);
  }

  handleLetter(letter) {
    if (!this.current || this.state !== 'playing' || this._transitionLock) return;
    const target = this.current.word[this.cursor];
    if (!target) return;
    this.input.focus();
    this._sessionKeys += 1;
    if (letter === target) this._onCorrect();
    else this._onWrong(letter);
  }

  _onCorrect() {
    if (!this.current) return;
    this._wrongStreak = 0;
    const index = this.cursor;
    const typed = this.current.word[index];
    this.cursor += 1;

    const mode = this._mode();
    this.ui.flashOskKey(typed, 'ok');

    if (mode.showSlots) {
      this.ui.renderSlots(this.current.word, this.cursor);
    } else {
      if (mode.dimTypedLetters) {
        this.ui.updateFullWordProgress(this.cursor);
      }
      if (mode.showBigLetter) {
        if (this.cursor < this.current.word.length) {
          this.ui.setTargetLetter(this.current.word[this.cursor]);
        } else {
          this.ui.setTargetLetter('');
        }
      }
      this.ui.setOskTarget(
        mode.oskHint === false || this.cursor >= this.current.word.length
          ? ''
          : this.current.word[this.cursor]
      );
    }

    if (mode.showLetterProgress) {
      this.ui.setProgress(this.cursor, this.current.word.length);
    }

    const slot = mode.showSlots ? this.ui.popLetter(index) : null;
    this.audio.playCorrect();
    if (slot) this.anim.sparkleAt(slot);
    else if (this.ui.els.imageWrap && mode.showImage !== false) {
      this.anim.sparkleAt(this.ui.els.imageWrap);
    } else if (this.ui.els.targetLetter) {
      this.anim.sparkleAt(this.ui.els.targetLetter);
    }

    // Per-letter TTS on Easy / letters
    if (mode.speakLetterOnCorrect && typed) {
      const name = letterSpeakName(typed, this.language);
      this.audio.speakLetter(name);
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

  _onWrong(letter) {
    this._wrongStreak += 1;
    this._wordWrongs += 1;
    this._sessionWrong += 1;
    if (this._combo > 0) {
      this._combo = 0;
      this.ui.setCombo(0);
    }
    if (letter) this.ui.flashOskKey(letter, 'bad');
    this.ui.shakeWord();
    this.audio.playWrong();

    const mode = this._mode();
    const letterHintAt = mode.hintLetterAfterWrongs;
    if (letterHintAt > 0 && this._wrongStreak >= letterHintAt && this.current) {
      const need = this.current.word[this.cursor]?.toUpperCase() || '';
      this.ui.setEncouragement(this._t().findLetter(need));
      if (this._wrongStreak === letterHintAt || this._wrongStreak % 5 === 0) {
        this._speakStuck();
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
        this._speakStuck();
      }
      return;
    }

    this.ui.setEncouragement(this.words.randomEncouragement());
    if (this._wrongStreak >= 4 && this._wrongStreak % 3 === 0) {
      this._speakStuck();
    }
  }

  /**
   * Wrong-streak encouragement — Poppu vo_stuck clip first,
   * falls back to re-speaking the current word via pack/TTS.
   */
  _speakStuck() {
    this.audio
      .playVoiceReaction('stuck')
      .then((ok) => {
        if (!ok) this.speakCurrentWord();
      })
      .catch(() => this.speakCurrentWord());
  }

  _onWordComplete() {
    this._stopTimer();
    this.state = 'celebrating';
    this._transitionLock = true;
    this.sessionStars += 1;
    this._sessionWordsDone += 1;
    this._updateAdaptation();

    if (CONFIG.features.combo) {
      this._combo += 1;
      this._sessionBestCombo = Math.max(this._sessionBestCombo, this._combo);
      this.ui.setCombo(this._combo);
      if (this._combo >= 2) this.audio.playCombo(this._combo);
      if (this._combo === 3) {
        this.ui.showPoppuSay(this._t().poppuCombo3, 2000);
      } else if (this._combo === 5) {
        this.ui.showPoppuSay(this._t().poppuCombo5, 2200);
      }
    }

    // Perfect word (zero wrongs on this word)
    const perfect =
      CONFIG.features.perfectWord && this._wordWrongs === 0 && this.cursor > 0;
    if (perfect) {
      this.ui.showPoppuSay(this._t().perfectWord, 2000);
      this.audio.playCombo(6);
      this.anim.celebrate();
    }

    // Sticker unlock on first completion of this word
    let firstSticker = false;
    if (this.current?.id) {
      const before = loadSave().mastery?.[this.current.id]?.count || 0;
      recordMastery(this.current.id, true);
      firstSticker = before === 0;
    }

    // Lucky star (extra session star, still no-fail fun)
    let lucky = false;
    if (
      !perfect &&
      CONFIG.features.combo &&
      this._combo >= (CONFIG.gameplay.luckyComboMin || 3) &&
      Math.random() < (CONFIG.gameplay.luckyChance || 0.15)
    ) {
      lucky = true;
      this.sessionStars += 1;
      this.ui.showPoppuSay(this._t().poppuLucky, 1800);
      this.audio.playSparkle();
    }

    // Perfect also grants a tiny session bonus star chance feel — +0 session, +sparkle only
    // (keep pacing fair for mini missions)

    let save = patchSave({
      totalStars: loadSave().totalStars + 1 + (lucky ? 1 : 0),
      bestCombo: Math.max(loadSave().bestCombo || 0, this._sessionBestCombo),
    });

    if (this._missionKind === 'daily') {
      const day = dateKey();
      const daily = applyDailyToSave(save, day, {
        stars: this.sessionStars,
        completed: this.sessionStars >= this._sessionTarget,
      });
      save = patchSave({ daily });
    }
    if (this._missionKind === 'weekly') {
      const mission = getWeeklyMission();
      const weekly = applyWeeklyToSave(save, mission.key, {
        stars: this.sessionStars,
        completed: this.sessionStars >= this._sessionTarget,
      });
      save = patchSave({ weekly });
    }

    track('star_earned', { n: this.sessionStars });

    this.ui.setSessionStars(this.sessionStars, this._sessionTarget, {
      pop: true,
    });
    this.ui.cheerGameMascot();
    this.ui.cheerCompanion();
    if (firstSticker && this.current) {
      this.ui.showStickerUnlock(this.current);
    }

    const praise = this.words.randomPraise();
    this.ui.showPraise(praise);
    this.anim.celebrate();
    this.audio.playCelebration();
    this.audio.playSparkle();
    // Delay praise so last letter TTS (if any) can finish first
    this.audio.speakPraise(praise, { delayMs: 320 });

    const hitMissionEnd = this.sessionStars >= this._sessionTarget;
    const milestone = this._checkMilestone();

    // Soft achievement checks mid-session
    this._tryAchievements(save, { sessionBestCombo: this._sessionBestCombo });

    this._defer(() => {
      this.ui.hidePraise();
      if (hitMissionEnd) {
        this._finishMission(save);
        return;
      }
      if (milestone) {
        this._showMilestoneThenContinue(milestone);
        return;
      }
      this._defer(() => this.loadNextWord(), CONFIG.timing.nextWordDelayMs);
    }, CONFIG.timing.celebrationMs + (firstSticker ? 200 : 0));
  }

  _checkMilestone() {
    const t = this._t();
    const ats =
      this._sessionTarget <= 5
        ? (CONFIG.goals.miniMilestoneAts || [2, 4, 5]).filter(
            (a) => a < this._sessionTarget
          )
        : null;
    let list;
    if (ats) {
      // Mini mission: pair milestone copy with each mini checkpoint
      // so every miniMilestoneAts entry (2, 4, …) can show
      const copy = t.milestones || [];
      list = ats.map((a, i) => ({
        at: a,
        title: copy[i]?.title || t.poppuJourney || 'Poppu!',
        subtitle: copy[i]?.subtitle || `★ ${a}`,
        trophy: copy[i]?.trophy || '⭐',
      }));
    } else {
      list = (t.milestones || []).filter((m) => m.at < this._sessionTarget);
    }
    for (const m of list) {
      // >= so a lucky star (+2) can't jump past a milestone forever;
      // _milestonesHit keeps each milestone shown exactly once per session
      if (this.sessionStars >= m.at && !this._milestonesHit.has(m.at)) {
        this._milestonesHit.add(m.at);
        return m;
      }
    }
    return null;
  }

  _showMilestoneThenContinue(m) {
    this.state = 'milestone';
    this.ui.showMilestone(m);
    this.audio.playSparkle();
    this.audio.speakPraise(m.title);
    this._defer(() => {
      this.ui.hideMilestone();
      this._defer(() => this.loadNextWord(), CONFIG.timing.nextWordDelayMs);
    }, CONFIG.timing.milestoneMs);
  }

  _tryAchievements(save, ctx = {}) {
    const newly = evaluateAchievements(save, ctx);
    if (!newly.length) return save;
    const updated = unlockAchievements(newly);
    const t = this._t();
    const first = getBadge(newly[0]);
    if (first) {
      this.ui.showAchievementToast({
        emoji: first.emoji,
        title: t.achUnlocked,
        name: t[first.titleId] || first.id,
      });
      this.audio.playSparkle();
    }
    return updated;
  }

  _finishMission(save) {
    this._stopTimer();
    this.state = 'victory';
    this._transitionLock = true;

    const playMs = Math.max(0, Date.now() - (this._sessionStartMs || Date.now()));
    addSessionStats(this._sessionKeys, this._sessionWrong, playMs);

    let updated = patchSave({
      missionsWon: (save.missionsWon || 0) + 1,
      totalStars: save.totalStars,
      bestCombo: Math.max(save.bestCombo || 0, this._sessionBestCombo),
    });

    const day = dateKey();
    if (this._missionKind === 'daily') {
      const daily = applyDailyToSave(updated, day, {
        stars: this.sessionStars,
        completed: true,
      });
      updated = patchSave({ daily });
    }
    if (this._missionKind === 'weekly') {
      const mission = getWeeklyMission();
      const weekly = applyWeeklyToSave(updated, mission.key, {
        stars: this.sessionStars,
        completed: true,
      });
      updated = patchSave({ weekly });
    }

    updated = recordPlayDay(day);

    // Class board
    if (this._missionKind === 'class' && this._classCode) {
      const name =
        this.ui.getPlayerName() ||
        loadSave().playerName ||
        (this.language === 'en' ? 'Student' : 'Siswa');
      patchSave({ playerName: name });
      updated = pushClassScore(this._classCode, {
        name,
        stars: this.sessionStars,
      });
    }

    updated = this._tryAchievements(updated, {
      sessionBestCombo: this._sessionBestCombo,
      justWonMission: true,
      mode: this.difficulty,
      justDaily: this._missionKind === 'daily',
    });

    track('mission_win', {
      mode: this.difficulty,
      kind: this._missionKind,
      stars: this.sessionStars,
    });

    this.anim.celebrate();
    setTimeout(() => this.anim.celebrate(), 400);
    // Third wave as the journey bar finishes — the big finale moment
    setTimeout(() => this.anim.celebrate(), 1500);

    const t = this._t();
    const rank = getRank(updated.totalStars, t.ranks);
    const acc = accuracyPct({
      keys: (updated.stats?.keys || 0),
      wrong: (updated.stats?.wrong || 0),
    });

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
      accuracy: acc,
    });

    this._lastShareText = buildShareText(
      {
        sessionStars: this.sessionStars,
        totalStars: updated.totalStars,
        mode: this._sessionModeLabel,
        theme: this._sessionThemeLabel,
        lang: this.language === 'en' ? 'English' : 'Bahasa Indonesia',
        rank: `${rank.emoji} ${rank.label}`,
        combo: this._sessionBestCombo,
        daily: this._missionKind === 'daily',
        accuracy: acc,
      },
      t
    );

    this._certData = {
      stars: this.sessionStars,
      totalStars: updated.totalStars,
      rank: `${rank.emoji} ${rank.label}`,
      mode: this._sessionModeLabel,
      theme: this._sessionThemeLabel,
      lang: this.language,
      childName: String(updated.childName || '').trim(),
      title: t.certTitle,
      subtitle: t.certSub(this.sessionStars),
      footer: t.certFooter,
    };

    this.ui.setShareMsg('');
    this.ui.showVictory();
    this.ui.renderCollection(updated);

    // Friend jump pose on victory + first-completion character sticker
    const friend = this._activeFriendId();
    this.ui.setVictoryFriend(friend);
    if (friend && CONFIG.features.stickers) {
      const charId = `char-${friend}`;
      if ((updated.mastery?.[charId]?.count || 0) < 1) {
        updated = recordMastery(charId, true);
        const f = CONFIG.assets.friends?.[friend];
        if (f) {
          const name = t.friendNames?.[friend] || friend;
          this.ui.showStickerUnlock({ image: f.sticker, display: name });
          // Only Peeky has a tada clip — other friends fall back to their
          // leveldone voice (playVoiceReaction then falls back to Poppu)
          this.audio
            .playFriendTada()
            .then((ok) => {
              if (!ok) this.audio.playVoiceReaction('leveldone', friend);
            })
            .catch(() => {});
        }
      }
    }
    this._refreshDailyUI();
    this._refreshWeeklyUI();
    this._refreshClassUI();
    this._refreshParentDash();

    this.audio.playCelebration();
    this.ui.showPoppuSay(t.poppuWin || t.victorySpeech, 2800);

    // Friendship level-up check (word stickers only, not letter warm-up / char stickers)
    const stickers = Object.entries(updated.mastery || {}).filter(
      ([id, m]) =>
        !isLetterMasteryId(id) && !isCharMasteryId(id) && (m?.count || 0) >= 1
    ).length;
    const fr = getFriendship(updated.totalStars || 0, stickers);
    const frLabel =
      (t.friendshipLabel && t.friendshipLabel[fr.id]) || fr.id;
    if (this.ui.els.victoryFriendship) {
      const hearts = t.friendshipHearts
        ? t.friendshipHearts(fr.hearts)
        : fr.emoji;
      this.ui.els.victoryFriendship.textContent = `${hearts} ${frLabel}`;
    }
    if (this._prevFriendshipId && this._prevFriendshipId !== fr.id) {
      this.ui.showPoppuSay(
        t.friendshipUp ? t.friendshipUp(frLabel) : frLabel,
        3200
      );
      this.audio.playSparkle();
    }
    this._prevFriendshipId = fr.id;

    this.audio.speakPraise(t.victorySpeech);
    setTimeout(() => {
      if (rank.next) {
        this.audio.speak(
          t.victorySpeechRank(rank.starsToNext, rank.next.label)
        );
      }
    }, 2200);
    this._refreshStickerBook();
  }

  async shareParentSummary() {
    const text = this._lastShareText || this._t().shareTitle;
    this.audio.playClick();
    try {
      if (navigator.share) {
        await navigator.share({ title: this._t().shareTitle, text });
        this.ui.setShareMsg('');
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        this.ui.setShareMsg(this._t().shareCopied);
        return;
      }
      this.ui.setShareMsg(this._t().shareFail);
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      try {
        await navigator.clipboard?.writeText(text);
        this.ui.setShareMsg(this._t().shareCopied);
      } catch {
        this.ui.setShareMsg(this._t().shareFail);
      }
    }
  }

  async shareCertificate() {
    if (!this._certData) return;
    this.audio.playClick();
    try {
      const blob = await renderCertificate(this._certData);
      await shareCertificate(blob, {
        title: this._t().certTitle,
        text: this._lastShareText || this._t().certTitle,
      });
      this.ui.setShareMsg(this._t().certOk);
    } catch {
      this.ui.setShareMsg(this._t().shareFail);
    }
  }
}

export default Game;
