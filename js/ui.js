/**
 * UI — screens, i18n, modes, categories, language
 */
import { CONFIG, getMode } from './config.js';
import {
  getRank,
  remainingCopy,
  isLetterMasteryId,
  isCharMasteryId,
} from './storage.js';
import { getStrings } from './i18n.js';
import { getFriendship } from './friendship.js';

export class UI {
  constructor() {
    /** @type {ReturnType<typeof getStrings>} */
    this.t = getStrings('id');
    this.els = {
      startScreen: document.getElementById('start-screen'),
      gameScreen: document.getElementById('game-screen'),
      victoryScreen: document.getElementById('victory-screen'),
      startBtn: document.getElementById('start-btn'),
      replayBtn: document.getElementById('replay-btn'),
      homeBtn: document.getElementById('home-btn'),
      muteBtn: document.getElementById('mute-btn'),
      helpBtn: document.getElementById('help-btn'),
      backBtn: document.getElementById('back-btn'),
      gameHomeBtn: document.getElementById('game-home-btn'),
      gameHomeLabel: document.getElementById('game-home-label'),
      lengthMini: document.getElementById('length-mini'),
      lengthFull: document.getElementById('length-full'),
      lengthPick: document.getElementById('length-pick'),
      journey: document.getElementById('journey'),
      journeyTrack: document.getElementById('journey-track'),
      journeyPoppu: document.getElementById('journey-poppu'),
      poppuBubble: document.getElementById('poppu-bubble'),
      poppuBubbleText: document.getElementById('poppu-bubble-text'),
      stickerBook: document.getElementById('sticker-book'),
      stickerBookTitle: document.getElementById('sticker-book-title'),
      stickerHint: document.getElementById('sticker-hint'),
      stickerGrid: document.getElementById('sticker-grid'),
      stickerToast: document.getElementById('sticker-toast'),
      stickerToastImg: document.getElementById('sticker-toast-img'),
      stickerToastText: document.getElementById('sticker-toast-text'),
      friendshipChip: document.getElementById('friendship-chip'),
      friendshipHearts: document.getElementById('friendship-hearts'),
      friendshipLabel: document.getElementById('friendship-label'),
      worldMap: document.getElementById('world-map'),
      worldMapTitle: document.getElementById('world-map-title'),
      manualTitle: document.getElementById('manual-title'),
      moreTitle: document.getElementById('more-title'),
      stationAbc: document.getElementById('station-abc'),
      stationMeadow: document.getElementById('station-meadow'),
      stationCastle: document.getElementById('station-castle'),
      victoryFriendship: document.getElementById('victory-friendship'),
      parentSummary: document.getElementById('parent-summary'),
      parentTitle: document.getElementById('parent-title'),
      parentList: document.getElementById('parent-list'),
      wordImage: document.getElementById('word-image'),
      wordLabel: document.getElementById('word-label'),
      wordFull: document.getElementById('word-full'),
      wordSlots: document.getElementById('word-slots'),
      progressFill: document.getElementById('progress-fill'),
      progressLabel: document.getElementById('progress-label'),
      progressTrack:
        document.getElementById('progress-track') ||
        document.querySelector('.progress-track[role="progressbar"]'),
      letterProgressBar: document.getElementById('letter-progress-bar'),
      encouragement: document.getElementById('encouragement'),
      praiseOverlay: document.getElementById('praise-overlay'),
      praiseText: document.getElementById('praise-text'),
      speakBtn: document.getElementById('speak-btn'),
      imageWrap: document.getElementById('image-wrap'),
      targetBlock: document.getElementById('target-block'),
      targetLetter: document.getElementById('target-letter'),
      targetHint: document.getElementById('target-hint'),
      keyCatcher: document.getElementById('key-catcher'),
      kbHint: document.getElementById('kb-hint'),
      kbHintHard: document.getElementById('kb-hint-hard'),
      starTrack: document.getElementById('star-track'),
      sessionStars: document.getElementById('session-stars'),
      sessionTarget: document.getElementById('session-target'),
      goalRemaining: document.getElementById('goal-remaining'),
      timerWrap: document.getElementById('timer-wrap'),
      timerValue: document.getElementById('timer-value'),
      lifetimeStars: document.getElementById('lifetime-stars'),
      collectionRank: document.getElementById('collection-rank'),
      missionPreview: document.getElementById('mission-preview'),
      missionTargetLabel: document.getElementById('mission-target-label'),
      catPick: document.getElementById('cat-pick'),
      tutorial: document.getElementById('tutorial'),
      tutorialEmoji: document.getElementById('tutorial-emoji'),
      tutorialTitle: document.getElementById('tutorial-title'),
      tutorialBody: document.getElementById('tutorial-body'),
      tutorialDots: document.getElementById('tutorial-dots'),
      tutorialNext: document.getElementById('tutorial-next'),
      tutorialSkip: document.getElementById('tutorial-skip'),
      milestoneToast: document.getElementById('milestone-toast'),
      milestoneTrophy: document.getElementById('milestone-trophy'),
      milestoneTitle: document.getElementById('milestone-title'),
      milestoneSub: document.getElementById('milestone-sub'),
      victoryTitle: document.getElementById('victory-title'),
      victorySub: document.getElementById('victory-sub'),
      victoryStars: document.getElementById('victory-stars'),
      victorySession: document.getElementById('victory-session'),
      victoryTotal: document.getElementById('victory-total'),
      victoryRank: document.getElementById('victory-rank'),
      victoryRankLabel: document.getElementById('victory-rank-label'),
      victoryNext: document.getElementById('victory-next'),
      modeEasy: document.getElementById('mode-easy'),
      modeMedium: document.getElementById('mode-medium'),
      modeHard: document.getElementById('mode-hard'),
      langId: document.getElementById('lang-id'),
      langEn: document.getElementById('lang-en'),
      appTitle: document.getElementById('app-title'),
      appSubtitle: document.getElementById('app-subtitle'),
      starsWord: document.getElementById('stars-word'),
      missionTitle: document.getElementById('mission-title'),
      missionGoalBefore: document.getElementById('mission-goal-before'),
      missionGoalAfter: document.getElementById('mission-goal-after'),
      startHint: document.getElementById('start-hint'),
      pickThemeLabel: document.getElementById('pick-theme-label'),
      startFooter: document.getElementById('start-footer'),
      goalLabel: document.getElementById('goal-label'),
      progressMetaLabel: document.getElementById('progress-meta-label'),
      kbHintBefore: document.getElementById('kb-hint-before'),
      kbHintAfter: document.getElementById('kb-hint-after'),
      victorySessionLbl: document.getElementById('victory-session-lbl'),
      victoryTotalLbl: document.getElementById('victory-total-lbl'),
      timerUnit: document.querySelector('.timer-unit'),
      // Daily / streak / class / combo / share
      collectionStreak: document.getElementById('collection-streak'),
      dailyCard: document.getElementById('daily-card'),
      dailyTitle: document.getElementById('daily-title'),
      dailyDesc: document.getElementById('daily-desc'),
      dailyBtn: document.getElementById('daily-btn'),
      dailyBadge: document.getElementById('daily-badge'),
      classPanel: document.getElementById('class-panel'),
      classTitle: document.getElementById('class-title'),
      classActive: document.getElementById('class-active'),
      classCodeInput: document.getElementById('class-code-input'),
      classJoinBtn: document.getElementById('class-join-btn'),
      classCreateBtn: document.getElementById('class-create-btn'),
      classShareBtn: document.getElementById('class-share-btn'),
      classClearBtn: document.getElementById('class-clear-btn'),
      classMsg: document.getElementById('class-msg'),
      comboBadge: document.getElementById('combo-badge'),
      shareBtn: document.getElementById('share-btn'),
      shareMsg: document.getElementById('share-msg'),
      modeLetters: document.getElementById('mode-letters'),
      weeklyCard: document.getElementById('weekly-card'),
      weeklyTitle: document.getElementById('weekly-title'),
      weeklyDesc: document.getElementById('weekly-desc'),
      weeklyBtn: document.getElementById('weekly-btn'),
      weeklyBadge: document.getElementById('weekly-badge'),
      parentDash: document.getElementById('parent-dash'),
      parentDashTitle: document.getElementById('parent-dash-title'),
      parentDashList: document.getElementById('parent-dash-list'),
      masteryTitle: document.getElementById('mastery-title'),
      masteryLine: document.getElementById('mastery-line'),
      badgesTitle: document.getElementById('badges-title'),
      badgesGrid: document.getElementById('badges-grid'),
      analyticsOptIn: document.getElementById('analytics-optin'),
      analyticsLabel: document.getElementById('analytics-label'),
      a11yTitle: document.getElementById('a11y-title'),
      a11yContrast: document.getElementById('a11y-contrast'),
      a11yLarge: document.getElementById('a11y-large'),
      a11yContrastLabel: document.getElementById('a11y-contrast-label'),
      a11yLargeLabel: document.getElementById('a11y-large-label'),
      osk: document.getElementById('osk'),
      oskRows: document.getElementById('osk-rows'),
      oskFinger: document.getElementById('osk-finger'),
      achToast: document.getElementById('ach-toast'),
      achToastEmoji: document.getElementById('ach-toast-emoji'),
      achToastTitle: document.getElementById('ach-toast-title'),
      achToastName: document.getElementById('ach-toast-name'),
      certBtn: document.getElementById('cert-btn'),
      classNameInput: document.getElementById('class-name-input'),
      classExportBtn: document.getElementById('class-export-btn'),
      classPlayBtn: document.getElementById('class-play-btn'),
      classBoard: document.getElementById('class-board'),
      classBoardTitle: document.getElementById('class-board-title'),
      companion: document.getElementById('game-companion'),
      victoryFriend: document.getElementById('victory-friend'),
      // Parental gate
      gateOverlay: document.getElementById('gate-overlay'),
      gateTitle: document.getElementById('gate-title'),
      gateInstruction: document.getElementById('gate-instruction'),
      gateQuestion: document.getElementById('gate-question'),
      gateAnswers: document.getElementById('gate-answers'),
      gateMsg: document.getElementById('gate-msg'),
      gateClose: document.getElementById('gate-close'),
      privacyLink: document.getElementById('privacy-link'),
    };

    this._oskBuilt = false;
    this._oskTarget = '';
    /** Adaptive (easy): temporarily re-show kb hint after a struggling word */
    this._kbHintBoost = false;
    this._onOskLayout = () => {
      if (this._oskTarget) this._positionOskFinger();
    };

    /** @type {ReturnType<typeof getMode>} */
    this.mode = getMode('easy');
    this.category = 'all';
    this.language = 'id';

    // Parental gate — parent session lives in memory only (5 min),
    // never persisted to localStorage
    this._gatePassedAt = 0;
    this._gateOnPass = null;
    this._gatePrevFocus = null;
    this._gateAnswer = 0;
    // Deterministic bypass for automated tests (?e2e), same pattern as main.js
    this._gateE2E =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).has('e2e');
    this._bindGate();

