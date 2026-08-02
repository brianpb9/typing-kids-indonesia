/**
 * UI — screens, word display, session stars, victory, mute, 3 modes
 */
import { CONFIG, getMode } from './config.js';
import { getRank, remainingCopy } from './storage.js';

export class UI {
  constructor() {
    this.els = {
      startScreen: document.getElementById('start-screen'),
      gameScreen: document.getElementById('game-screen'),
      victoryScreen: document.getElementById('victory-screen'),
      startBtn: document.getElementById('start-btn'),
      replayBtn: document.getElementById('replay-btn'),
      homeBtn: document.getElementById('home-btn'),
      muteBtn: document.getElementById('mute-btn'),
      wordImage: document.getElementById('word-image'),
      wordLabel: document.getElementById('word-label'),
      wordSlots: document.getElementById('word-slots'),
      progressFill: document.getElementById('progress-fill'),
      progressLabel: document.getElementById('progress-label'),
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
      lifetimeStars: document.getElementById('lifetime-stars'),
      collectionRank: document.getElementById('collection-rank'),
      missionPreview: document.getElementById('mission-preview'),
      missionTargetLabel: document.getElementById('mission-target-label'),
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
    };

    /** @type {ReturnType<typeof getMode>} */
    this.mode = getMode('easy');

    this._sessionTarget = CONFIG.goals.sessionTarget;
    this._buildStarTrack(this._sessionTarget);
    this._buildMissionPreview(this._sessionTarget);
    if (this.els.sessionTarget) {
      this.els.sessionTarget.textContent = String(this._sessionTarget);
    }
    if (this.els.missionTargetLabel) {
      this.els.missionTargetLabel.textContent = String(this._sessionTarget);
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
      s.textContent = '★';
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
   * @param {{ totalStars: number, muted?: boolean, difficulty?: string }} save
   */
  renderCollection(save) {
    const rank = getRank(save.totalStars || 0);
    if (this.els.lifetimeStars) {
      this.els.lifetimeStars.textContent = String(save.totalStars || 0);
    }
    if (this.els.collectionRank) {
      this.els.collectionRank.textContent = `${rank.emoji} ${rank.label}`;
    }
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
    this.applyModeLayout();
  }

  /** Show/hide big letter, slots, progress, hints based on mode */
  applyModeLayout() {
    const m = this.mode;
    this.els.targetBlock?.classList.toggle('hidden', !m.showBigLetter);
    this.els.wordSlots?.classList.toggle('hidden', !m.showSlots);
    this.els.letterProgressBar?.classList.toggle('hidden', !m.showLetterProgress);
    this.els.kbHint?.classList.toggle('hidden', !m.showKbHint);
    this.els.kbHintHard?.classList.toggle('hidden', m.id !== 'hard');

    // Hard: larger image focus
    this.els.gameScreen?.classList.toggle('mode-hard', m.id === 'hard');
    this.els.gameScreen?.classList.toggle('mode-medium', m.id === 'medium');
    this.els.gameScreen?.classList.toggle('mode-easy', m.id === 'easy');
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
  }

  showGame() {
    this._hideAllScreens();
    this.els.gameScreen?.classList.remove('hidden');
    this.els.gameScreen?.setAttribute('aria-hidden', 'false');
  }

  showVictory() {
    this._hideAllScreens();
    this.els.victoryScreen?.classList.remove('hidden');
    this.els.victoryScreen?.setAttribute('aria-hidden', 'false');
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
      this.els.goalRemaining.textContent = remainingCopy(have, target);
    }
    const track = this.els.starTrack;
    if (track) {
      track.setAttribute('aria-valuenow', String(have));
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
  }

  /**
   * @param {{ image: string, display: string, word: string }} word
   * @param {number} sessionStars
   * @param {{ showLabel: boolean }} labelOpts
   */
  setWord(word, sessionStars, labelOpts = { showLabel: false }) {
    const img = this.els.wordImage;
    if (img) {
      img.classList.remove('image-enter', 'float-idle');
      void img.offsetWidth;
      img.src = word.image;
      img.alt = labelOpts.showLabel ? word.display : 'Gambar kata';
      img.classList.add('image-enter');
      setTimeout(() => img.classList.add('float-idle'), 450);
    }

    this.setWordLabel(word.display, labelOpts.showLabel);
    this.renderSlots(word.word, 0);
    this.setProgress(0, word.word.length);
    this.setSessionStars(sessionStars, this._sessionTarget);
    this.hidePraise();
    this.setTargetLetter(word.word[0] || '');
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
    if (visible) {
      el.classList.remove('label-reveal');
      void el.offsetWidth;
      el.classList.add('label-reveal');
    }
  }

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

  renderSlots(word, filledCount) {
    const container = this.els.wordSlots;
    if (!container) return;

    container.innerHTML = '';
    const letters = word.toUpperCase().split('');

    letters.forEach((letter, i) => {
      const slot = document.createElement('span');
      slot.className = 'letter-slot';
      slot.dataset.index = String(i);
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

    if (filledCount < word.length) {
      this.setTargetLetter(word[filledCount]);
    } else {
      this.setTargetLetter('');
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
    const rank = getRank(data.totalStars);
    if (this.els.victoryTitle) this.els.victoryTitle.textContent = 'JUARA!';
    if (this.els.victorySub) {
      this.els.victorySub.textContent = `Kamu kumpulkan ${data.sessionStars} bintang!`;
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
        this.els.victoryNext.textContent = `${rank.starsToNext} bintang lagi jadi ${rank.next.emoji} ${rank.next.label}!`;
      } else {
        this.els.victoryNext.textContent = 'Kamu sudah Legenda! Main lagi yuk~';
      }
    }

    const vs = this.els.victoryStars;
    if (vs) {
      vs.innerHTML = '';
      for (let i = 0; i < data.target; i++) {
        const s = document.createElement('span');
        s.className = 'victory-star';
        s.textContent = '★';
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
      if (e.key !== 'Enter' && e.key !== ' ') return;
      // Don't auto-start when toggling mode / mute with keyboard
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.classList.contains('mode-btn') || t.id === 'mute-btn')
      ) {
        return;
      }
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

  onMute(handler) {
    this.els.muteBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      handler();
    });
  }

  /**
   * @param {(mode: 'easy'|'medium'|'hard') => void} handler
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
}

export default UI;
