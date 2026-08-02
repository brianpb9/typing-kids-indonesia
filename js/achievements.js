/**
 * Achievement badges — unlock conditions checked after progress events
 */

/** @typedef {{ id: string, emoji: string, titleId: string, descId: string }} BadgeDef */

/** @type {BadgeDef[]} */
export const BADGES = [
  { id: 'first_star', emoji: '⭐', titleId: 'achFirstStar', descId: 'achFirstStarDesc' },
  { id: 'mission_1', emoji: '🏆', titleId: 'achMission1', descId: 'achMission1Desc' },
  { id: 'mission_5', emoji: '🎖️', titleId: 'achMission5', descId: 'achMission5Desc' },
  { id: 'streak_3', emoji: '🔥', titleId: 'achStreak3', descId: 'achStreak3Desc' },
  { id: 'streak_7', emoji: '💪', titleId: 'achStreak7', descId: 'achStreak7Desc' },
  { id: 'combo_5', emoji: '⚡', titleId: 'achCombo5', descId: 'achCombo5Desc' },
  { id: 'daily_1', emoji: '📅', titleId: 'achDaily1', descId: 'achDaily1Desc' },
  { id: 'master_10', emoji: '📚', titleId: 'achMaster10', descId: 'achMaster10Desc' },
  { id: 'master_50', emoji: '🧠', titleId: 'achMaster50', descId: 'achMaster50Desc' },
  { id: 'hard_win', emoji: '🔥', titleId: 'achHardWin', descId: 'achHardWinDesc' },
  { id: 'letters_done', emoji: '🔤', titleId: 'achLetters', descId: 'achLettersDesc' },
  { id: 'stars_30', emoji: '🌟', titleId: 'achStars30', descId: 'achStars30Desc' },
  { id: 'stars_100', emoji: '👑', titleId: 'achStars100', descId: 'achStars100Desc' },
];

/**
 * @param {object} save
 * @param {{
 *   sessionBestCombo?: number,
 *   missionKind?: string,
 *   mode?: string,
 *   justWonMission?: boolean,
 *   justDaily?: boolean,
 *   justLetters?: boolean,
 * }} [ctx]
 * @returns {string[]} newly unlocked badge ids
 */
export function evaluateAchievements(save, ctx = {}) {
  const have = new Set(save.achievements || []);
  const unlocked = [];

  const tryUnlock = (id, cond) => {
    if (!have.has(id) && cond) {
      have.add(id);
      unlocked.push(id);
    }
  };

  const masteryCount = Object.values(save.mastery || {}).filter(
    (m) => (m?.count || 0) >= 2
  ).length;

  tryUnlock('first_star', (save.totalStars || 0) >= 1);
  tryUnlock('mission_1', (save.missionsWon || 0) >= 1);
  tryUnlock('mission_5', (save.missionsWon || 0) >= 5);
  tryUnlock('streak_3', (save.streak?.current || 0) >= 3);
  tryUnlock('streak_7', (save.streak?.current || 0) >= 7);
  tryUnlock('combo_5', (ctx.sessionBestCombo || save.bestCombo || 0) >= 5);
  tryUnlock('daily_1', Boolean(ctx.justDaily) || Boolean(save.daily?.completed));
  tryUnlock('master_10', masteryCount >= 10);
  tryUnlock('master_50', masteryCount >= 50);
  tryUnlock('hard_win', Boolean(ctx.justWonMission && ctx.mode === 'hard'));
  tryUnlock('letters_done', Boolean(ctx.justLetters) || Boolean(save.lettersDone));
  tryUnlock('stars_30', (save.totalStars || 0) >= 30);
  tryUnlock('stars_100', (save.totalStars || 0) >= 100);

  return unlocked;
}

/**
 * @param {string} id
 */
export function getBadge(id) {
  return BADGES.find((b) => b.id === id) || null;
}

export default { BADGES, evaluateAchievements, getBadge };
