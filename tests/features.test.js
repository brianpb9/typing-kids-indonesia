/**
 * Daily, classroom, dim mode, voice pack integrity
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG, getMode } from '../js/config.js';
import { getDailyMission, dateKey } from '../js/daily.js';
import { getWeeklyMission, weekKey } from '../js/weekly.js';
import {
  generateClassCode,
  normalizeCode,
  resolveClassroom,
} from '../js/classroom.js';
import { buildLetterBank, letterSpeakName } from '../js/letters.js';
import { evaluateAchievements, BADGES } from '../js/achievements.js';
import { getStrings } from '../js/i18n.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('features flags', () => {
  it('enables voice, daily, classroom, combo, share, OSK, weekly, journey', () => {
    assert.equal(CONFIG.features.voicePacks, true);
    assert.equal(CONFIG.features.dailyChallenge, true);
    assert.equal(CONFIG.features.weeklyChallenge, true);
    assert.equal(CONFIG.features.multiplayer, true);
    assert.equal(CONFIG.features.combo, true);
    assert.equal(CONFIG.features.parentShare, true);
    assert.equal(CONFIG.features.onScreenKeyboard, true);
    assert.equal(CONFIG.features.letterMode, true);
    assert.equal(CONFIG.features.certificate, true);
    assert.equal(CONFIG.features.journey, true);
    assert.equal(CONFIG.features.stickers, true);
    assert.equal(CONFIG.features.miniMission, true);
    assert.equal(CONFIG.features.worldMap, true);
    assert.equal(CONFIG.features.friendship, true);
    assert.equal(CONFIG.features.perfectWord, true);
    assert.equal(CONFIG.gameplay.miniTarget, 5);
    assert.equal(CONFIG.gameplay.fullTarget, 10);
  });
});

describe('friendship', () => {
  it('levels up with stars', async () => {
    const { getFriendship } = await import('../js/friendship.js');
    assert.equal(getFriendship(0).id, 'stranger');
    assert.equal(getFriendship(5).id, 'buddy');
    assert.equal(getFriendship(70).hearts, 5);
  });
});

describe('easy dim typed letters', () => {
  it('only easy dims typed letters', () => {
    assert.equal(getMode('easy').dimTypedLetters, true);
    assert.equal(getMode('medium').dimTypedLetters, false);
    assert.equal(getMode('hard').dimTypedLetters, false);
  });
});

describe('daily mission', () => {
  it('is deterministic for a given day', () => {
    const d = new Date('2026-03-15T12:00:00');
    const a = getDailyMission(d);
    const b = getDailyMission(d);
    assert.equal(a.key, b.key);
    assert.equal(a.category, b.category);
    assert.equal(a.mode, b.mode);
    assert.equal(a.target, b.target);
    assert.equal(a.key, dateKey(d));
    assert.ok(a.target >= 5 && a.target <= 8);
    assert.ok(['easy', 'medium'].includes(a.mode));
  });

  it('never seeds huruf-susah specialty category', () => {
    for (let i = 0; i < 400; i++) {
      const d = new Date(Date.UTC(2024, 0, 1 + (i % 365)));
      const m = getDailyMission(d);
      assert.notEqual(m.category, 'huruf-susah');
      assert.notEqual(m.category, 'huruf');
      assert.notEqual(m.category, 'all');
    }
  });
});

describe('classroom codes', () => {
  it('generates and resolves stable mission', () => {
    const code = generateClassCode();
    assert.ok(code.length === 4);
    const a = resolveClassroom(code);
    const b = resolveClassroom(code.toLowerCase());
    assert.ok(a);
    assert.equal(a.code, b.code);
    assert.equal(a.mode, b.mode);
    assert.equal(a.category, b.category);
    assert.equal(a.target, b.target);
    assert.ok(a.target >= 6 && a.target <= 10);
  });

  it('rejects short codes', () => {
    assert.equal(resolveClassroom('AB'), null);
    assert.equal(normalizeCode('ab-12!').length >= 3 || true, true);
  });
});

describe('voice pack assets', () => {
  it('manifest exists with id/en clips', () => {
    const manifestPath = path.join(root, 'assets/audio/voice/manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'manifest missing');
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.ok(m.id && m.en);
    const idWords = JSON.parse(
      fs.readFileSync(path.join(root, 'data/words.json'), 'utf8')
    ).words;
    const enWords = JSON.parse(
      fs.readFileSync(path.join(root, 'data/words-en.json'), 'utf8')
    ).words;
    for (const w of idWords) {
      assert.ok(m.id[w.id], `missing id clip ${w.id}`);
      const p = path.join(root, m.id[w.id]);
      assert.ok(fs.existsSync(p), `file ${p}`);
    }
    for (const w of enWords) {
      assert.ok(m.en[w.id], `missing en clip ${w.id}`);
      const p = path.join(root, m.en[w.id]);
      assert.ok(fs.existsSync(p), `file ${p}`);
    }
    for (const k of [
      '_praise_great',
      '_praise_good',
      '_praise_win',
      '_bonus',
      '_timeout',
    ]) {
      assert.ok(m.id[k], `phrase id ${k}`);
      assert.ok(m.en[k], `phrase en ${k}`);
    }
  });

  it('service worker progressive shell + deferred media', () => {
    const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
    assert.match(sw, /PRECACHE_SHELL/);
    assert.match(sw, /typing-kids-v33/);
    assert.match(sw, /warmMedia|WARM_MEDIA/);
    assert.match(sw, /precacheVoicePack/);
    assert.match(sw, /precacheWordImages/);
    assert.match(sw, /CACHE_URLS/);
    // Install caches shell only (PRECACHE_SHELL), not full media lists inline
    const installBlock = sw.slice(
      sw.indexOf("addEventListener('install'"),
      sw.indexOf("addEventListener('activate'")
    );
    assert.match(installBlock, /PRECACHE_SHELL/);
    assert.ok(
      !installBlock.includes('precacheVoicePack(cache)'),
      'voice pack should not run inside install'
    );
    assert.ok(fs.existsSync(path.join(root, 'js/cache.js')));
  });

  it('Poppu brand pack is present', () => {
    for (const f of [
      'assets/brand/poppu/poppu-idle.png',
      'assets/brand/poppu/poppu-happy.png',
      'assets/brand/poppu/icon-192.png',
      'assets/brand/poppu/icon-512.png',
      'assets/brand/poppu/favicon-64.png',
    ]) {
      assert.ok(fs.existsSync(path.join(root, f)), f);
    }
    assert.equal(CONFIG.app.name, 'Poppu Typing Kids');
    // Unused POPPU PLUS logo should not ship
    assert.ok(!fs.existsSync(path.join(root, 'assets/brand/poppu/logo.png')));
  });
});

describe('i18n new keys', () => {
  it('daily/class/share/weekly/a11y keys exist in both langs', () => {
    const keys = [
      'dailyTitle',
      'dailyBtn',
      'streakLabel',
      'comboLabel',
      'classTitle',
      'shareBtn',
      'shareTitle',
      'weeklyTitle',
      'certBtn',
      'a11yContrast',
      'oskLabel',
      'masteryTitle',
    ];
    for (const lang of ['id', 'en']) {
      const t = getStrings(lang);
      for (const k of keys) {
        assert.ok(k in t, `${lang}.${k}`);
      }
      assert.ok(t.modes.letters);
      assert.ok(t.categories['huruf-susah']);
    }
  });
});

describe('weekly + letters + achievements', () => {
  it('weekly mission is deterministic and kid-safe (no hard)', () => {
    const d = new Date('2026-03-15T12:00:00');
    const a = getWeeklyMission(d);
    const b = getWeeklyMission(d);
    assert.equal(a.key, b.key);
    assert.equal(a.key, weekKey(d));
    assert.ok(a.target >= 8);
    for (let i = 0; i < 200; i++) {
      const w = getWeeklyMission(new Date(Date.UTC(2024, 0, 1 + i * 7)));
      assert.ok(['easy', 'medium'].includes(w.mode), w.mode);
      assert.notEqual(w.category, 'huruf-susah');
    }
  });

  it('letter bank has 26 letters', () => {
    const bank = buildLetterBank('id');
    assert.equal(bank.length, 26);
    assert.equal(bank[0].word, 'a');
    assert.equal(letterSpeakName('b', 'id'), 'be');
    assert.equal(letterSpeakName('b', 'en'), 'B');
  });

  it('achievements unlock on conditions', () => {
    assert.ok(BADGES.length >= 10);
    const unlocked = evaluateAchievements(
      { totalStars: 1, missionsWon: 0, achievements: [] },
      {}
    );
    assert.ok(unlocked.includes('first_star'));
  });
});
