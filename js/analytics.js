/**
 * Privacy-first opt-in analytics — local only (no network)
 * Events stored in localStorage for parent dashboard funnel.
 */
import { loadSave, patchSave } from './storage.js';

const MAX_EVENTS = 200;

/**
 * @param {string} name
 * @param {Record<string, string|number|boolean>} [props]
 */
export function track(name, props = {}) {
  try {
    const save = loadSave();
    if (!save.analyticsOptIn) return;
    const events = Array.isArray(save.analyticsEvents)
      ? [...save.analyticsEvents]
      : [];
    events.push({
      name,
      props,
      t: Date.now(),
    });
    while (events.length > MAX_EVENTS) events.shift();
    patchSave({ analyticsEvents: events });
  } catch {
    /* ignore */
  }
}

/**
 * Funnel summary for parent panel
 * @returns {{ starts: number, firstStar: number, victories: number }}
 */
export function funnelSummary() {
  const save = loadSave();
  const events = save.analyticsEvents || [];
  const count = (n) => events.filter((e) => e.name === n).length;
  return {
    starts: count('mission_start'),
    firstStar: count('star_earned'),
    victories: count('mission_win'),
  };
}

export default { track, funnelSummary };
