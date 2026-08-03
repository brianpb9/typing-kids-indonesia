/**
 * Poppu friendship level — soft meta progression from stars + stickers
 */

/** @type {Array<{ id: string, minStars: number, hearts: number, emoji: string }>} */
export const FRIENDSHIP_LEVELS = [
  { id: 'stranger', minStars: 0, hearts: 1, emoji: '🤍' },
  { id: 'buddy', minStars: 5, hearts: 2, emoji: '💛' },
  { id: 'friend', minStars: 15, hearts: 3, emoji: '🧡' },
  { id: 'bestie', minStars: 35, hearts: 4, emoji: '💖' },
  { id: 'soulmate', minStars: 70, hearts: 5, emoji: '💗' },
];

/**
 * @param {number} totalStars
 * @param {number} [stickerCount]
 */
export function getFriendship(totalStars = 0, stickerCount = 0) {
  // Stickers give a soft boost (each sticker ~0.5 star equivalent for level thresholds)
  const score = (totalStars || 0) + Math.floor((stickerCount || 0) * 0.5);
  let current = FRIENDSHIP_LEVELS[0];
  for (const lv of FRIENDSHIP_LEVELS) {
    if (score >= lv.minStars) current = lv;
  }
  const idx = FRIENDSHIP_LEVELS.indexOf(current);
  const next = FRIENDSHIP_LEVELS[idx + 1] || null;
  return {
    ...current,
    score,
    next,
    starsToNext: next ? Math.max(0, next.minStars - score) : 0,
    progress: next
      ? Math.min(
          1,
          (score - current.minStars) /
            Math.max(1, next.minStars - current.minStars)
        )
      : 1,
  };
}

export default { FRIENDSHIP_LEVELS, getFriendship };