    this._sessionTarget = CONFIG.goals.sessionTarget;
    this._buildStarTrack(this._sessionTarget);
    this._buildMissionPreview(this._sessionTarget);
    this._buildCategoryChips();
    this._buildOsk();
    window.addEventListener('resize', this._onOskLayout, { passive: true });
    window.addEventListener('scroll', this._onOskLayout, { passive: true });
    if (this.els.sessionTarget) {
      this.els.sessionTarget.textContent = String(this._sessionTarget);
    }
    if (this.els.missionTargetLabel) {
      this.els.missionTargetLabel.textContent = String(this._sessionTarget);
    }
  }

  /**
   * Apply UI language pack to static DOM
   * @param {'id'|'en'|string} lang
   */
  applyLanguage(lang) {
    this.language = lang === 'en' ? 'en' : 'id';
    this.t = getStrings(this.language);
    const t = this.t;

    document.documentElement.lang = this.language === 'en' ? 'en' : 'id';
    document.title = `${t.appName} — ${t.subtitle}`;

    if (this.els.appTitle) this.els.appTitle.textContent = t.appName;
    if (this.els.appSubtitle) this.els.appSubtitle.textContent = t.subtitle;
    const brandHost = document.getElementById('brand-host');
    if (brandHost && t.brandHost) brandHost.textContent = t.brandHost;
    const brandLine = document.getElementById('brand-line');
    if (brandLine && t.brandLine) brandLine.textContent = t.brandLine;
    if (this.els.lengthMini) {
      const n = this.els.lengthMini.querySelector('.length-name') || this.els.lengthMini;
      if (document.getElementById('length-mini-name'))
        document.getElementById('length-mini-name').textContent = t.lengthMini;
    }
    if (document.getElementById('length-full-name'))
      document.getElementById('length-full-name').textContent = t.lengthFull;
    if (this.els.lengthPick)
      this.els.lengthPick.setAttribute('aria-label', t.lengthAria || 'Mission length');
    if (this.els.stickerBookTitle)
      this.els.stickerBookTitle.textContent = t.stickerBookTitle;
    if (this.els.stickerHint) this.els.stickerHint.textContent = t.stickerHint;
    if (this.els.stickerToastText)
      this.els.stickerToastText.textContent = t.stickerNew;
    if (this.els.worldMapTitle)
      this.els.worldMapTitle.textContent = t.worldMapTitle;
    if (this.els.manualTitle)
      this.els.manualTitle.textContent = t.manualTitle;
    if (this.els.moreTitle) this.els.moreTitle.textContent = t.moreTitle;
    const setSt = (id, key) => {
      const n = document.getElementById(`${id}-name`);
      const d = document.getElementById(`${id}-desc`);
      if (n && t[key]) n.textContent = t[key].name;
      if (d && t[key]) d.textContent = t[key].desc;
    };
    setSt('station-abc', 'stationAbc');
    setSt('station-meadow', 'stationMeadow');
    setSt('station-castle', 'stationCastle');
    if (this.els.starsWord) this.els.starsWord.textContent = t.starsWord;
    if (this.els.missionTitle) this.els.missionTitle.textContent = t.missionTitle;
    if (this.els.missionGoalBefore)
      this.els.missionGoalBefore.textContent = t.missionGoalBefore;
    if (this.els.missionGoalAfter)
      this.els.missionGoalAfter.textContent = t.missionGoalAfter;
    if (this.els.startHint) this.els.startHint.textContent = t.hint;
    if (this.els.pickThemeLabel) this.els.pickThemeLabel.textContent = t.pickTheme;
    if (this.els.startBtn) this.els.startBtn.textContent = t.startBtn;
    if (this.els.startFooter) this.els.startFooter.textContent = t.footer;
    if (this.els.goalLabel) this.els.goalLabel.textContent = t.goalLabel;
    if (this.els.progressMetaLabel)
      this.els.progressMetaLabel.textContent = t.letterProgress;
    if (this.els.targetHint) this.els.targetHint.textContent = t.typeThisLetter;
    if (this.els.kbHintBefore) this.els.kbHintBefore.textContent = t.kbHintBefore;
    if (this.els.kbHintAfter) this.els.kbHintAfter.textContent = t.kbHintAfter;
    if (this.els.kbHintHard) this.els.kbHintHard.textContent = t.kbHintHard;
    if (this.els.timerUnit) this.els.timerUnit.textContent = t.timerUnit;
    if (this.els.encouragement)
      this.els.encouragement.textContent = t.encouragementDefault;
    if (this.els.speakBtn) this.els.speakBtn.setAttribute('aria-label', t.speakAria);
    if (this.els.muteBtn) this.els.muteBtn.setAttribute('aria-label', t.muteAria);
    if (this.els.helpBtn) this.els.helpBtn.setAttribute('aria-label', t.helpAria);
    if (this.els.backBtn) {
      this.els.backBtn.setAttribute('aria-label', t.backAria);
      this.els.backBtn.title = t.backTitle;
    }
    if (this.els.gameHomeLabel) this.els.gameHomeLabel.textContent = t.backLabel;
    if (this.els.gameHomeBtn) {
      this.els.gameHomeBtn.setAttribute('aria-label', t.backAria);
      this.els.gameHomeBtn.title = t.backTitle;
    }
    if (this.els.parentTitle) this.els.parentTitle.textContent = t.parentTitle;
    if (this.els.victorySessionLbl)
      this.els.victorySessionLbl.textContent = t.victorySession;
    if (this.els.victoryTotalLbl)
      this.els.victoryTotalLbl.textContent = t.victoryTotal;
    if (this.els.replayBtn) this.els.replayBtn.textContent = t.replay;
    if (this.els.homeBtn) this.els.homeBtn.textContent = t.home;
    if (this.els.tutorialSkip) this.els.tutorialSkip.textContent = t.tutorialSkip;
    if (this.els.dailyTitle) this.els.dailyTitle.textContent = t.dailyTitle;
    if (this.els.dailyBtn) this.els.dailyBtn.textContent = t.dailyBtn;
    if (this.els.classTitle) this.els.classTitle.textContent = t.classTitle;
    if (this.els.classJoinBtn) this.els.classJoinBtn.textContent = t.classJoin;
    if (this.els.classCreateBtn) this.els.classCreateBtn.textContent = t.classCreate;
    if (this.els.classShareBtn) this.els.classShareBtn.textContent = t.classShare;
    if (this.els.classClearBtn) this.els.classClearBtn.textContent = t.classClear;
    if (this.els.classCodeInput)
      this.els.classCodeInput.placeholder = t.classCodePh;
    if (this.els.shareBtn) this.els.shareBtn.textContent = t.shareBtn;
    if (this.els.certBtn) this.els.certBtn.textContent = t.certBtn;
    if (this.els.weeklyTitle) this.els.weeklyTitle.textContent = t.weeklyTitle;
    if (this.els.weeklyBtn) this.els.weeklyBtn.textContent = t.weeklyBtn;
    if (this.els.parentDashTitle)
      this.els.parentDashTitle.textContent = t.parentDashTitle;
    if (this.els.privacyLink) this.els.privacyLink.textContent = t.privacyLink;
    if (this.els.gateTitle) this.els.gateTitle.textContent = t.gateTitle;
    if (this.els.gateInstruction)
      this.els.gateInstruction.textContent = t.gateInstruction;
    if (this.els.gateClose) this.els.gateClose.textContent = t.gateClose;
    if (this.els.masteryTitle) this.els.masteryTitle.textContent = t.masteryTitle;
    if (this.els.badgesTitle) this.els.badgesTitle.textContent = t.parentBadges;
    if (this.els.analyticsLabel)
      this.els.analyticsLabel.textContent = t.analyticsOptIn;
    if (this.els.a11yTitle) this.els.a11yTitle.textContent = t.a11yTitle;
    if (this.els.a11yContrastLabel)
      this.els.a11yContrastLabel.textContent = t.a11yContrast;
    if (this.els.a11yLargeLabel)
      this.els.a11yLargeLabel.textContent = t.a11yLarge;
    if (this.els.classExportBtn)
      this.els.classExportBtn.textContent = t.classExport;
    if (this.els.classPlayBtn) this.els.classPlayBtn.textContent = t.classPlay;
    if (this.els.classBoardTitle)
      this.els.classBoardTitle.textContent = t.classBoardTitle;
    if (this.els.classNameInput)
      this.els.classNameInput.placeholder = t.classNamePh;
    if (this.els.osk) this.els.osk.setAttribute('aria-label', t.oskLabel);
    if (this.els.achToastTitle)
      this.els.achToastTitle.textContent = t.achUnlocked;

    // Modes
    const setMode = (nameId, descId, key) => {
      const n = document.getElementById(nameId);
      const d = document.getElementById(descId);
      if (n) n.textContent = t.modes[key]?.name || key;
      if (d) d.textContent = t.modes[key]?.desc || '';
    };
    setMode('mode-easy-name', 'mode-easy-desc', 'easy');
    setMode('mode-medium-name', 'mode-medium-desc', 'medium');
    setMode('mode-hard-name', 'mode-hard-desc', 'hard');
    setMode('mode-letters-name', 'mode-letters-desc', 'letters');

    // Lang buttons
    this.els.langId?.classList.toggle('is-active', this.language === 'id');
    this.els.langEn?.classList.toggle('is-active', this.language === 'en');

    this._buildCategoryChips();
    this.setCategoryUI(this.category);
  }

  _buildCategoryChips() {
    const host = this.els.catPick;
    if (!host) return;
    const t = this.t;
    const active = this.category || 'all';
    host.innerHTML = '';
    for (const c of CONFIG.categoryOptions) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-btn' + (c.id === active ? ' is-active' : '');
      btn.dataset.cat = c.id;
      const label = t.categories[c.id] || c.label;
      btn.innerHTML = `<span class="cat-emoji">${c.emoji}</span><span class="cat-name">${label}</span>`;
      host.appendChild(btn);
    }
  }

  _buildStarTrack(n) {
    const track = this.els.starTrack;
    if (!track) return;
    track.innerHTML = '';
    track.setAttribute('aria-valuemax', String(n));
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'star-slot';
      s.dataset.index = String(i);
      const img = document.createElement('img');
      img.className = 'star-icon';
      img.src = CONFIG.assets?.uiIcons?.starFilled || '';
      img.alt = '';
      s.appendChild(img);
      s.setAttribute('aria-hidden', 'true');
      track.appendChild(s);
    }
  }

  _buildMissionPreview(n) {
    const el = this.els.missionPreview;
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'preview-star';
      s.textContent = '☆';
      el.appendChild(s);
    }
  }

  /**
   * @param {{ totalStars: number, muted?: boolean, difficulty?: string, streak?: { current?: number, best?: number } }} save
   */
  renderCollection(save) {
    const rank = getRank(save.totalStars || 0, this.t.ranks);
    if (this.els.lifetimeStars) {
      this.els.lifetimeStars.textContent = String(save.totalStars || 0);
    }
    if (this.els.collectionRank) {
      this.els.collectionRank.textContent = `${rank.emoji} ${rank.label}`;
    }
    if (this.els.collectionStreak) {
      const n = save.streak?.current || 0;
      this.els.collectionStreak.textContent = this.t.streakLabel(n);
      if (save.streak?.best > 1) {
        this.els.collectionStreak.title = this.t.streakBest(save.streak.best);
      }
    }
    // Friendship hearts (word stickers only — letter warm-up + char sticker ids excluded)
    if (CONFIG.features?.friendship) {
      const stickers = Object.entries(save.mastery || {}).filter(
        ([id, m]) =>
          !isLetterMasteryId(id) && !isCharMasteryId(id) && (m?.count || 0) >= 1
      ).length;
      const fr = getFriendship(save.totalStars || 0, stickers);
      const label =
        (this.t.friendshipLabel && this.t.friendshipLabel[fr.id]) || fr.id;
      if (this.els.friendshipHearts) {
        this.els.friendshipHearts.textContent = this.t.friendshipHearts
          ? this.t.friendshipHearts(fr.hearts)
          : fr.emoji;
      }
      if (this.els.friendshipLabel) {
        this.els.friendshipLabel.textContent = label;
      }
      if (this.els.friendshipChip) {
        this.els.friendshipChip.title = label;
      }
    }
  }

  /**
   * @param {'abc'|'meadow'|'castle'} station
   */
  setStationUI(station) {
    this.els.stationAbc?.classList.toggle('is-active', station === 'abc');
    this.els.stationMeadow?.classList.toggle('is-active', station === 'meadow');
    this.els.stationCastle?.classList.toggle('is-active', station === 'castle');
  }

  /**
   * @param {(station: 'abc'|'meadow'|'castle') => void} handler
   */
  onStation(handler) {
    const bind = (btn, st) => {
      btn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handler(st);
      });
    };
    bind(this.els.stationAbc, 'abc');
    bind(this.els.stationMeadow, 'meadow');
    bind(this.els.stationCastle, 'castle');
  }

  /**
   * @param {{ desc: string, done: boolean, btnLabel?: string }} daily
   */
  renderDaily(daily) {
    if (this.els.dailyDesc) this.els.dailyDesc.textContent = daily.desc;
    this.els.dailyBadge?.classList.toggle('hidden', !daily.done);
    this.els.dailyCard?.classList.toggle('is-done', Boolean(daily.done));
    if (this.els.dailyBtn) {
      // Allow replay after complete
      this.els.dailyBtn.textContent = daily.done
        ? this.t.dailyReplay || this.t.dailyBtn
        : daily.btnLabel || this.t.dailyBtn;
      this.els.dailyBtn.disabled = false;
    }
  }

  /**
   * @param {{ code: string|null, label?: string }} cls
   */
  renderClassroom(cls) {
    const active = Boolean(cls.code);
    this.els.classActive?.classList.toggle('hidden', !active);
    if (this.els.classActive && active) {
      this.els.classActive.textContent =
        cls.label || this.t.classActive(cls.code);
    }
    this.els.classShareBtn?.classList.toggle('hidden', !active);
    this.els.classClearBtn?.classList.toggle('hidden', !active);
    this.els.classPlayBtn?.classList.toggle('hidden', !active);
    this.els.classExportBtn?.classList.toggle('hidden', !active);
    if (this.els.classCodeInput && cls.code) {
      this.els.classCodeInput.value = cls.code;
    }
  }

  setClassMsg(text) {
    if (this.els.classMsg) this.els.classMsg.textContent = text || '';
  }

  /**
   * Combo badge in game HUD
   * @param {number} n
   */
  setCombo(n) {
    const el = this.els.comboBadge;
    if (!el) return;
    if (n < 2) {
      el.classList.add('hidden');
      el.classList.remove('combo-pop');
      return;
    }
    el.textContent = this.t.comboLabel(n);
    el.classList.remove('hidden');
    el.classList.remove('combo-pop');
    void el.offsetWidth;
    el.classList.add('combo-pop');
  }

  setShareMsg(text) {
    if (this.els.shareMsg) this.els.shareMsg.textContent = text || '';
  }

  /**
   * @param {'easy'|'medium'|'hard'|string} modeId
   */
  setDifficultyUI(modeId) {
    this.mode = getMode(modeId);
    const id = this.mode.id;
    this.els.modeEasy?.classList.toggle('is-active', id === 'easy');
    this.els.modeMedium?.classList.toggle('is-active', id === 'medium');
    this.els.modeHard?.classList.toggle('is-active', id === 'hard');
    this.els.modeLetters?.classList.toggle('is-active', id === 'letters');
    this._updateCategoryPickState();
    this.applyModeLayout();
  }

  /**
   * Category pick is ignored by WordBank in letters mode —
   * grey it out + aria-disabled so it's not a fake choice.
   */
  _updateCategoryPickState() {
    const host = this.els.catPick;
    if (!host) return;
    const disabled = this.mode?.id === 'letters';
    host.classList.toggle('is-disabled', disabled);
    host.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    host.querySelectorAll('.cat-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.cat === this.category);
      btn.disabled = disabled;
    });
  }

  /**
   * @param {string} categoryId
   */
  setCategoryUI(categoryId) {
    this.category = categoryId || 'all';
    this._updateCategoryPickState();
  }

  /**
   * Adaptive (easy mode): temporarily re-show the keyboard hint for the
   * next word after a struggling word, even if the mission config would
   * hide it. Cleared again on the next completed word / mission start.
   * @param {boolean} on
   */
  setKbHintBoost(on) {
    this._kbHintBoost = Boolean(on);
    const m = this.mode || {};
    this.els.kbHint?.classList.toggle(
      'hidden',
      !m.showKbHint && !this._kbHintBoost
    );
  }

  /** Show/hide big letter, slots, full word, timer, hints based on mode */
  applyModeLayout() {
    const m = this.mode;
    const showBig = Boolean(m.showBigLetter);
    this.els.targetBlock?.classList.toggle('hidden', !showBig);
    if (this.els.targetBlock) {
      this.els.targetBlock.setAttribute('aria-hidden', showBig ? 'false' : 'true');
      this.els.targetBlock.hidden = !showBig;
    }
    this.els.wordSlots?.classList.toggle('hidden', !m.showSlots);
    this.els.letterProgressBar?.classList.toggle('hidden', !m.showLetterProgress);
    this.els.kbHint?.classList.toggle(
      'hidden',
      !m.showKbHint && !this._kbHintBoost
    );
    this.els.kbHintHard?.classList.toggle('hidden', m.id !== 'hard');
    this.els.wordFull?.classList.toggle('hidden', !m.showFullWord);
    const hasTimer = (m.timerSeconds || 0) > 0;
    this.els.timerWrap?.classList.toggle('hidden', !hasTimer);
    const showImg = m.showImage !== false;
    this.els.imageWrap?.classList.toggle('hidden', !showImg);

    this.els.gameScreen?.classList.toggle('mode-hard', m.id === 'hard');
    this.els.gameScreen?.classList.toggle('mode-medium', m.id === 'medium');
    this.els.gameScreen?.classList.toggle('mode-easy', m.id === 'easy');
    this.els.gameScreen?.classList.toggle('mode-letters', m.id === 'letters');

    // OSK visible in game for all modes when feature on
    if (CONFIG.features.onScreenKeyboard) {
      this.els.osk?.classList.remove('hidden');
    }
  }

  /**
   * @param {number} seconds
   * @param {{ urgent?: boolean }} [opts]
   */
  setTimer(seconds, opts = {}) {
    if (this.els.timerValue) {
      this.els.timerValue.textContent = String(Math.max(0, Math.ceil(seconds)));
    }
    this.els.timerWrap?.classList.toggle('is-urgent', Boolean(opts.urgent));
  }

  hideTimer() {
    this.els.timerWrap?.classList.add('hidden');
    this.els.timerWrap?.classList.remove('is-urgent');
  }

  /**
   * @param {boolean} muted
   */
  setMuteUI(muted) {
    const btn = this.els.muteBtn;
    if (!btn) return;
    btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    btn.classList.toggle('is-muted', muted);
    const on = btn.querySelector('.mute-on');
    const off = btn.querySelector('.mute-off');
    on?.classList.toggle('hidden', muted);
    off?.classList.toggle('hidden', !muted);
  }

  showStart() {
    this._hideAllScreens();
    this.els.startScreen?.classList.remove('hidden');
    this.els.startScreen?.setAttribute('aria-hidden', 'false');
    this.setBackVisible(false);
  }

  showGame() {
    this._hideAllScreens();
    this.els.gameScreen?.classList.remove('hidden');
    this.els.gameScreen?.setAttribute('aria-hidden', 'false');
    this.setBackVisible(true);
  }

  showVictory() {
    this._hideAllScreens();
    this.els.victoryScreen?.classList.remove('hidden');
    this.els.victoryScreen?.setAttribute('aria-hidden', 'false');
    // Victory already has "Ke Awal" — keep floating back too
    this.setBackVisible(true);
  }

  /**
   * Show floating ← during game / victory
   * @param {boolean} on
   */
  setBackVisible(on) {
    this.els.backBtn?.classList.toggle('hidden', !on);
    this.els.backBtn?.setAttribute('aria-hidden', on ? 'false' : 'true');
  }

  /** Brief Poppu cheer on word complete — excited react pose */
  cheerGameMascot() {
    const el = document.getElementById('game-mascot');
    if (!el) return;
    const brand = CONFIG.app?.brand || {};
    const react = brand.mascotReact || 'assets/brand/poppu/poppu-react.png';
    const idle = brand.mascotIdle || 'assets/brand/poppu/poppu-idle.png';
    el.classList.remove('is-cheer');
    void el.offsetWidth;
    el.classList.add('is-cheer');
    if (el.getAttribute('src') !== react) {
      el.setAttribute('src', react);
    }
    if (this.els.journeyPoppu) {
      this.els.journeyPoppu.setAttribute('src', react);
    }
    clearTimeout(this._mascotTimer);
    this._mascotTimer = setTimeout(() => {
      el.setAttribute('src', idle);
      el.classList.remove('is-cheer');
      if (this.els.journeyPoppu) {
        this.els.journeyPoppu.setAttribute('src', idle);
      }
    }, 1200);
  }

  /**
   * Show the station friend companion in-game (base pose), or hide it.
   * @param {string|null} friendId key of CONFIG.assets.friends
   */
  setCompanion(friendId) {
    const el = this.els.companion;
    if (!el) return;
    // Never show a broken-image icon to a kid — hide on load error
    if (!el.onerror) el.onerror = () => el.classList.add('hidden');
    const friend = CONFIG.assets?.friends?.[friendId];
    if (!friend) {
      el.classList.add('hidden');
      return;
    }
    clearTimeout(this._companionTimer);
    el.classList.remove('is-cheer');
    if (el.getAttribute('src') !== friend.base) {
      el.setAttribute('src', friend.base);
    }
    el.classList.remove('hidden');
  }

  /** Brief companion cheer — jump pose, then back to base (mirrors cheerGameMascot) */
  cheerCompanion() {
    const el = this.els.companion;
    if (!el || el.classList.contains('hidden')) return;
    const src = el.getAttribute('src') || '';
    const friend = Object.values(CONFIG.assets?.friends || {}).find(
      (f) => f.base === src || f.jump === src
    );
    if (!friend) return;
    el.classList.remove('is-cheer');
    void el.offsetWidth;
    el.classList.add('is-cheer');
    el.setAttribute('src', friend.jump);
    clearTimeout(this._companionTimer);
    this._companionTimer = setTimeout(() => {
      el.setAttribute('src', friend.base);
      el.classList.remove('is-cheer');
    }, 1200);
  }

  /**
   * Friend jump pose beside Poppu on the victory screen (or hide).
   * @param {string|null} friendId key of CONFIG.assets.friends
   */
  setVictoryFriend(friendId) {
    const el = this.els.victoryFriend;
    if (!el) return;
    // Never show a broken-image icon to a kid — hide on load error
    if (!el.onerror) el.onerror = () => el.classList.add('hidden');
    const friend = CONFIG.assets?.friends?.[friendId];
    if (!friend) {
      el.classList.add('hidden');
      return;
    }
    if (el.getAttribute('src') !== friend.jump) {
      el.setAttribute('src', friend.jump);
    }
    el.classList.remove('hidden');
  }

  /**
   * @param {'mini'|'full'} length
   */
  setMissionLengthUI(length) {
    const isMini = length === 'mini';
    this.els.lengthMini?.classList.toggle('is-active', isMini);
    this.els.lengthFull?.classList.toggle('is-active', !isMini);
  }

  /**
   * Build Poppu journey nodes under star track
   * @param {number} target
   */
  buildJourney(target) {
    const track = this.els.journeyTrack;
    if (!track || !CONFIG.features?.journey) {
      this.els.journey?.classList.add('hidden');
      return;
    }
    this.els.journey?.classList.remove('hidden');
    const n = Math.max(1, target || 10);
    track.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const node = document.createElement('span');
      node.className = 'journey-node';
      node.dataset.i = String(i);
      track.appendChild(node);
    }
    this.updateJourney(0, n);
  }

  /**
   * @param {number} have
   * @param {number} target
   */
  updateJourney(have, target) {
    const track = this.els.journeyTrack;
    const pop = this.els.journeyPoppu;
    if (!track || !CONFIG.features?.journey) return;
    const n = Math.max(1, target || 10);
    const filled = Math.min(have, n);
    track.querySelectorAll('.journey-node').forEach((node, i) => {
      node.classList.toggle('filled', i < filled);
    });
    if (pop) {
      // Position Poppu above current node (0..n)
      const pct = n <= 1 ? 0 : (Math.min(have, n) / n) * 100;
      // clamp so mascot stays on track
      const left = Math.min(92, Math.max(2, pct * 0.9 + 2));
      pop.style.left = `calc(${left}% - 18px)`;
    }
  }

  /**
   * Poppu speech bubble
   * @param {string} text
   * @param {number} [ms]
   */
  showPoppuSay(text, ms = 2200) {
    if (!CONFIG.features?.poppuTalk || !text) return;
    const bubble = this.els.poppuBubble;
    const tEl = this.els.poppuBubbleText;
    if (!bubble || !tEl) return;
    tEl.textContent = text;
    bubble.classList.remove('hidden');
    clearTimeout(this._bubbleTimer);
    this._bubbleTimer = setTimeout(() => {
      bubble.classList.add('hidden');
    }, ms);
  }

  hidePoppuSay() {
    this.els.poppuBubble?.classList.add('hidden');
  }

  /**
   * Sticker book from mastery + word list
   * @param {{
   *   words: Array<{id:string,display:string,image:string}>,
   *   mastery: Record<string,{count:number}>,
   *   onTap?: (word: object) => void
   * }} data
   */
  renderStickerBook(data) {
    if (!CONFIG.features?.stickers) {
      this.els.stickerBook?.classList.add('hidden');
      return;
    }
    const grid = this.els.stickerGrid;
    if (!grid) return;
    const words = data.words || [];
    const mastery = data.mastery || {};
    const unlocked = words.filter(
      (w) =>
        !isCharMasteryId(w.id) && (mastery[w.id]?.count || 0) >= 1
    );
    // Friend character stickers (char-*) — pinned first, never cut by the cap
    const friends = Object.entries(CONFIG.assets?.friends || {})
      .filter(([id]) => (mastery[`char-${id}`]?.count || 0) >= 1)
      .map(([id, f]) => ({
        id: `char-${id}`,
        display: this.t.friendNames?.[id] || id,
        image: f.sticker,
      }));
    grid.innerHTML = '';
    if (!unlocked.length && !friends.length) {
      const empty = document.createElement('p');
      empty.className = 'sticker-hint';
      empty.textContent = this.t.stickerEmpty || '';
      empty.style.gridColumn = '1 / -1';
      grid.appendChild(empty);
      return;
    }
    // Show unlocked first (max 40 word stickers for light UI)
    for (const w of [...friends, ...unlocked.slice(0, 40)]) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sticker-cell is-on';
      btn.dataset.id = w.id;
      const img = document.createElement('img');
      img.src = (w.image || '').split('?')[0];
      img.alt = w.display || w.id;
      img.loading = 'lazy';
      const name = document.createElement('span');
      name.className = 'sticker-name';
      name.textContent = w.display || w.id;
      btn.appendChild(img);
      btn.appendChild(name);
      btn.addEventListener('click', () => data.onTap?.(w));
      grid.appendChild(btn);
    }
  }

  /**
   * Flash sticker unlock overlay
   * @param {{ image: string, display: string }} word
   */
  showStickerUnlock(word) {
    if (!CONFIG.features?.stickers) return;
    const toast = this.els.stickerToast;
    if (!toast) return;
    if (this.els.stickerToastImg) {
      this.els.stickerToastImg.src = (word.image || '').split('?')[0];
      this.els.stickerToastImg.alt = word.display || '';
    }
    if (this.els.stickerToastText) {
      this.els.stickerToastText.textContent = `${this.t.stickerNew || 'Stiker!'} ${word.display || ''}`;
    }
    toast.classList.remove('hidden');
    clearTimeout(this._stickerTimer);
    this._stickerTimer = setTimeout(() => toast.classList.add('hidden'), 1400);
  }

  onMissionLength(handler) {
    const bind = (btn, len) => {
      btn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handler(len);
      });
    };
    bind(this.els.lengthMini, 'mini');
    bind(this.els.lengthFull, 'full');
  }

  _hideAllScreens() {
    for (const el of [
      this.els.startScreen,
      this.els.gameScreen,
      this.els.victoryScreen,
    ]) {
      el?.classList.add('hidden');
      el?.setAttribute('aria-hidden', 'true');
    }
    this.hideMilestone();
  }

  /**
   * Session star track
   * @param {number} have
   * @param {number} target
   * @param {{ pop?: boolean }} [opts]
   */
  setSessionStars(have, target, opts = {}) {
    if (this.els.sessionStars) {
      this.els.sessionStars.textContent = String(have);
    }
    if (this.els.sessionTarget) {
      this.els.sessionTarget.textContent = String(target);
    }
    if (this.els.goalRemaining) {
      this.els.goalRemaining.textContent = remainingCopy(have, target, {
        chaseStars: this.t.chaseStars,
        oneStarLeft: this.t.oneStarLeft,
        nStarsLeft: this.t.nStarsLeft,
        done: this.t.done,
      });
    }
    const track = this.els.starTrack;
    if (track) {
      track.setAttribute('aria-valuenow', String(have));
      track.setAttribute('aria-valuemax', String(target));
      track.querySelectorAll('.star-slot').forEach((slot, i) => {
        const filled = i < have;
        slot.classList.toggle('filled', filled);
        if (opts.pop && i === have - 1) {
          slot.classList.remove('star-pop');
          void slot.offsetWidth;
          slot.classList.add('star-pop');
        }
      });
    }
    this.updateJourney(have, target);
  }

  setSessionTarget(n) {
    this._sessionTarget = Math.max(1, n || CONFIG.goals.sessionTarget);
    this._buildStarTrack(this._sessionTarget);
    this._buildMissionPreview(this._sessionTarget);
    this.buildJourney(this._sessionTarget);
    if (this.els.sessionTarget) {
      this.els.sessionTarget.textContent = String(this._sessionTarget);
    }
    if (this.els.missionTargetLabel) {
      this.els.missionTargetLabel.textContent = String(this._sessionTarget);
    }
  }

  /**
   * @param {{ image: string, display: string, word: string }} word
   * @param {number} sessionStars
   * @param {{ showFullWord?: boolean, dimTypedLetters?: boolean }} [opts]
   */
  setWord(word, sessionStars, opts = {}) {
    const showFull =
      opts.showFullWord !== undefined
        ? opts.showFullWord
        : Boolean(this.mode.showFullWord);
    this._dimTyped = Boolean(
      opts.dimTypedLetters ?? this.mode.dimTypedLetters
    );
    this._currentDisplay = word.display || '';
    this._currentWord = word.word || '';

    const img = this.els.wordImage;
    if (img) {
      img.classList.remove('image-enter', 'float-idle');
      void img.offsetWidth;
      if (word.image) {
        img.src = (word.image || '').split('?')[0];
        img.alt = showFull ? word.display : word.display || 'Gambar kata';
        img.classList.add('image-enter');
        setTimeout(() => img.classList.add('float-idle'), 450);
      } else {
        img.removeAttribute('src');
        img.alt = word.display || '';
      }
    }

    this.setFullWord(word.display, showFull, 0);
    this.setWordLabel(word.display, false);
    this.renderSlots(word.word, 0);
    this.setProgress(0, word.word.length);
    this.setSessionStars(sessionStars, this._sessionTarget);
    this.hidePraise();
    // Only Easy updates the big single-letter tile
    if (this.mode.showBigLetter) {
      this.setTargetLetter(word.word[0] || '');
    }
  }

  /**
   * Full word text for Easy + Medium.
   * Easy: typed letters dim so the child focuses on remaining letters.
   * @param {string} display
   * @param {boolean} visible
   * @param {number} [filledCount]
   */
  setFullWord(display, visible, filledCount = 0) {
    const el = this.els.wordFull;
    if (!el) return;
    el.classList.toggle('hidden', !visible);
    if (!visible) {
      el.textContent = '';
      return;
    }

    const text = (display || '').toUpperCase();
    if (this._dimTyped && text) {
      el.innerHTML = '';
      const letters = text.split('');
      letters.forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'wf-letter';
        span.textContent = ch;
        if (i < filledCount) span.classList.add('is-done');
        else if (i === filledCount) span.classList.add('is-current');
        el.appendChild(span);
      });
    } else {
      el.textContent = display || '';
    }

    if (filledCount === 0) {
      el.classList.remove('word-full-pop');
      void el.offsetWidth;
      el.classList.add('word-full-pop');
    }
  }

  /**
   * Update dim state of full word letters (Easy)
   * @param {number} filledCount
   */
  updateFullWordProgress(filledCount) {
    if (!this._dimTyped || !this.mode.showFullWord) return;
    this.setFullWord(this._currentDisplay || '', true, filledCount);
  }

  /**
   * @param {string} display
   * @param {boolean} visible
   */
  setWordLabel(display, visible) {
    const el = this.els.wordLabel;
    if (!el) return;
    el.textContent = display || '';
    el.classList.toggle('is-hidden', !visible);
  }

  // ——— Tutorial ———
  /**
   * @param {{ emoji: string, title: string, body: string, step: number, total: number, nextLabel: string }} s
   */
  showTutorialStep(s) {
    if (this.els.tutorialEmoji) this.els.tutorialEmoji.textContent = s.emoji;
    if (this.els.tutorialTitle) this.els.tutorialTitle.textContent = s.title;
    if (this.els.tutorialBody) this.els.tutorialBody.textContent = s.body;
    if (this.els.tutorialNext) this.els.tutorialNext.textContent = s.nextLabel;
    const dots = this.els.tutorialDots;
    if (dots) {
      dots.innerHTML = '';
      for (let i = 0; i < s.total; i++) {
        const d = document.createElement('span');
        d.className = 'tut-dot' + (i === s.step ? ' is-on' : '');
        dots.appendChild(d);
      }
    }
    this.els.tutorial?.classList.remove('hidden');
    this.els.tutorial?.setAttribute('aria-hidden', 'false');
  }

  hideTutorial() {
    this.els.tutorial?.classList.add('hidden');
    this.els.tutorial?.setAttribute('aria-hidden', 'true');
  }

  setTargetLetter(letter) {
    const el = this.els.targetLetter;
    const hint = this.els.targetHint;
    const hintKey = document.getElementById('hint-key');
    if (!el) return;

    if (!letter) {
      const starSrc = CONFIG.assets?.uiIcons?.starFilled || '';
      el.innerHTML = `<img class="star-icon" src="${starSrc}" alt="★" />`;
      el.classList.add('done');
      if (hint) hint.textContent = this.t.done;
      this.setOskTarget('');
      return;
    }

    const up = letter.toUpperCase();
    el.textContent = up;
    el.classList.remove('done');
    el.classList.remove('target-pop');
    void el.offsetWidth;
    el.classList.add('target-pop');
    if (hint) hint.textContent = this.t.typeThisLetter;
    if (hintKey) hintKey.textContent = up;
    this.setOskTarget(letter);
  }

  renderSlots(word, filledCount) {
    const container = this.els.wordSlots;
    if (!container) return;

    const letters = word.toUpperCase().split('');

    // Build slot DOM once per word, then mutate class/text in place
    // (avoids full innerHTML rebuild on every correct keystroke)
    if (
      this._slotWord !== word ||
      container.childElementCount !== letters.length
    ) {
      container.innerHTML = '';
      this._slotStates = [];
      letters.forEach((letter, i) => {
        const slot = document.createElement('span');
        slot.className = 'letter-slot';
        slot.dataset.index = String(i);
        slot.setAttribute('aria-hidden', 'true');
        container.appendChild(slot);
        this._slotStates.push('');
      });
      this._slotWord = word;
    }

    const slots = container.children;
    for (let i = 0; i < letters.length; i++) {
      const slot = slots[i];
      const state =
        i < filledCount ? 'filled' : i === filledCount ? 'current' : 'empty';
      if (this._slotStates[i] === state) continue;
      this._slotStates[i] = state;
      slot.classList.remove('filled', 'current', 'empty');
      slot.classList.add(state);
      if (state === 'filled') {
        slot.textContent = letters[i];
        slot.removeAttribute('aria-current');
      } else {
        slot.innerHTML = '<span class="slot-dash"></span>';
        if (state === 'current') slot.setAttribute('aria-current', 'true');
        else slot.removeAttribute('aria-current');
      }
    }

    // Big letter tile only when mode allows
    if (this.mode.showBigLetter) {
      if (filledCount < word.length) {
        this.setTargetLetter(word[filledCount]);
      } else {
        this.setTargetLetter('');
      }
    }

    // Easy dim-typed full word
    if (this._dimTyped && this.mode.showFullWord) {
      this.updateFullWordProgress(filledCount);
    }

    // OSK target = next letter
    if (filledCount < word.length) {
      this.setOskTarget(word[filledCount]);
    } else {
      this.setOskTarget('');
    }
  }

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
    const img = this.els.imageWrap;
    if (el && !el.classList.contains('hidden')) {
      el.classList.remove('shake');
      void el.offsetWidth;
      el.classList.add('shake');
      setTimeout(() => el.classList.remove('shake'), 400);
    }
    if (target && this.mode.showBigLetter) {
      target.classList.remove('shake');
      void target.offsetWidth;
      target.classList.add('shake');
      setTimeout(() => target.classList.remove('shake'), 400);
    }
    // Hard mode: shake the picture instead
    if (this.mode.id === 'hard' && img) {
      img.classList.remove('shake');
      void img.offsetWidth;
      img.classList.add('shake');
      setTimeout(() => img.classList.remove('shake'), 400);
    }
  }

  setProgress(current, total) {
    const pct = total ? Math.round((current / total) * 100) : 0;
    if (this.els.progressFill) this.els.progressFill.style.width = `${pct}%`;
    if (this.els.progressLabel) {
      this.els.progressLabel.textContent = `${current} / ${total}`;
    }
    // Keep progressbar aria in sync (same pattern as the star track)
    if (this.els.progressTrack) {
      this.els.progressTrack.setAttribute('aria-valuenow', String(pct));
      this.els.progressTrack.setAttribute('aria-valuemin', '0');
      this.els.progressTrack.setAttribute('aria-valuemax', '100');
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

  /**
   * Visible load-error box with a retry button (words.json fetch failed).
   * Created once on the start screen; reused on repeat failures.
   * @param {string} message
   * @param {() => void} onRetry
   */
  showLoadError(message, onRetry) {
    let box = document.getElementById('load-error');
    if (!box) {
      box = document.createElement('div');
      box.id = 'load-error';
      box.className = 'load-error';
      box.setAttribute('role', 'alert');
      const msg = document.createElement('p');
      msg.id = 'load-error-msg';
      msg.className = 'load-error-msg';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'load-error-retry';
      btn.className = 'btn-secondary';
      box.appendChild(msg);
      box.appendChild(btn);
      (this.els.startScreen || document.body).appendChild(box);
    }
    const msg = box.querySelector('#load-error-msg');
    if (msg) msg.textContent = message || '';
    const btn = box.querySelector('#load-error-retry');
    if (btn instanceof HTMLButtonElement) {
      btn.textContent = this.t.retry || 'Coba lagi';
      btn.onclick = (e) => {
        e.preventDefault();
        onRetry?.();
      };
    }
    box.classList.remove('hidden');
  }

  hideLoadError() {
    document.getElementById('load-error')?.classList.add('hidden');
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
   * @param {{ title: string, subtitle: string, trophy: string }} m
   */
  showMilestone(m) {
    if (this.els.milestoneTrophy) this.els.milestoneTrophy.textContent = m.trophy;
    if (this.els.milestoneTitle) this.els.milestoneTitle.textContent = m.title;
    if (this.els.milestoneSub) this.els.milestoneSub.textContent = m.subtitle;
    this.els.milestoneToast?.classList.remove('hidden');
    this.els.milestoneToast?.classList.add('visible');
  }

  hideMilestone() {
    this.els.milestoneToast?.classList.add('hidden');
    this.els.milestoneToast?.classList.remove('visible');
  }

  /**
   * @param {{ sessionStars: number, totalStars: number, target: number }} data
   */
  renderVictory(data) {
    const rank = getRank(data.totalStars, this.t.ranks);
    if (this.els.victoryTitle)
      this.els.victoryTitle.textContent = this.t.victoryTitle;
    if (this.els.victorySub) {
      this.els.victorySub.textContent = this.t.victorySub(data.sessionStars);
    }
    if (this.els.victorySession) {
      this.els.victorySession.textContent = String(data.sessionStars);
    }
    if (this.els.victoryTotal) {
      this.els.victoryTotal.textContent = String(data.totalStars);
    }
    if (this.els.victoryRank) this.els.victoryRank.textContent = rank.emoji;
    if (this.els.victoryRankLabel) {
      this.els.victoryRankLabel.textContent = rank.label;
    }
    if (this.els.victoryNext) {
      if (rank.next) {
        this.els.victoryNext.textContent = this.t.victoryNextRank(
          rank.starsToNext,
          rank.next.emoji,
          rank.next.label
        );
      } else {
        this.els.victoryNext.textContent = this.t.victoryLegend;
      }
    }

    const vs = this.els.victoryStars;
    if (vs) {
      vs.innerHTML = '';
      const starSrc = CONFIG.assets?.uiIcons?.starFilled || '';
      for (let i = 0; i < data.target; i++) {
        const s = document.createElement('span');
        s.className = 'victory-star';
        const img = document.createElement('img');
        img.className = 'star-icon';
        img.src = starSrc;
        img.alt = '';
        s.appendChild(img);
        s.style.animationDelay = `${i * 0.06}s`;
        vs.appendChild(s);
      }
    }
  }

  onStart(handler) {
    this.els.startBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handler();
    });
    window.addEventListener('keydown', (e) => {
      if (this.els.startScreen?.classList.contains('hidden')) return;
      if (!this.els.tutorial?.classList.contains('hidden')) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.classList.contains('mode-btn') ||
          t.classList.contains('cat-btn') ||
          t.id === 'mute-btn' ||
          t.id === 'class-code-input' ||
          t.id === 'daily-btn' ||
          t.closest?.('.class-panel') ||
          t.closest?.('.daily-card'))
      ) {
        return;
      }
      e.preventDefault();
      handler();
    });
  }

  onDaily(handler) {
    this.els.dailyBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handler();
    });
  }

  onShare(handler) {
    this.els.shareBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handler();
    });
  }

  onReplay(handler) {
    this.els.replayBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handler();
    });
  }

  onHome(handler) {
    this.els.homeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handler();
    });
  }

  /**
   * In-game / floating back to start
   * @param {() => void} handler
   */
  onBack(handler) {
    const bind = (el) => {
      el?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handler();
      });
    };
    bind(this.els.backBtn);
    bind(this.els.gameHomeBtn);
  }

  onMute(handler) {
    this.els.muteBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handler();
    });
  }

  onHelp(handler) {
    this.els.helpBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handler();
    });
  }

  /**
   * Escape text for safe HTML insertion
   * @param {string} s
   */
  _esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Parent summary card on victory
   * @param {{ words: number, mode: string, theme: string, lang: string, rank: string, total: number, accuracy?: number }} data
   */
  renderParentSummary(data) {
    const t = this.t;
    const list = this.els.parentList;
    if (!list) return;
    if (this.els.parentTitle) this.els.parentTitle.textContent = t.parentTitle;
    const rows = [
      [t.parentWords, String(data.words)],
      [t.parentMode, data.mode],
      [t.parentTheme, data.theme],
      [t.parentLang, data.lang],
      [t.parentRank, data.rank],
      [t.parentTotal, String(data.total)],
    ];
    if (data.accuracy != null) {
      // Lifetime stats, not this session — label it honestly
      rows.push([
        t.parentAccuracyLifetime || t.parentAccuracy,
        `${data.accuracy}%`,
      ]);
    }
    list.innerHTML = rows
      .map(
        ([k, v]) =>
          `<li><span class="parent-k">${this._esc(k)}</span><span class="parent-v">${this._esc(v)}</span></li>`
      )
      .join('');
  }

  /**
   * @param {(mode: 'easy'|'medium'|'hard'|'letters') => void} handler
   */
  onDifficulty(handler) {
    const bind = (btn, mode) => {
      btn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handler(mode);
      });
    };
    bind(this.els.modeEasy, 'easy');
    bind(this.els.modeMedium, 'medium');
    bind(this.els.modeHard, 'hard');
    bind(this.els.modeLetters, 'letters');
  }

  /**
   * @param {(lang: 'id'|'en') => void} handler
   */
  onLanguage(handler) {
    const bind = (btn, lang) => {
      btn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handler(lang);
      });
    };
    bind(this.els.langId, 'id');
    bind(this.els.langEn, 'en');
  }

  /**
   * @param {(categoryId: string) => void} handler
   */
  onCategory(handler) {
    this.els.catPick?.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const btn = t.closest('.cat-btn');
      if (!(btn instanceof HTMLElement) || !btn.dataset.cat) return;
      e.preventDefault();
      handler(btn.dataset.cat);
    });
  }

  /**
   * @param {() => void} onNext
   * @param {() => void} onSkip
   */
  onTutorial(onNext, onSkip) {
    this.els.tutorialNext?.addEventListener('click', (e) => {
      e.preventDefault();
      onNext();
    });
    this.els.tutorialSkip?.addEventListener('click', (e) => {
      e.preventDefault();
      onSkip();
    });
  }

  onSpeak(handler) {
    this.els.speakBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handler();
    });
  }

  onSlotsClick(handler) {
    this.els.wordSlots?.addEventListener('click', handler);
    this.els.targetLetter?.addEventListener('click', handler);
  }

  onImageClick(handler) {
    this.els.wordImage?.addEventListener('click', handler);
    this.els.imageWrap?.addEventListener('click', (e) => {
      if (
        e.target === this.els.speakBtn ||
        this.els.speakBtn?.contains(/** @type {Node} */ (e.target))
      ) {
        return;
      }
      handler();
    });
  }

  getKeyCatcher() {
    return this.els.keyCatcher instanceof HTMLInputElement
      ? this.els.keyCatcher
      : null;
  }

  // ——— On-screen keyboard ———
  _buildOsk() {
    if (this._oskBuilt || !this.els.oskRows) return;
    const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    this.els.oskRows.innerHTML = '';
    rows.forEach((row, ri) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'osk-row' + (ri === 1 ? ' osk-row-mid' : ri === 2 ? ' osk-row-bot' : '');
      for (const ch of row) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'osk-key';
        btn.dataset.key = ch;
        btn.textContent = ch.toUpperCase();
        btn.setAttribute('aria-label', ch.toUpperCase());
        rowEl.appendChild(btn);
      }
      this.els.oskRows.appendChild(rowEl);
    });
    this._oskBuilt = true;
  }

  /**
   * @param {(letter: string) => void} handler
   */
  onOsk(handler) {
    this._buildOsk();
    this.els.oskRows?.addEventListener('pointerdown', (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const key = t.closest('.osk-key');
      if (!(key instanceof HTMLElement) || !key.dataset.key) return;
      e.preventDefault();
      e.stopPropagation();
      key.classList.add('is-pressed');
      setTimeout(() => key.classList.remove('is-pressed'), 120);
      handler(key.dataset.key);
    });
  }

  /**
   * Highlight target key + move finger guide
   * @param {string} letter
   */
  setOskTarget(letter) {
    this._oskTarget = String(letter || '').toLowerCase();
    this._positionOskFinger();
  }

  _positionOskFinger() {
    let found = false;
    this.els.oskRows?.querySelectorAll('.osk-key').forEach((btn) => {
      const on = btn.dataset.key === this._oskTarget;
      btn.classList.toggle('is-target', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-current', on ? 'true' : 'false');
      if (on && this.els.oskFinger) {
        found = true;
        const r = btn.getBoundingClientRect();
        const host = this.els.osk?.getBoundingClientRect();
        if (host) {
          this.els.oskFinger.style.left = `${r.left - host.left + r.width / 2}px`;
          this.els.oskFinger.style.top = `${r.top - host.top - 8}px`;
          this.els.oskFinger.classList.add('is-on');
        }
      }
    });
    if (!this._oskTarget || !found) {
      this.els.oskFinger?.classList.remove('is-on');
    }
  }

  /**
   * Flash key result
   * @param {string} letter
   * @param {'ok'|'bad'} kind
   */
  flashOskKey(letter, kind) {
    const ch = String(letter || '').toLowerCase();
    const btn = this.els.oskRows?.querySelector(`.osk-key[data-key="${ch}"]`);
    if (!btn) return;
    btn.classList.remove('is-ok', 'is-bad');
    void btn.offsetWidth;
    btn.classList.add(kind === 'ok' ? 'is-ok' : 'is-bad');
    setTimeout(() => btn.classList.remove('is-ok', 'is-bad'), 280);
  }

  setSpeakingPulse(on) {
    this.els.speakBtn?.classList.toggle('is-speaking', Boolean(on));
    this.els.imageWrap?.classList.toggle('is-speaking', Boolean(on));
  }

  // ——— Daily / weekly / parent / a11y / badges ———
  renderWeekly(weekly) {
    if (this.els.weeklyDesc) this.els.weeklyDesc.textContent = weekly.desc;
    this.els.weeklyBadge?.classList.toggle('hidden', !weekly.done);
    this.els.weeklyCard?.classList.toggle('is-done', Boolean(weekly.done));
    if (this.els.weeklyBtn) {
      this.els.weeklyBtn.textContent = weekly.done
        ? this.t.weeklyReplay || this.t.weeklyBtn
        : weekly.btnLabel || this.t.weeklyBtn;
      this.els.weeklyBtn.disabled = false;
    }
  }

  /**
   * Optional child name for the certificate — created once inside the
   * parent dashboard so index.html stays untouched.
   */
  _ensureChildNameInput() {
    if (this.els.childNameInput instanceof HTMLInputElement) return;
    const body = document.querySelector('#parent-dash .parent-dash-body');
    if (!body) return;
    const label = document.createElement('label');
    label.className = 'a11y-check child-name-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'child-name-input';
    input.className = 'class-input';
    input.maxLength = 24;
    input.autocomplete = 'off';
    input.spellcheck = false;
    const span = document.createElement('span');
    span.id = 'child-name-label';
    label.appendChild(input);
    label.appendChild(span);
    body.insertBefore(label, body.firstChild);
    this.els.childNameInput = input;
    this.els.childNameLabel = span;
    input.addEventListener('change', () => {
      this._onChildName?.(input.value.trim());
    });
  }

  /**
   * @param {(name: string) => void} handler
   */
  onChildName(handler) {
    this._onChildName = handler;
  }

  /**
   * @param {{
   *   totalStars: number,
   *   missionsWon: number,
   *   accuracy: number,
   *   masteryLine: string,
   *   playMin: number,
   *   achievements: string[],
   *   analyticsOptIn: boolean,
   *   a11y: { highContrast?: boolean, largeText?: boolean },
   *   childName?: string,
   *   badgeLabels: Array<{ id: string, emoji: string, title: string, unlocked: boolean }>,
   * }} data
   */
  renderParentDash(data) {
    const t = this.t;
    this._ensureChildNameInput();
    if (this.els.childNameLabel) {
      this.els.childNameLabel.textContent = t.childNameLabel || '';
    }
    if (this.els.childNameInput instanceof HTMLInputElement) {
      this.els.childNameInput.placeholder = t.childNameLabel || '';
      // Don't clobber the field while the parent is typing
      if (document.activeElement !== this.els.childNameInput) {
        this.els.childNameInput.value = data.childName || '';
      }
    }
    const list = this.els.parentDashList;
    if (list) {
      const rows = [
        [t.parentTotal, String(data.totalStars)],
        [t.victorySession, String(data.missionsWon)],
        [t.parentAccuracy, `${data.accuracy}%`],
        [t.parentPlayTime, t.minutes(data.playMin)],
      ];
      list.innerHTML = rows
        .map(
          ([k, v]) =>
            `<li><span class="parent-k">${k}</span><span class="parent-v">${v}</span></li>`
        )
        .join('');
    }
    if (this.els.masteryLine) this.els.masteryLine.textContent = data.masteryLine;
    if (this.els.analyticsOptIn instanceof HTMLInputElement) {
      this.els.analyticsOptIn.checked = Boolean(data.analyticsOptIn);
    }
    if (this.els.a11yContrast instanceof HTMLInputElement) {
      this.els.a11yContrast.checked = Boolean(data.a11y?.highContrast);
    }
    if (this.els.a11yLarge instanceof HTMLInputElement) {
      this.els.a11yLarge.checked = Boolean(data.a11y?.largeText);
    }
    const grid = this.els.badgesGrid;
    if (grid) {
      grid.innerHTML = '';
      for (const b of data.badgeLabels || []) {
        const span = document.createElement('span');
        span.className = `badge-chip ${b.unlocked ? 'is-on' : 'is-off'}`;
        span.title = b.title;
        span.textContent = `${b.emoji} `;
        const name = document.createElement('span');
        name.className = 'badge-name';
        name.textContent = b.title;
        span.appendChild(name);
        grid.appendChild(span);
      }
    }
  }

  applyA11y(a11y) {
    document.documentElement.classList.toggle(
      'a11y-contrast',
      Boolean(a11y?.highContrast)
    );
    document.documentElement.classList.toggle(
      'a11y-large',
      Boolean(a11y?.largeText)
    );
  }

  /**
   * @param {{ emoji: string, title: string, name: string }} a
   */
  showAchievementToast(a) {
    if (this.els.achToastEmoji) this.els.achToastEmoji.textContent = a.emoji;
    if (this.els.achToastTitle) this.els.achToastTitle.textContent = a.title;
    if (this.els.achToastName) this.els.achToastName.textContent = a.name;
    this.els.achToast?.classList.remove('hidden');
    this.els.achToast?.classList.add('visible');
    clearTimeout(this._achTimer);
    this._achTimer = setTimeout(() => this.hideAchievementToast(), 2400);
  }

  hideAchievementToast() {
    this.els.achToast?.classList.add('hidden');
    this.els.achToast?.classList.remove('visible');
  }

  /**
   * @param {Array<{name:string,stars:number}>} rows
   */
  renderClassBoard(rows) {
    const has = rows && rows.length;
    this.els.classBoardTitle?.classList.toggle('hidden', !has);
    this.els.classExportBtn?.classList.toggle('hidden', !has);
    this.els.classPlayBtn?.classList.toggle('hidden', !this.els.classActive || this.els.classActive.classList.contains('hidden'));
    const el = this.els.classBoard;
    if (!el) return;
    el.innerHTML = '';
    for (const r of (rows || []).slice(0, 8)) {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = r.name || '';
      const stars = document.createElement('span');
      stars.textContent = `★ ${r.stars}`;
      li.appendChild(name);
      li.appendChild(stars);
      el.appendChild(li);
    }
  }

  onWeekly(handler) {
    this.els.weeklyBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handler();
    });
  }

  onCert(handler) {
    this.els.certBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handler();
    });
  }

  onA11y(handlers) {
    this.els.a11yContrast?.addEventListener('change', () => {
      handlers.onContrast?.(
        this.els.a11yContrast instanceof HTMLInputElement
          ? this.els.a11yContrast.checked
          : false
      );
    });
    this.els.a11yLarge?.addEventListener('change', () => {
      handlers.onLarge?.(
        this.els.a11yLarge instanceof HTMLInputElement
          ? this.els.a11yLarge.checked
          : false
      );
    });
    this.els.analyticsOptIn?.addEventListener('change', () => {
      handlers.onAnalytics?.(
        this.els.analyticsOptIn instanceof HTMLInputElement
          ? this.els.analyticsOptIn.checked
          : false
      );
    });
  }

  getPlayerName() {
    if (this.els.classNameInput instanceof HTMLInputElement) {
      return this.els.classNameInput.value.trim();
    }
    return '';
  }

  setPlayerName(name) {
    if (this.els.classNameInput instanceof HTMLInputElement) {
      this.els.classNameInput.value = name || '';
    }
  }

  /**
   * @param {{ onJoin: Function, onCreate: Function, onShare: Function, onClear: Function, onExport?: Function, onPlay?: Function }} handlers
   */
  onClassroom(handlers) {
    this.els.classJoinBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      const code =
        this.els.classCodeInput instanceof HTMLInputElement
          ? this.els.classCodeInput.value
          : '';
      handlers.onJoin?.(code);
    });
    this.els.classCreateBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handlers.onCreate?.();
    });
    this.els.classShareBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handlers.onShare?.();
    });
    this.els.classClearBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handlers.onClear?.();
    });
    this.els.classExportBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handlers.onExport?.();
    });
    this.els.classPlayBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handlers.onPlay?.();
    });
    this.els.classCodeInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        const code =
          this.els.classCodeInput instanceof HTMLInputElement
            ? this.els.classCodeInput.value
            : '';
        handlers.onJoin?.(code);
      }
    });
  }

  // ——— Parental gate ———
  _bindGate() {
    this.els.gateAnswers?.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const btn = t.closest('.gate-answer');
      if (!(btn instanceof HTMLElement)) return;
      e.preventDefault();
      this._answerGate(Number(btn.dataset.value));
    });
    this.els.gateClose?.addEventListener('click', (e) => {
      e.preventDefault();
      this._closeGate(false);
    });
    // Escape closes the gate but never grants access; Tab stays inside
    this.els.gateOverlay?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this._closeGate(false);
      } else if (e.key === 'Tab') {
        this._trapGateTab(e);
      }
    });
  }

  /**
   * Focus trap — while the gate overlay is open, Tab / Shift+Tab cycle
   * within the modal instead of leaking to the page behind it.
   * @param {KeyboardEvent} e
   */
  _trapGateTab(e) {
    const overlay = this.els.gateOverlay;
    if (!overlay || overlay.classList.contains('hidden')) return;
    const focusables = [
      ...overlay.querySelectorAll('button, [href], input, [tabindex]'),
    ].filter(
      (el) =>
        el instanceof HTMLElement &&
        !el.disabled &&
        el.tabIndex >= 0 &&
        el.getClientRects().length > 0
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !overlay.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !overlay.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  }

  /** True while the in-memory parent session (5 min) is still valid */
  gatePassed() {
    if (this._gateE2E) return true;
    return Date.now() - this._gatePassedAt < 5 * 60 * 1000;
  }

  /** Close the gate overlay if open — never grants access, never fires onPass */
  closeGate() {
    this._closeGate(false);
  }

  /**
   * Run `onPass` immediately if the gate is already passed,
   * otherwise show the gate first.
   * @param {() => void} onPass
   */
  requireGate(onPass) {
    if (this.gatePassed()) {
      onPass?.();
      return;
    }
    this._gateOnPass = onPass || null;
    this._openGate();
  }

  _openGate() {
    const overlay = this.els.gateOverlay;
    if (!overlay) return;
    this._gatePrevFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    this._newGateQuestion();
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    const first = overlay.querySelector('.gate-answer');
    if (first instanceof HTMLElement) first.focus();
  }

  _newGateQuestion() {
    const a = 2 + Math.floor(Math.random() * 8); // 2–9
    const b = 2 + Math.floor(Math.random() * 8);
    this._gateAnswer = a * b;
    if (this.els.gateQuestion) {
      this.els.gateQuestion.textContent = this.t.gateQuestion
        ? this.t.gateQuestion(a, b)
        : `${a} × ${b} = ?`;
    }
    // 1 correct + 3 close-but-wrong options, shuffled
    const options = new Set([this._gateAnswer]);
    while (options.size < 4) {
      const delta =
        (1 + Math.floor(Math.random() * 5)) * (Math.random() < 0.5 ? -1 : 1);
      const wrong = this._gateAnswer + delta;
      if (wrong > 0) options.add(wrong);
    }
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    const host = this.els.gateAnswers;
    if (host) {
      host.innerHTML = '';
      for (const v of shuffled) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-secondary gate-answer';
        btn.dataset.value = String(v);
        btn.textContent = String(v);
        host.appendChild(btn);
      }
    }
    if (this.els.gateMsg) this.els.gateMsg.textContent = '';
  }

  /**
   * @param {number} value
   */
  _answerGate(value) {
    if (value === this._gateAnswer) {
      this._closeGate(true);
      return;
    }
    // Wrong — gentle retry with a fresh question
    this._newGateQuestion();
    if (this.els.gateMsg) this.els.gateMsg.textContent = this.t.gateWrong || '';
    const first = this.els.gateAnswers?.querySelector('.gate-answer');
    if (first instanceof HTMLElement) first.focus();
  }

  /**
   * @param {boolean} passed
   */
  _closeGate(passed) {
    const overlay = this.els.gateOverlay;
    overlay?.classList.add('hidden');
    overlay?.setAttribute('aria-hidden', 'true');
    const onPass = this._gateOnPass;
    this._gateOnPass = null;
    if (passed) {
      this._gatePassedAt = Date.now();
      onPass?.();
    }
    this._gatePrevFocus?.focus();
    this._gatePrevFocus = null;
  }
}

export default UI;

