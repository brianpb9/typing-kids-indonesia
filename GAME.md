# Poppu Typing Kids

**Full game documentation · v2.0.1**

| | |
|--|--|
| **Product name** | Poppu Typing Kids |
| **Tagline (ID)** | Belajar Mengetik Sambil Bermain |
| **Tagline (EN)** | Learn Typing While Playing |
| **Brand** | Poppu World ([poppu.world](https://www.poppu.world)) |
| **Audience** | Ages **5–6** (TK / early primary) |
| **Stack** | HTML · CSS · Vanilla ES modules (no framework) |
| **Deploy** | Static site · [Vercel](https://typing.poppu.world) |
| **Repo folder** | `/Users/brian/Grok/typing-kids-indonesia` |
| **Vercel project** | `typing-kids-indonesia` |
| **Production URL** | https://typing.poppu.world |
| **License** | MIT |

---

## 1. What it is

An **educational typing game** for young children. The loop is simple and **no-fail**:

1. See a picture (or big letter)  
2. Hear the word (voice pack MP3, TTS fallback)  
3. Type letters on **QWERTY** or **on-screen keyboard**  
4. Green feedback, stars, Poppu cheers  
5. Collect stars → mission complete → certificate / share  

Wrong keys never end the game — the child can always try again.

Poppu is a **light host character** (mascot, map, journey, stickers, friendship). Core learning content stays general vocabulary (fruits, animals, colors, etc.).

---

## 2. How to play (child / parent)

### 2.1 Start screen

- Language: **Bahasa** / **English**  
- **Poppu Map** (3 stations):  
  - 🏖️ **ABC Beach** → Letters A–Z warm-up  
  - 🌼 **Typing Meadow** → Word mission (easy)  
  - 🏰 **Star Castle** → Hard mode  
- Mission length: **Mini 5★** or **Full 10★**  
- Modes (also manual): Easy · Medium · Hard · Letters  
- Theme chips (Buah, Hewan, Warna, …)  
- Daily mission · Weekly mission  
- Sticker book · Parent dashboard · Classroom  
- **Start Mission**

### 2.2 In game

| Control | Action |
|---------|--------|
| Letters A–Z (keyboard or OSK) | Type the next letter |
| Speaker button / image tap | Hear the word again |
| **← Kembali** / floating **←** / **Esc** | Exit to home |
| Mute 🔊 | Toggle sound |

### 2.3 Modes

| Mode | What the child sees | Notes |
|------|---------------------|--------|
| **Easy** | Full word + big letter + slots + dim typed letters | Letter TTS on correct key |
| **Medium** | Full word + slots (**no** big single letter) | Harder spelling focus |
| **Hard** | Image + voice only + **timer** (35s, one +10s bonus) | Timeout = soft skip (no-fail) |
| **Letters** | Single big letter A–Z | Warm-up / station ABC |

### 2.4 Progress & fun systems

- **Stars** per mission (5 or 10)  
- **Journey path** — Poppu walks along nodes as stars rise  
- **Combo** — consecutive words without mid-word mistakes  
- **Lucky star** — rare bonus after combo ≥ 3  
- **Perfect word** — zero wrongs on that word → special praise  
- **Stickers** — first time a word is finished → sticker unlock  
- **Sticker book** — tap sticker to hear word again  
- **Friendship hearts** — 5 levels with Poppu (by total stars + stickers)  
- **Ranks** — Pemula → Legenda (lifetime stars)  
- **Daily / weekly** missions (seeded by date)  
- **Classroom** — 4-char code shared mission (local, no server)  
- **Victory** — summary, share, certificate PNG  

---

## 3. Local development

### Requirements

- Node.js **≥ 18** (for tests / Playwright)  
- Or any static server (Python, etc.)

### Run

```bash
cd /Users/brian/Grok/typing-kids-indonesia
npm run dev
```

Open **http://localhost:3000**

Other:

```bash
npm start          # same as dev
python3 -m http.server 3000
```

> Do **not** open `index.html` via `file://` — `fetch` for JSON/data will fail.

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local server port 3000 |
| `npm test` | Unit tests (Node test runner) |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:e2e:install` | Install Chromium for Playwright |
| `npm run perf:smoke` | Payload size + shell budget checks |

---

## 4. Production deploy (Vercel)

**Project name:** `typing-kids-indonesia`  
**Main URL:** https://typing.poppu.world  

### Settings

| Setting | Value |
|---------|--------|
| Framework | Other / static |
| Build command | *(empty)* |
| Output directory | `.` (root) |

### CLI

```bash
cd /Users/brian/Grok/typing-kids-indonesia
npx vercel --prod
```

`vercel.json` sets:

- Security headers (CSP, XFO, nosniff, HSTS via Vercel)  
- Cache for `/assets/*`, `/data/*`  
- Clean URLs  

---

## 5. Project structure

```
typing-kids-indonesia/
├── index.html                 # App shell + UI
├── package.json               # Scripts (no runtime deps)
├── vercel.json                # Deploy headers / cache
├── manifest.webmanifest       # PWA
├── sw.js                      # Service worker (v22 progressive)
├── playwright.config.js
├── README.md                  # Short overview
├── GAME.md                    # This full documentation
├── QC-REPORT.md               # Optional QA notes
│
├── css/
│   ├── styles.css             # Layout, mobile, brand, OSK
│   └── animations.css
│
├── js/
│   ├── main.js                # Boot
│   ├── config.js              # CONFIG + modes + features
│   ├── game.js                # Core game loop
│   ├── ui.js                  # DOM / screens
│   ├── words.js               # Word bank load/filter
│   ├── audio.js               # SFX + voice pack + TTS
│   ├── input.js               # Keyboard + OSK (touch-aware)
│   ├── i18n.js                # ID + EN strings
│   ├── storage.js             # localStorage progress
│   ├── animation.js           # Confetti / canvas FX
│   ├── daily.js / weekly.js   # Seeded missions
│   ├── classroom.js           # Class codes
│   ├── achievements.js        # Badges
│   ├── letters.js             # A–Z bank
│   ├── friendship.js          # Friendship levels
│   ├── certificate.js         # Victory PNG
│   ├── preload.js / cache.js  # Asset warm / SW messages
│   ├── analytics.js           # Local opt-in events
│   └── preload helpers
│
├── data/
│   ├── words.json             # 100 Indonesian words
│   └── words-en.json          # 100 English words
│
├── assets/
│   ├── brand/poppu/           # Mascot + PWA icons
│   ├── images/                # Word pictures (OpenMoji + SVG)
│   ├── audio/voice/           # MP3 pack ID + EN + manifest
│   └── fonts/                 # Self-hosted Nunito
│
├── tests/                     # Node unit tests
└── e2e/                       # Playwright (smoke, deep, mobile, offline, perf)
```

---

## 6. Architecture (short)

```
main.js
  └── Game
        ├── WordBank          data/words*.json
        ├── AudioManager      voice pack → TTS fallback
        ├── InputManager      physical keys + OSK (no iOS keyboard on touch)
        ├── UI                screens, map, stickers, journey
        ├── AnimationManager  confetti
        └── storage           localStorage key typingKidsID_v1
```

- **Modules:** ES modules (`type="module"`)  
- **No build step** for production  
- **State machine:** `boot → start → tutorial? → playing → celebrating → milestone? → victory`  
- **Persistence:** stars, mastery, stickers, streak, mute, language, class code, achievements, a11y  

---

## 7. Configuration (`js/config.js`)

Important knobs:

| Key | Meaning |
|-----|---------|
| `app.name` / `app.brand` | Poppu Typing Kids branding |
| `modes.easy\|medium\|hard\|letters` | Visibility of word / letter / timer |
| `gameplay.miniTarget` / `fullTarget` | 5 vs 10 stars |
| `gameplay.hardBonusSeconds` | +10s hard timer once |
| `features.*` | Feature flags (journey, stickers, worldMap, …) |
| `goals.ranks` | Lifetime rank thresholds |

---

## 8. Content

### Words

- **100** Indonesian entries in `data/words.json`  
- **100** English entries in `data/words-en.json`  
- Fields (typical): `id`, `word`, `display`, `category`, `image`, `letters`  
- Categories: buah, hewan, sehari-hari, kendaraan, warna, makanan, tubuh  
- Special filter: **huruf-susah** (harder letters / longer words)  

### Images

- Path under `assets/images/`  
- Mix of OpenMoji-style icons, solid color swatches, custom SVG  

### Voice

- `assets/audio/voice/manifest.json`  
- Folders `id/` and `en/` MP3s (word ids + phrases like `_praise_great`)  
- Prefer pack; fall back to `speechSynthesis`  

### Brand assets

| File | Use |
|------|-----|
| `poppu-idle.png` | Start + journey + in-game |
| `poppu-happy.png` | Victory + cheer |
| `icon-192.png` / `icon-512.png` | PWA |
| `favicon-64.png` | Browser tab |

Source library (originals):  
`/Users/brian/HDRV/GAME-ASSET-LIBRARY V.1/POPPU-WORLD`  
See `assets/brand/poppu/ATTRIBUTION.md`.

---

## 9. Mobile

- Viewport: `width=device-width`, `viewport-fit=cover`  
- **On-screen QWERTY** primary on touch devices  
- Hidden input is **not** force-focused on touch (avoids system keyboard covering the game)  
- Safe-area padding for notch / home indicator  
- Sticky OSK, larger tap targets  
- E2E: `e2e/mobile.spec.js` (390×844)  

---

## 10. PWA / offline

- Service worker: `sw.js` (**typing-kids-v22**)  
- **Install:** app shell only (fast)  
- **Activate / idle:** warm voice pack + word images  
- Client can `postMessage({ type: 'WARM_MEDIA' })`  
- Manifest: name **Poppu Typing Kids**, short **Poppu Type**  

---

## 11. Internationalization

- `js/i18n.js` — full **ID** and **EN** string tables  
- UI language toggle updates DOM + speech language + word JSON path  
- Milestones, modes, parent copy, Poppu bubbles all dual-language  

---

## 12. Classroom mode

- Generate or join a **4-character code**  
- Same code → same mode / category / target (hash seed, no server)  
- Share link with `?class=CODE`  
- Optional student name + local scoreboard + CSV export  
- Free **Start** does **not** force class params — use **Main kelas**  

---

## 13. Parent features

- Collapsible **parent dashboard** (stars, accuracy, play time, badges)  
- **Accessibility:** high contrast, large text  
- Optional **local analytics** opt-in (no network)  
- Victory: summary list, **share**, **certificate** PNG  

---

## 14. Testing

```bash
npm test                 # unit
npm run test:e2e         # full Playwright
npm run perf:smoke       # size / shell budgets
```

Coverage includes:

- Mode matrix, word data integrity, voice pack files  
- Daily/weekly seed rules, classroom codes, friendship levels  
- Brand pack presence  
- E2E: start, EN, modes, OSK, letters, class free-start, hard timer, back, mini mission, map, victory, mute, mobile, offline best-effort, perf  

---

## 15. Controls reference

| Input | Action |
|-------|--------|
| Start / Enter (on start screen) | Begin mission |
| A–Z | Type target letter |
| OSK keys | Same as A–Z (mobile) |
| Speak button | Replay word audio |
| ← Kembali / Esc | Home |
| Mute | SFX + speech mute |
| ? Help | Tutorial overlay |

---

## 16. Design principles

1. **No-fail** — mistakes only nudge, never punish with game over  
2. **Poppu light IP** — host character, not full rebrand of every asset  
3. **Mobile-first touch** — OSK over system keyboard  
4. **Offline-capable** — progressive SW + self-hosted fonts  
5. **Static deploy** — no backend required for core play  

---

## 17. Version history (high level)

| Version | Highlights |
|---------|------------|
| 1.x | Core typing, 3 modes, 100 words, EN, voice pack, daily/classroom |
| 1.7–1.8 | Polish QA, back button, Poppu brand light, mobile OSK, offline |
| 1.9 | Journey, stickers, mini mission, combo/lucky |
| **2.0** | World map, friendship, perfect word |
| **2.0.1** | Mobile-first polish (safe-area, touch focus, OSK) |

---

## 18. Support / next ideas (optional)

Not required for “done”:

- More words (150–200) + images + voice  
- Custom domain  
- Seasonal events / outfits  
- Online class leaderboard (needs backend)  

---

## 19. Credits

- **Game:** Poppu Typing Kids (static web)  
- **IP / mascot:** Poppu World · HDRV asset library  
- **Word icons:** OpenMoji-style assets + custom SVG / solid colors  
- **Fonts:** Nunito (self-hosted)  

---

*Document generated for Poppu Typing Kids v2.0.1 · full product reference*
