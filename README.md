# Poppu Typing Kids

**Belajar Mengetik Sambil Bermain** · *Learn Typing While Playing*

Educational typing game for ages **5–6**, with light **Poppu World** branding.  
HTML · CSS · Vanilla JS · static deploy on Vercel · **no-fail** design.

| | |
|--|--|
| **Live** | https://typing.poppu.world |
| **Version** | 2.0.1 |
| **Folder** | `/Users/brian/Grok/typing-kids-indonesia` |
| **Full docs** | **[GAME.md](./GAME.md)** ← complete product manual |

---

## Quick start

```bash
cd /Users/brian/Grok/typing-kids-indonesia
npm run dev
```

→ http://localhost:3000

```bash
npm test              # unit
npm run test:e2e      # Playwright
npm run perf:smoke    # size / shell checks
```

---

## What’s inside

- 4 modes: **Easy · Medium · Hard · Letters A–Z**
- **Poppu map** (ABC Beach · Typing Meadow · Star Castle)
- Mini **5★** / Full **10★**, journey path, stickers, friendship hearts
- ID / EN, voice pack + TTS, OSK (mobile-safe), classroom codes
- PWA progressive offline, parent dashboard, certificate share

---

## Deploy

Vercel project: **`typing-kids-indonesia`**  
Framework: static (no build). See [GAME.md §4](./GAME.md#4-production-deploy-vercel).

```bash
npx vercel --prod
```

---

## License

MIT · Poppu World IP assets — see `assets/brand/poppu/ATTRIBUTION.md`

**Full documentation:** [GAME.md](./GAME.md)
