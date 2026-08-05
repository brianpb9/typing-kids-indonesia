/**
 * Reskin asset check — every sw.js PRECACHE_SHELL path and every
 * assets/ reference in code/CSS/HTML must exist on disk.
 * Usage: node scripts/check-assets.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let missing = 0;

// 1) PRECACHE_SHELL entries
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const shellBlock = sw.slice(sw.indexOf('PRECACHE_SHELL = ['), sw.indexOf('];'));
const shellPaths = [...shellBlock.matchAll(/'([^']+)'/g)].map((m) => m[1]);
for (const p of shellPaths) {
  const rel = p === '/' ? 'index.html' : p.replace(/^\//, '');
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`MISSING (PRECACHE_SHELL): ${p}`);
    missing++;
  }
}
console.log(`PRECACHE_SHELL: ${shellPaths.length} paths checked`);

// 2) assets/ references in code / css / html / manifest
const files = [
  'index.html',
  'manifest.webmanifest',
  ...fs.readdirSync(path.join(root, 'js')).map((f) => `js/${f}`),
  ...fs.readdirSync(path.join(root, 'css')).map((f) => `css/${f}`),
  'assets/fonts/baloo2.css',
  'assets/fonts/nunito.css',
];
const seen = new Set();
for (const f of files) {
  const text = fs.readFileSync(path.join(root, f), 'utf8');
  for (const m of text.matchAll(/assets\/[\w./-]+\.(?:png|webp|svg|woff2|ogg|mp3|css|json)/g)) {
    const rel = m[0];
    if (seen.has(rel)) continue;
    seen.add(rel);
    if (!fs.existsSync(path.join(root, rel))) {
      console.error(`MISSING (referenced in ${f}): ${rel}`);
      missing++;
    }
  }
}
console.log(`Code/CSS references: ${seen.size} unique asset paths checked`);

// 3) voice-reaction clips generated from CONFIG.assets.voice counts
const { CONFIG } = await import(path.join(root, 'js/config.js'));
const v = CONFIG.assets.voice;
const voicePaths = [];
for (const n of v.correct) voicePaths.push(`${v.dir}/vo_correct_${n}_id.mp3`, `${v.dir}/vo_correct_${n}_en.mp3`);
for (const n of v.stuck) voicePaths.push(`${v.dir}/vo_stuck_${n}_id.mp3`, `${v.dir}/vo_stuck_${n}_en.mp3`);
for (const lang of ['id', 'en']) for (const n of v.leveldone[lang]) voicePaths.push(`${v.dir}/vo_leveldone_${n}_${lang}.mp3`);
for (const n of v.hello) voicePaths.push(`${v.dir}/vo_hello_${n}_id.mp3`, `${v.dir}/vo_hello_${n}_en.mp3`);
// Friend voice pools (friend 'stuck' files are named vo_{friend}_hmm_*)
for (const [fid, pool] of Object.entries(v.friends || {})) {
  for (const [kind, nums] of Object.entries(pool)) {
    if (kind === 'tada') {
      voicePaths.push(nums);
      continue;
    }
    const fileKind = kind === 'stuck' ? 'hmm' : kind;
    for (const lang of ['id', 'en']) {
      for (const n of nums) voicePaths.push(`${v.dir}/vo_${fid}_${fileKind}_${n}_${lang}.mp3`);
    }
  }
}
// Friend character images (base/jump/sticker)
const friendImages = Object.values(CONFIG.assets.friends || {}).flatMap((f) => [f.base, f.jump, f.sticker]);
for (const p of [...voicePaths, ...friendImages, ...Object.values(CONFIG.assets.sfx), CONFIG.assets.bgm, ...Object.values(CONFIG.assets.backgrounds), ...Object.values(CONFIG.assets.uiIcons).flat()]) {
  if (!fs.existsSync(path.join(root, p))) {
    console.error(`MISSING (CONFIG): ${p}`);
    missing++;
  }
}
console.log(`CONFIG assets: ${voicePaths.length} voice clips + ${friendImages.length} friend images + sfx/bgm/backgrounds/ui-icons checked`);

if (missing) {
  console.error(`\nFAIL: ${missing} missing path(s)`);
  process.exit(1);
}
console.log('\nOK: all referenced assets exist on disk');
